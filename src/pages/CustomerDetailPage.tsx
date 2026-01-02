import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, updateDoc, arrayUnion, query, collection, where, getDocs, orderBy } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useBookings } from '../hooks/useBookings';
import { useSeasonPasses } from '../hooks/useSeasonPasses';
import type { EnrichedUser, ActivePass, UserRole } from '../types/user';
import LoadingSpinner from '../components/common/LoadingSpinner';
import PassActivationModal from '../components/admin/PassActivationModal';
import EditPassModal from '../components/admin/EditPassModal';
import { motion, useAnimation, type PanInfo } from 'framer-motion';
import { 
  ArrowLeftIcon, 
  UserCircleIcon, 
  CalendarDaysIcon, 
  TicketIcon, 
  GiftIcon,
  PencilIcon,
  CheckIcon,
  XMarkIcon,
  PencilSquareIcon,
  TrashIcon
} from '@heroicons/react/24/outline';
import { format } from 'date-fns';
// Keep for other uses if any? No, user said unused.
// But wait, line 636 uses `locale: zhTW`.
// So `zhTW` IS used in current file?
// Checking file...
// Line 636: `{format(booking.dateTime, 'yyyy-MM-dd HH:mm', { locale: zhTW })}`
// Wait, that line was in the OLD `CustomerBookingHistory`.
// I replaced `CustomerBookingHistory` implementation with `BookingOrderCard`.
// `BookingOrderCard` has its own `format`.
// So `zhTW` in `CustomerDetailPage` might indeed be unused now if I removed the old rendering.
// Let's check imports.

import BookingOrderCard from '../components/admin/BookingOrderCard';
import { updateBookingStatus } from '../utils/bookingActions';
import { useToast } from '../context/ToastContext';

type TabKey = 'info' | 'bookings' | 'loyalty' | 'passes';

const CustomerDetailPage: React.FC = () => {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  
  const [user, setUser] = useState<EnrichedUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabKey>('info');
  
  // Edit mode for notes
  const [isEditingNotes, setIsEditingNotes] = useState(false);
  const [notesText, setNotesText] = useState('');
  const [isSavingNotes, setIsSavingNotes] = useState(false);
  
  // Pass Modal
  const [isPassModalOpen, setIsPassModalOpen] = useState(false);

  // Role update
  const [isUpdatingRole, setIsUpdatingRole] = useState(false);

  // Edit Pass
  const { passes: allSeasonPasses } = useSeasonPasses();
  const [isEditPassModalOpen, setIsEditPassModalOpen] = useState(false);
  const [editingPass, setEditingPass] = useState<ActivePass | null>(null);
  // Store the index of the pass being edited to identify it in the array
  const [editingPassIndex, setEditingPassIndex] = useState<number>(-1);

  // Fetch user data
  useEffect(() => {
    const fetchUser = async () => {
      if (!userId) return;
      try {
        const userDoc = await getDoc(doc(db, 'users', userId));
        if (userDoc.exists()) {
          setUser({ id: userDoc.id, ...userDoc.data() } as EnrichedUser);
          setNotesText(userDoc.data().notes || '');
        }
      } catch (error) {
        console.error('Error fetching user:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, [userId]);

  // Fetch Coupons & History
  const [coupons, setCoupons] = useState<any[]>([]);
  const [pointHistory, setPointHistory] = useState<any[]>([]);

  useEffect(() => {
    if (!userId) return;
    const fetchData = async () => {
        try {
            // Coupons
            const couponsQ = query(collection(db, 'user_coupons'), where('userId', '==', userId));
            const couponsSnap = await getDocs(couponsQ);
            setCoupons(couponsSnap.docs.map(d => ({ id: d.id, ...d.data() })));
            
            // Point History
            const historyQ = query(collection(db, 'point_history'), where('userId', '==', userId), orderBy('createdAt', 'desc'));
            const historySnap = await getDocs(historyQ);
            setPointHistory(historySnap.docs.map(d => ({ id: d.id, ...d.data() })));
        } catch (e) {
            console.error(e);
        }
    }
    if (activeTab === 'loyalty') {
        fetchData();
    }
  }, [userId, activeTab]);

  // Handle notes save
  const handleSaveNotes = async () => {
    if (!userId) return;
    setIsSavingNotes(true);
    try {
      await updateDoc(doc(db, 'users', userId), { notes: notesText });
      setUser(prev => prev ? { ...prev, notes: notesText } : null);
      setIsEditingNotes(false);
    } catch (error) {
      console.error('Error saving notes:', error);
    } finally {
      setIsSavingNotes(false);
    }
  };

  // Handle pass activation
  const handleActivatePass = async (pass: ActivePass) => {
    if (!userId) return;
    await updateDoc(doc(db, 'users', userId), {
      activePasses: arrayUnion(pass)
    });
    // Refresh user data
    const userDoc = await getDoc(doc(db, 'users', userId));
    if (userDoc.exists()) {
      setUser({ id: userDoc.id, ...userDoc.data() } as EnrichedUser);
    }
    setIsPassModalOpen(false);
  };

  // Handle role change
  const handleRoleChange = async (newRole: UserRole) => {
    if (!userId || !user) return;
    setIsUpdatingRole(true);
    try {
      await updateDoc(doc(db, 'users', userId), { role: newRole });
      setUser(prev => prev ? { ...prev, role: newRole } : null);
    } catch (error) {
      console.error('Error updating role:', error);
    } finally {
      setIsUpdatingRole(false);
    }
  };

  // Helper to find item details
  const getItemDetails = (passId: string, itemId: string) => {
    const originalPass = allSeasonPasses.find(p => p.id === passId);
    if (!originalPass) return null;
    return originalPass.contentItems.find(i => i.id === itemId);
  };

  // Handle delete entire pass
  const handleDeletePass = async (passIndex: number) => {
    if (!userId || !user || !user.activePasses) return;
    
    // We confirm in the UI handler usually, but here just in case.
    // The slide action will trigger this.

    const newActivePasses = [...user.activePasses];
    newActivePasses.splice(passIndex, 1);

    try {
      await updateDoc(doc(db, 'users', userId), { activePasses: newActivePasses });
      setUser({ ...user, activePasses: newActivePasses });
    } catch (error) {
      console.error('Error deleting pass:', error);
      alert('刪除方案失敗');
    }
  };

  // Handle edit pass save
  const handleEditPassSave = async (_: string, updates: Partial<ActivePass>) => {
    if (!userId || !user || !user.activePasses || editingPassIndex === -1) return;

    const newActivePasses = [...user.activePasses];
    // Merge updates into the specific pass
    newActivePasses[editingPassIndex] = { 
        ...newActivePasses[editingPassIndex], 
        ...updates 
    };

    try {
        await updateDoc(doc(db, 'users', userId), { activePasses: newActivePasses });
        setUser({ ...user, activePasses: newActivePasses });
    } catch (error) {
        console.error('Error updating pass:', error);
        throw error; // Let modal handle error state
    }
  };

  const tabs = [
    { key: 'info' as TabKey, label: '基本資料', icon: UserCircleIcon },
    { key: 'bookings' as TabKey, label: '預約紀錄', icon: CalendarDaysIcon },
    { key: 'loyalty' as TabKey, label: '點數優惠', icon: GiftIcon },
    { key: 'passes' as TabKey, label: '季卡方案', icon: TicketIcon },
  ];

  if (loading) return <LoadingSpinner fullScreen />;
  if (!user) return <div className="p-8 text-center text-gray-500">找不到該用戶</div>;

  return (
    <div className="min-h-screen bg-[#FAF9F6] overflow-x-hidden w-full">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 sticky top-0 z-30">
        <div className="px-3 sm:px-4 py-3 sm:py-4 max-w-4xl mx-auto">
          <div className="flex items-center justify-between gap-3">
            {/* Left: Back & User Info */}
            <div className="flex items-center gap-3 min-w-0 overflow-hidden">
                <button 
                onClick={() => navigate('/admin/customers')}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors flex-shrink-0"
                >
                <ArrowLeftIcon className="w-5 h-5 text-gray-600" />
                </button>
                <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-base sm:text-lg overflow-hidden flex-shrink-0">
                    {user.profile.avatarUrl ? (
                    <img src={user.profile.avatarUrl} alt="" className="w-full h-full object-cover" />
                    ) : (
                    (user.profile.displayName || '?')[0]
                    )}
                </div>
                <div className="min-w-0">
                    <h1 className="text-base sm:text-lg font-bold text-gray-900 truncate">{user.profile.displayName || '未命名'}</h1>
                    <p className="text-xs sm:text-sm text-gray-500 truncate">{user.email || user.lineUserId?.slice(0, 10) + '...'}</p>
                </div>
                </div>
            </div>
            
            {/* Right: Quick Actions */}
            <div className="flex-shrink-0 ml-2">
                <button
                    onClick={() => navigate(`/booking?behalfOf=${userId}`)}
                    className="px-3 sm:px-4 py-2 bg-[#9F9586] text-white rounded-lg text-sm font-bold shadow-sm hover:bg-[#8a8174] transition-colors flex items-center gap-1 sm:gap-2 whitespace-nowrap"
                >
                    <CalendarDaysIcon className="w-4 h-4" />
                    <span className="hidden xs:inline sm:inline">新增預約</span>
                    <span className="xs:hidden sm:hidden">預約</span>
                </button>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b border-gray-100 sticky top-[57px] sm:top-[65px] z-20">
        <div className="max-w-4xl mx-auto">
          <nav className="flex overflow-x-auto scrollbar-hide -mb-px" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
            {tabs.map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-1 sm:gap-1.5 px-3 sm:px-4 py-3 text-xs sm:text-sm font-medium border-b-2 transition-colors whitespace-nowrap flex-shrink-0 ${
                  activeTab === tab.key
                    ? 'border-primary text-primary'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                <span className="hidden xs:inline sm:inline">{tab.label}</span>
                <span className="xs:hidden sm:hidden">{tab.label.slice(0, 2)}</span>
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Content */}
      <div className="px-3 sm:px-4 py-4 sm:py-6 max-w-4xl mx-auto">
        {/* Tab: Info */}
        {activeTab === 'info' && (
          <div className="space-y-4 sm:space-y-6">
            <div className="bg-white rounded-xl p-4 sm:p-6 border border-gray-100 shadow-sm">
              <h2 className="font-bold text-gray-900 mb-3 sm:mb-4 text-sm sm:text-base">用戶資訊</h2>
              <dl className="space-y-3 text-sm">
                <div className="flex justify-between items-center">
                  <dt className="text-gray-500">角色</dt>
                  <dd>
                    <select
                      value={user.role}
                      onChange={(e) => handleRoleChange(e.target.value as UserRole)}
                      disabled={isUpdatingRole}
                      className={`p-1.5 border rounded-lg text-xs font-medium ${
                        user.role === 'admin' ? 'bg-red-100 text-red-700 border-red-200' : 
                        user.role === 'manager' ? 'bg-indigo-100 text-indigo-700 border-indigo-200' :
                        user.role === 'platinum' ? 'bg-amber-100 text-amber-700 border-amber-200' : 
                        user.role === 'designer' ? 'bg-purple-100 text-purple-700 border-purple-200' :
                        'bg-gray-100 text-gray-600 border-gray-200'
                      }`}
                    >
                      <option value="admin">管理員</option>
                      <option value="manager">管理設計師</option>
                      <option value="designer">設計師</option>
                      <option value="platinum">白金會員</option>
                      <option value="user">一般會員</option>
                    </select>
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-gray-500">點數</dt>
                  <dd className="font-medium">{user.loyaltyPoints || 0} 點</dd>
                </div>
              </dl>
            </div>
            
            {/* Notes Section */}
            <div className="bg-white rounded-xl p-4 sm:p-6 border border-gray-100 shadow-sm">
              <div className="flex items-center justify-between mb-3 sm:mb-4">
                <h2 className="font-bold text-gray-900 text-sm sm:text-base">備註</h2>
                {!isEditingNotes && (
                  <button 
                    onClick={() => setIsEditingNotes(true)}
                    className="text-primary text-sm font-medium flex items-center gap-1"
                  >
                    <PencilIcon className="w-4 h-4" /> 編輯
                  </button>
                )}
              </div>
              {isEditingNotes ? (
                <div className="space-y-3">
                  <textarea 
                    value={notesText}
                    onChange={(e) => setNotesText(e.target.value)}
                    className="w-full p-3 border border-gray-200 rounded-lg focus:ring-primary focus:border-primary text-sm"
                    rows={4}
                    placeholder="輸入備註..."
                  />
                  <div className="flex gap-2 justify-end">
                    <button 
                      onClick={() => { setIsEditingNotes(false); setNotesText(user.notes || ''); }}
                      className="px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded-lg flex items-center gap-1"
                    >
                      <XMarkIcon className="w-4 h-4" /> 取消
                    </button>
                    <button 
                      onClick={handleSaveNotes}
                      disabled={isSavingNotes}
                      className="px-3 py-1.5 text-sm bg-primary text-white rounded-lg flex items-center gap-1 disabled:opacity-50"
                    >
                      <CheckIcon className="w-4 h-4" /> {isSavingNotes ? '儲存中...' : '儲存'}
                    </button>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-gray-600">{user.notes || <span className="text-gray-400 italic">無備註</span>}</p>
              )}
            </div>
          </div>
        )}

        {/* Tab: Bookings */}
        {activeTab === 'bookings' && (
          <CustomerBookingHistory userId={userId || ''} userName={user.profile.displayName || ''} />
        )}

        {/* Tab: Loyalty */}
        {activeTab === 'loyalty' && (
          <div className="space-y-4 sm:space-y-6">
             {/* Points Summary */}
             <div className="bg-white rounded-xl p-4 sm:p-6 border border-gray-100 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
                <div>
                    <h2 className="font-bold text-gray-900 mb-1 text-sm sm:text-base">現有點數</h2>
                    <p className="text-gray-500 text-xs sm:text-sm">可用於折抵消費或兌換獎勵</p>
                </div>
                <div className="text-left sm:text-right w-full sm:w-auto">
                    <p className="text-2xl sm:text-3xl font-bold text-primary">{user.loyaltyPoints || 0}</p>
                    <p className="text-xs text-gray-400 mt-1 truncate">累積總點數: {pointHistory.reduce((acc, curr) => acc + (curr.points > 0 ? curr.points : 0), 0)}</p>
                </div>
             </div>

             {/* Coupons */}
             <div className="bg-white rounded-xl p-4 sm:p-6 border border-gray-100 shadow-sm">
                <h3 className="font-bold text-gray-900 mb-3 sm:mb-4 flex items-center gap-2 text-sm sm:text-base">
                    <TicketIcon className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 flex-shrink-0" />
                    持有優惠券 ({coupons.length})
                </h3>
                {coupons.length > 0 ? (
                    <div className="grid grid-cols-1 gap-3 sm:gap-4">
                        {coupons.map(coupon => (
                             <div key={coupon.id} className={`border rounded-xl p-4 flex justify-between items-start ${coupon.isUsed || (coupon.validUntil && coupon.validUntil.toDate() < new Date()) ? 'bg-gray-50 border-gray-200 opacity-60' : 'bg-white border-amber-200'}`}>
                                <div className="min-w-0 pr-2">
                                    <h4 className="font-bold text-gray-800 truncate">{coupon.title}</h4>
                                    <p className="text-xs text-gray-500 mt-1 truncate">{coupon.description}</p>
                                    <div className="mt-2 flex items-center gap-2 flex-wrap">
                                        <span className="text-xs font-mono bg-gray-100 px-2 py-0.5 rounded text-gray-600">{coupon.code}</span>
                                        {coupon.isUsed ? <span className="text-xs text-red-500 font-bold whitespace-nowrap">已使用</span> : <span className="text-xs text-green-600 font-bold whitespace-nowrap">可使用</span>}
                                    </div>
                                </div>
                                <div className="text-right flex-shrink-0">
                                     <span className="block text-lg font-bold text-primary whitespace-nowrap">
                                        {coupon.type === 'percentage' ? `${100 - coupon.value}% OFF` : `$${coupon.value}`}
                                     </span>
                                     {coupon.validUntil && (
                                         <p className="text-[10px] text-gray-400 mt-1 whitespace-nowrap">
                                             ~ {format(coupon.validUntil.toDate(), 'yyyy-MM-dd')}
                                         </p>
                                     )}
                                </div>
                             </div>
                        ))}
                    </div>
                ) : (
                    <p className="text-center text-gray-400 py-4 text-sm">尚無優惠券</p>
                )}
             </div>

             {/* Point History */}
             <div className="bg-white rounded-xl p-4 sm:p-6 border border-gray-100 shadow-sm">
                <h3 className="font-bold text-gray-900 mb-3 sm:mb-4 flex items-center gap-2 text-sm sm:text-base">
                    <CalendarDaysIcon className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
                    點數紀錄
                </h3>
                {pointHistory.length > 0 ? (
                    <div className="space-y-3">
                        {pointHistory.map(history => (
                            <div key={history.id} className="flex justify-between items-center text-sm border-b border-gray-50 last:border-0 pb-3 last:pb-0">
                                <div className="min-w-0 pr-2">
                                    <p className="font-medium text-gray-800 truncate">{history.description || '點數變動'}</p>
                                    <p className="text-xs text-gray-400 mt-0.5">{history.createdAt ? format(history.createdAt.toDate(), 'yyyy-MM-dd HH:mm') : '-'}</p>
                                </div>
                                <span className={`font-bold flex-shrink-0 ${history.points > 0 ? 'text-green-600' : 'text-red-500'}`}>
                                    {history.points > 0 ? '+' : ''}{history.points}
                                </span>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="text-center text-gray-400 py-4 text-sm">尚無點數紀錄</p>
                )}
             </div>
          </div>
        )}

        {/* Tab: Passes */}
        {activeTab === 'passes' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="font-bold text-gray-900">季卡方案</h2>
              <button 
                onClick={() => setIsPassModalOpen(true)}
                className="px-3 py-1.5 bg-primary text-white rounded-lg text-sm font-medium flex items-center gap-1"
              >
                <TicketIcon className="w-4 h-4" /> 開通新方案
              </button>
            </div>
            
            {user.activePasses && user.activePasses.length > 0 ? (
              <div className="space-y-3">
                {user.activePasses.map((pass, idx) => {
                  const expiry = pass.expiryDate.toDate();
                  const isExpired = expiry < new Date();
                  const totalRemaining = Object.values(pass.remainingUsages).reduce((a, b) => a + b, 0);
                  
                  return (
                    <SwipeablePassCard 
                        key={idx}
                        pass={pass} 
                        isExpired={isExpired} 
                        totalRemaining={totalRemaining}
                        expiry={expiry}
                        onEdit={() => {
                            setEditingPass(pass);
                            setEditingPassIndex(idx);
                            setIsEditPassModalOpen(true);
                        }}
                        onDelete={() => handleDeletePass(idx)}
                        getItemDetails={getItemDetails}
                    />
                  );
                })}
              </div>
            ) : (
              <div className="bg-white rounded-xl p-8 border border-gray-100 text-center text-gray-400">
                <TicketIcon className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>此用戶尚未持有任何季卡</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Pass Activation Modal */}
      <PassActivationModal
        isOpen={isPassModalOpen}
        onClose={() => setIsPassModalOpen(false)}
        onActivate={handleActivatePass}
        userName={user.profile.displayName || ''}
      />
      
      <EditPassModal
        isOpen={isEditPassModalOpen}
        onClose={() => setIsEditPassModalOpen(false)}
        pass={editingPass}
        allPasses={allSeasonPasses}
        onSave={handleEditPassSave}
      />
    </div>
  );
};

// Swipeable Card Component
const SwipeablePassCard = ({ pass, isExpired, expiry, onEdit, onDelete, getItemDetails }: any) => {
    const controls = useAnimation();
  
    const handleDragEnd = (_: any, info: PanInfo) => {
      const offset = info.offset.x;
      const velocity = info.velocity.x;
  
      if (offset < -60 || velocity < -500) {
        controls.start({ x: -80 }); 
      } else {
        controls.start({ x: 0 });
      }
    };
  
    const handleDelete = () => {
      if (window.confirm(`確定要刪除季卡 ${pass.passName} 嗎？刪除後無法復原。`)) {
        onDelete();
        controls.start({ x: 0 });
      } else {
        controls.start({ x: 0 });
      }
    };
  
    return (
      <div className="relative overflow-hidden rounded-xl">
        {/* Background (Delete Action) */}
        <div className="absolute inset-y-0 right-0 w-20 flex items-center justify-center bg-red-500 rounded-r-xl">
          <button 
            onClick={handleDelete}
            className="w-full h-full flex flex-col items-center justify-center text-white"
          >
            <TrashIcon className="w-6 h-6" />
            <span className="text-xs font-medium mt-1">刪除</span>
          </button>
        </div>
  
        {/* Card Content */}
        <motion.div 
            drag="x"
            dragConstraints={{ left: -80, right: 0 }}
            dragElastic={0.1}
            onDragEnd={handleDragEnd}
            animate={controls}
            className={`relative bg-white border shadow-sm ${isExpired ? 'opacity-70 border-gray-200' : 'border-amber-200'} z-10 rounded-xl overflow-hidden`}
        >
          {/* Header */}
          <div className={`px-4 py-3 flex justify-between items-start ${isExpired ? 'bg-gray-50' : 'bg-amber-50/50'}`}>
            <div>
              <p className="font-bold text-gray-900">
                {pass.passName}
                {pass.variantName && <span className="text-gray-500 font-normal ml-2">({pass.variantName})</span>}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                購買日: {format(pass.purchaseDate.toDate(), 'yyyy-MM-dd')}
              </p>
            </div>
            <div className="flex flex-col items-end gap-2">
               <div className="flex items-center gap-2">
                    <span className={`text-xs px-2 py-1 rounded-full ${isExpired ? 'bg-gray-100 text-gray-500' : 'bg-amber-100 hidden text-amber-700'}`}>
                        {isExpired ? '已過期' : ``}
                    </span>
                    <button 
                        onClick={onEdit}
                        className="p-1 text-gray-400 hover:text-gray-600 rounded hover:bg-black/5"
                    >
                        <PencilSquareIcon className="w-4 h-4" />
                    </button>
               </div>
              <p className={`text-xs mt-1 font-medium ${isExpired ? 'text-red-500' : 'text-gray-500'}`}>
                到期: {format(expiry, 'yyyy-MM-dd')}
              </p>
            </div>
          </div>
  
          {/* Content List */}
          <div className="p-4 space-y-2.5">
            {Object.entries(pass.remainingUsages).length > 0 ? (
                Object.entries(pass.remainingUsages).map(([itemId, quantity]: [string, any]) => {
                    const details = getItemDetails(pass.passId, itemId);
                    const name = details?.name || '未知項目';
                    const category = details?.category || '未知';
                    
                    return (
                        <div key={itemId} className="flex justify-between items-center text-sm border-b border-gray-50 last:border-0 pb-1 last:pb-0">
                             <div className="flex items-center gap-2 overflow-hidden">
                                <span className={`text-[10px] px-1.5 py-0.5 rounded border ${
                                    category === '服務' 
                                    ? 'bg-primary/10 text-primary border-primary/20' 
                                    : 'bg-indigo-50 text-indigo-600 border-indigo-100'
                                }`}>
                                    {category}
                                </span>
                                <span className="text-gray-700 truncate">{name}</span>
                             </div>
                             <span className="font-bold text-gray-400 text-xs">x{quantity}</span>
                        </div>
                    );
                })
            ) : (
                <p className="text-center text-xs text-gray-400 py-2">無可用項目</p>
            )}
          </div>
        </motion.div>
      </div>
    );
  };


// Sub-component for booking history
const CustomerBookingHistory: React.FC<{ userId: string; userName?: string }> = ({ userId, userName }) => {
  const { bookings, isLoading, refetch } = useBookings(userId);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const { showToast } = useToast();

  const handleUpdateStatus = async (booking: any, newStatus: any) => {
      setUpdatingId(booking.id || '');
      try {
          await updateBookingStatus(booking.id, newStatus);
          showToast(`訂單狀態已更新`, 'success');
          // Optimistic update or refetch
          if (refetch) refetch(); // Assuming useBookings has refetch, otherwise rely on realtime
      } catch (error) {
          console.error("Failed to update status:", error);
          showToast('更新失敗', 'error');
      } finally {
          setUpdatingId(null);
      }
  };

  if (isLoading) return <LoadingSpinner />;

  if (bookings.length === 0) {
    return (
      <div className="bg-white rounded-xl p-8 border border-gray-100 text-center text-gray-400">
        <CalendarDaysIcon className="w-12 h-12 mx-auto mb-3 opacity-50" />
        <p>此用戶尚無預約紀錄</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {bookings.map(booking => {
          // Enrich booking with user name if missing (since we are on customer page, we know who it is)
          const enrichedBooking = {
              ...booking,
              userName: userName || '客戶'
          };
          
          return (
            <BookingOrderCard
                key={booking.id}
                booking={enrichedBooking as any} // Cast to compatible type
                updatingId={updatingId}
                onUpdateStatus={handleUpdateStatus}
            />
          );
      })}
    </div>
  );
};

export default CustomerDetailPage;
