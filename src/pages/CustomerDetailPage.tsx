import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, updateDoc, arrayUnion } from 'firebase/firestore';
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
import { zhTW } from 'date-fns/locale';

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
    <div className="min-h-screen bg-[#FAF9F6]">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => navigate('/admin/customers')}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <ArrowLeftIcon className="w-5 h-5 text-gray-600" />
            </button>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-lg overflow-hidden">
                {user.profile.avatarUrl ? (
                  <img src={user.profile.avatarUrl} alt="" className="w-full h-full object-cover" />
                ) : (
                  (user.profile.displayName || '?')[0]
                )}
              </div>
              <div>
                <h1 className="text-lg font-bold text-gray-900">{user.profile.displayName || '未命名'}</h1>
                <p className="text-sm text-gray-500">{user.email}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b border-gray-100 overflow-hidden">
        <div className="px-4">
          <nav className="flex min0 scrollbar-hide -mb-px" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
            {tabs.map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-1.5 px-2 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap flex-shrink-0 ${
                  activeTab === tab.key
                    ? 'border-primary text-primary'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-6 max-w-4xl">
        {/* Tab: Info */}
        {activeTab === 'info' && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm">
              <h2 className="font-bold text-gray-900 mb-4">用戶資訊</h2>
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
                  <dt className="text-gray-500">忠誠點數</dt>
                  <dd className="font-medium">{user.loyaltyPoints || 0} 點</dd>
                </div>
              </dl>
            </div>
            
            {/* Notes Section */}
            <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-bold text-gray-900">備註</h2>
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
          <CustomerBookingHistory userId={userId || ''} />
        )}

        {/* Tab: Loyalty */}
        {activeTab === 'loyalty' && (
          <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm">
            <h2 className="font-bold text-gray-900 mb-4">點數與優惠券</h2>
            <div className="text-center py-8 text-gray-400">
              <GiftIcon className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>功能開發中...</p>
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
const CustomerBookingHistory: React.FC<{ userId: string }> = ({ userId }) => {
  const { bookings, isLoading } = useBookings();
  
  const userBookings = bookings.filter(b => b.userId === userId);

  if (isLoading) return <LoadingSpinner />;

  if (userBookings.length === 0) {
    return (
      <div className="bg-white rounded-xl p-8 border border-gray-100 text-center text-gray-400">
        <CalendarDaysIcon className="w-12 h-12 mx-auto mb-3 opacity-50" />
        <p>此用戶尚無預約紀錄</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {userBookings.map(booking => (
        <div key={booking.id} className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
          <div className="flex justify-between items-start">
            <div>
              <p className="font-medium text-gray-900">{booking.serviceNames.join(', ')}</p>
              <p className="text-sm text-gray-500 mt-1">
                {format(booking.dateTime, 'yyyy-MM-dd HH:mm', { locale: zhTW })}
              </p>
            </div>
            <span className={`text-xs px-2 py-1 rounded-full ${
              booking.status === 'completed' ? 'bg-green-100 text-green-700' :
              booking.status === 'cancelled' ? 'bg-red-100 text-red-700' :
              'bg-amber-100 text-amber-700'
            }`}>
              {booking.status === 'completed' ? '已完成' :
               booking.status === 'cancelled' ? '已取消' :
               booking.status === 'confirmed' ? '已確認' : '待確認'}
            </span>
          </div>
          <p className="text-sm text-primary font-medium mt-2">${booking.amount}</p>
        </div>
      ))}
    </div>
  );
};

export default CustomerDetailPage;
