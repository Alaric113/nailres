import { useState, useMemo, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useLocation } from 'react-router-dom';
import { format, isSameMonth } from 'date-fns';
import { zhTW } from 'date-fns/locale';
import { doc, getDoc, writeBatch, collection, getDocs, orderBy, query, where, limit, serverTimestamp } from 'firebase/firestore'; // Added imports
import { db } from '../lib/firebase';
import { useAllBookings, type EnrichedBooking } from '../hooks/useAllBookings';
import { useCurrentDesigner } from '../hooks/useCurrentDesigner'; // New hook
import { useAuthStore } from '../store/authStore'; // New hook
import type { BookingStatus } from '../types/booking';
import type { Designer } from '../types/designer'; // New type
import LoadingSpinner from '../components/common/LoadingSpinner';
import { useToast } from '../context/ToastContext';
import { 
  BanknotesIcon, 
  ClockIcon, 
  CheckCircleIcon, 
  CalendarDaysIcon,
  FunnelIcon,
  PencilSquareIcon,
  UserCircleIcon // New Icon
} from '@heroicons/react/24/outline';
import { useNavigate } from 'react-router-dom';
import OrderTypeTabs from '../components/admin/OrderTypeTabs';
import { updateBookingStatus } from '../utils/bookingActions';

// Stats Card Component
const StatCard = ({ title, value, icon: Icon, color, bgColor }: { title: string, value: string | number, icon: any, color: string, bgColor: string }) => (
  <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4 transition-transform hover:scale-[1.02]">
    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${bgColor} ${color}`}>
      <Icon className="w-6 h-6" />
    </div>
    <div>
      <p className="text-sm font-medium text-gray-500">{title}</p>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
    </div>
  </div>
);

const OrderManagementPage = () => {
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const location = useLocation();
  const navigate = useNavigate();
  const queryParams = new URLSearchParams(location.search);
  const [activeTab, setActiveTab] = useState<BookingStatus | 'all'>((queryParams.get('status') as BookingStatus) || 'all');
  
  const { showToast } = useToast();
  const { userProfile } = useAuthStore();
  
  // --- Designer Filtering Logic ---
  const { designer: currentDesigner } = useCurrentDesigner();
  const [allDesigners, setAllDesigners] = useState<Designer[]>([]);
  const [selectedDesignerFilter, setSelectedDesignerFilter] = useState<string | 'all'>('all');

  // Fetch all designers for admin selector
  useEffect(() => {
    if (userProfile?.role === 'admin' || userProfile?.role === 'manager') {
        const fetchDesigners = async () => {
            const q = query(collection(db, 'designers'), orderBy('name'));
            const snapshot = await getDocs(q);
            setAllDesigners(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Designer)));
        };
        fetchDesigners();
    }
  }, [userProfile?.role]);

  // Determine effective designer ID for querying
  const effectiveDesignerId = useMemo(() => {
    if (userProfile?.role === 'designer') {
        return currentDesigner?.id || null; // Force designer's own ID
    }
    return selectedDesignerFilter === 'all' ? null : selectedDesignerFilter;
  }, [userProfile?.role, currentDesigner, selectedDesignerFilter]);

  const { bookings, loading, error } = useAllBookings(null, effectiveDesignerId); // Pass filter

  // --- Stats Calculation ---
  const stats = useMemo(() => {
    const now = new Date();
    
    // Monthly Revenue (This Month)
    const monthlyRevenue = bookings
      .filter(b => isSameMonth(b.dateTime, now) && b.status !== 'cancelled')
      .reduce((acc, curr) => acc + curr.amount, 0);
    
    const pendingCount = bookings.filter(b => b.status === 'pending_confirmation' || b.status === 'pending_payment').length;
    // Monthly Completed Count (This Month)
    const completedCount = bookings.filter(b => b.status === 'completed' && isSameMonth(b.dateTime, now)).length;

    return { monthlyRevenue, pendingCount, completedCount };
  }, [bookings]);

  // --- Filter Logic ---
  const filteredBookings = useMemo(() => {
    let result = bookings;
    if (activeTab !== 'all') {
      result = result.filter(b => b.status === activeTab);
    }
    
    return result.sort((a, b) => {
        if (a.status.includes('pending') && !b.status.includes('pending')) return -1;
        if (!a.status.includes('pending') && b.status.includes('pending')) return 1;
        return b.dateTime.getTime() - a.dateTime.getTime();
    });
  }, [bookings, activeTab]);

  // --- Actions ---
  const grantLoyaltyPoints = async (batch: ReturnType<typeof writeBatch>, booking: EnrichedBooking) => {
    if (!booking.userId || booking.amount <= 0) return;
    try {
        // 1. Check if points already granted for this booking
        const historyRef = collection(db, 'point_history');
        const q = query(
            historyRef, 
            where('refId', '==', booking.id),
            where('type', '==', 'earned'),
            limit(1)
        );
        const historySnap = await getDocs(q);
        
        if (!historySnap.empty) {
            console.log(`Points already granted for booking ${booking.id}, skipping.`);
            return;
        }

        const settingsRef = doc(db, 'globals', 'settings');
        const settingsSnap = await getDoc(settingsRef);
        const loyaltySettings = settingsSnap.data()?.loyaltySettings;

        if (loyaltySettings && loyaltySettings.pointsPerAmount > 0) {
        const pointsEarned = Math.floor(booking.amount / loyaltySettings.pointsPerAmount);

        if (pointsEarned > 0) {
            const userRef = doc(db, 'users', booking.userId);
            const userSnap = await getDoc(userRef);
            const currentPoints = userSnap.data()?.loyaltyPoints || 0;
            batch.update(userRef, { loyaltyPoints: currentPoints + pointsEarned });

            // Create record in point_history
            // Use set on a custom ID or addDoc. 
            // Using addDoc for consistent history
            const newHistoryRef = doc(collection(db, 'point_history')); 
            batch.set(newHistoryRef, {
                userId: booking.userId,
                amount: pointsEarned,
                type: 'earned',
                reason: `完成預約 #${booking.id.substring(0, 6)}`,
                refId: booking.id,
                createdAt: serverTimestamp(), // Use serverTimestamp for consistency
            });
            
            // Legacy Log (Optional: Keep it if other parts use it, or deprecate)
            const logRef = doc(db, 'loyaltyPointLogs', `${booking.id}_${Date.now()}`);
            batch.set(logRef, {
                userId: booking.userId,
                pointsChange: pointsEarned,
                reason: `完成預約 #${booking.id.substring(0, 6)}`,
                createdAt: new Date(),
            });
        }
        }
    } catch (e) {
        console.error("Error granting points:", e);
    }
  };

  const sendLineNotification = (booking: EnrichedBooking, status: BookingStatus) => {
    fetch('/api/send-line-message', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        bookingId: booking.id,
        type: 'booking_notification',
        userId: booking.userId,
        serviceNames: booking.serviceNames,
        dateTime: booking.dateTime.toISOString(),
        amount: booking.amount,
        status: status
      }),
    }).catch(err => console.error("Failed to send LINE notification:", err));
  };

  const handleUpdateStatus = async (booking: EnrichedBooking, newStatus: BookingStatus) => {
    setUpdatingId(booking.id);
    try {
      // Use centralized utility for status update (handles Season Pass deduction)
      await updateBookingStatus(booking.id, newStatus);

      // Handle Loyalty Points (if completed)
      // Note: This is now a separate transaction from status update
      if (newStatus === 'completed' && booking.userId && booking.amount > 0) {
        const batch = writeBatch(db);
        await grantLoyaltyPoints(batch, booking);
        await batch.commit();
      }

      showToast(`訂單已更新：${getStatusLabel(newStatus)}`, 'success');
      
      if (['confirmed', 'completed', 'cancelled'].includes(newStatus)) {
        sendLineNotification(booking, newStatus);
      }

    } catch (error) {
      console.error("Failed to update booking status:", error);
      showToast('更新失敗', 'error');
    } finally {
      setUpdatingId(null);
    }
  };

  const getStatusLabel = (status: string) => {
      switch(status) {
          case 'pending_confirmation': return '待確認';
          case 'pending_payment': return '待付款';
          case 'confirmed': return '已確認';
          case 'completed': return '已完成';
          case 'cancelled': return '已取消';
          default: return status;
      }
  };

  const getStatusColor = (status: string) => {
    switch(status) {
        case 'pending_confirmation': return 'bg-orange-50 text-orange-700 border border-orange-100';
        case 'pending_payment': return 'bg-yellow-50 text-yellow-700 border border-yellow-100';
        case 'confirmed': return 'bg-green-50 text-green-700 border border-green-100';
        case 'completed': return 'bg-blue-50 text-blue-700 border border-blue-100';
        case 'cancelled': return 'bg-gray-50 text-gray-500 border border-gray-200';
        default: return 'bg-gray-50 text-gray-700';
    }
  };

  const tabs = [
      { id: 'all', label: '全部' },
      { id: 'pending_confirmation', label: '待確認' },
      { id: 'pending_payment', label: '待付款' },
      { id: 'confirmed', label: '已確認' },
      { id: 'completed', label: '已完成' },
      { id: 'cancelled', label: '已取消' },
  ];

  if (loading) return <div className="flex justify-center items-center h-full min-h-[50vh] bg-[#FAF9F6]"><LoadingSpinner /></div>;
  if (error) return <div className="text-red-500 text-center mt-10 p-4">讀取錯誤: {typeof error === 'string' ? error : JSON.stringify(error)}</div>;

  return (
    <div className="min-h-full bg-[#FAF9F6] pb-24 md:pb-12 pt-4 md:pt-8 w-full">
      <main className="container mx-auto px-4 max-w-3xl space-y-3">
        
        <OrderTypeTabs />

        {/* 1. Header & Stats (Horizontal Scroll on Mobile) */}
        <div className="">
            <div className="flex justify-between items-center">
                
                
                {/* Designer Filter (Admin/Manager Only) */}
                {(userProfile?.role === 'admin' || userProfile?.role === 'manager') && (
                    <>
                        {/* Mobile: Portal to Mobile Header */}
                        {document.getElementById('admin-mobile-header-actions') && createPortal(
                             <div className="flex items-center">
                                <UserCircleIcon className="w-5 h-5 text-gray-400  pointer-events-none" />
                                <select
                                    value={selectedDesignerFilter}
                                    onChange={(e) => setSelectedDesignerFilter(e.target.value)}
                                    // Remove background/border to blend with header, or keep minimal
                                    className="bg-transparent border-none text-xs font-medium text-gray-600 focus:ring-0 p-0 pr-2 dir-ltr"
                                    style={{ direction: 'ltr' }} // Trick to align text if needed, or just keep standard
                                >
                                    <option value="all">全店</option>
                                    {allDesigners.map(d => (
                                        <option key={d.id} value={d.id}>{d.name}</option>
                                    ))}
                                </select>
                                
                            </div>,
                            document.getElementById('admin-mobile-header-actions')!
                        )}

                        {/* Desktop: Portal to Header */}
                        {document.getElementById('admin-header-actions') && createPortal(
                            <div className="flex items-center gap-2">
                                <UserCircleIcon className="w-5 h-5 text-gray-400" />
                                <select
                                    value={selectedDesignerFilter}
                                    onChange={(e) => setSelectedDesignerFilter(e.target.value)}
                                    className="bg-white border border-gray-200 text-sm rounded-lg focus:ring-[#9F9586] focus:border-[#9F9586] block min-w-[150px]"
                                >
                                    <option value="all">所有設計師</option>
                                    {allDesigners.map(d => (
                                        <option key={d.id} value={d.id}>{d.name}</option>
                                    ))}
                                </select>
                            </div>,
                            document.getElementById('admin-header-actions')!
                        )}
                    </>
                )}
            </div>
            
            <section className=" overflow-x-auto snap-x snap-mandatory gap-2 pb-2 -mx-4 px-4 hide-scrollbar grid grid-cols-2 md:grid-cols-4 sm:gap-4 sm:pb-0 sm:mx-0 sm:px-0">
                <div className="snap-center col-span-2 shrink-0 w-[85vw] sm:w-auto">
                    <StatCard title="本月營收" value={`$${stats.monthlyRevenue.toLocaleString()}`} icon={BanknotesIcon} bgColor="bg-green-50" color="text-green-600" />
                </div>
                <div className="snap-center shrink-0 w-[40vw] sm:w-auto">
                    <StatCard title="待處理" value={stats.pendingCount} icon={ClockIcon} bgColor="bg-orange-50" color="text-orange-600" />
                </div>
                
                <div className="snap-center shrink-0 w-[40vw] sm:w-auto">
                    <StatCard title="本月完成" value={stats.completedCount} icon={CheckCircleIcon} bgColor="bg-indigo-50" color="text-indigo-600" />
                </div>
            </section>
        </div>

        {/* 2. Main Content Area */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100/50 overflow-hidden flex flex-col min-h-[60vh]">
            {/* Sticky Tabs Header */}
            <div className="sticky top-0 bg-white/95 backdrop-blur-sm z-10 border-b border-gray-100 flex overflow-x-auto hide-scrollbar p-1">
                {tabs.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as any)}
                        className={`flex-shrink-0 px-4 py-3 text-sm font-bold transition-all relative ${
                            activeTab === tab.id 
                            ? 'text-[#9F9586]' 
                            : 'text-gray-400 hover:text-gray-600'
                        }`}
                    >
                        {tab.label}
                        {activeTab === tab.id && (
                            <div className="absolute bottom-0 left-2 right-2 h-0.5 bg-[#9F9586] rounded-t-full" />
                        )}
                    </button>
                ))}
            </div>

            {/* Order List */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-gray-50/30 p-4 space-y-3">
                {filteredBookings.length > 0 ? (
                    filteredBookings.map(booking => (
                        <div key={booking.id} className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm active:scale-[0.99] transition-transform duration-200">
                            {/* Top Row: ID & Status */}
                            <div className="flex justify-between items-start mb-3">
                                <span className="text-[10px] text-gray-400 font-mono bg-gray-50 px-1.5 py-0.5 rounded">
                                    #{booking.id.slice(0,6)}
                                </span>
                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${getStatusColor(booking.status)}`}>
                                    {getStatusLabel(booking.status)}
                                </span>
                            </div>

                            {/* Middle Row: Content */}
                            <div className="flex gap-3 mb-3">
                                {/* Avatar */}
                                <div className="w-10 h-10 rounded-full bg-[#9F9586]/10 flex-shrink-0 flex items-center justify-center text-[#9F9586] font-bold text-sm">
                                    {booking.userName?.[0] || '客'}
                                </div>
                                
                                {/* Details */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex justify-between items-baseline mb-1">
                                        <h4 className="font-bold text-gray-900 text-sm truncate pr-2">{booking.userName}</h4>
                                        <span className="text-sm font-bold text-[#9F9586] whitespace-nowrap">${booking.amount}</span>
                                    </div>
                                    <p className="text-xs text-gray-500 flex items-center gap-1 mb-1">
                                        <CalendarDaysIcon className="w-3 h-3" />
                                        {format(booking.dateTime, 'yyyy/MM/dd HH:mm', { locale: zhTW })}
                                    </p>
                                    <div className="text-xs text-gray-600 bg-gray-50 p-2 rounded-lg space-y-1">
                                        {booking.items && booking.items.length > 0 ? (
                                            booking.items.map((item: any, idx: number) => (
                                                <div key={idx} className="border-b last:border-0 border-gray-200 pb-1 last:pb-0">
                                                    <div className="font-medium text-gray-800">{item.serviceName}</div>
                                                    {item.options && Object.entries(item.options).length > 0 && (
                                                        <div className="pl-2 mt-0.5 space-y-0.5">
                                                            {Object.entries(item.options).map(([catName, optItems]: [string, any]) => (
                                                                <div key={catName} className="flex flex-wrap gap-1 text-[10px] text-gray-500">
                                                                    <span className="text-gray-400">{catName}:</span>
                                                                    {optItems.map((opt: any, i: number) => (
                                                                        <span key={i} className="bg-white border border-gray-100 px-1 rounded">
                                                                            {opt.name}
                                                                        </span>
                                                                    ))}
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            ))
                                        ) : (
                                            /* Legacy or simple rendering */
                                            <span>{booking.serviceNames.join(', ')}</span>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Bottom Row: Actions */}
                            <div className="pt-2 border-t border-gray-50 flex justify-end gap-2">
                                {/* Edit Button (New) */}
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        navigate(`/admin/orders/${booking.id}/edit`);
                                    }}
                                    className="px-3 py-1.5 rounded-lg text-xs font-bold text-gray-700 bg-gray-100 hover:bg-gray-200 flex items-center gap-1"
                                >
                                    <PencilSquareIcon className="w-3.5 h-3.5" />
                                    編輯
                                </button>

                                {updatingId === booking.id ? (
                                    <span className="text-xs text-gray-400 py-1.5 px-2">處理中...</span>
                                ) : (
                                    <>
                                        {booking.status === 'pending_confirmation' && (
                                            <>
                                                <button onClick={() => handleUpdateStatus(booking, 'cancelled')} className="px-3 py-1.5 rounded-lg text-xs font-bold text-red-500 bg-red-50">拒絕</button>
                                                <button onClick={() => handleUpdateStatus(booking, 'confirmed')} className="px-3 py-1.5 rounded-lg text-xs font-bold text-white bg-[#9F9586]">確認</button>
                                            </>
                                        )}
                                        {booking.status === 'pending_payment' && (
                                            <button onClick={() => handleUpdateStatus(booking, 'confirmed')} className="px-3 py-1.5 rounded-lg text-xs font-bold text-white bg-blue-600">確認收款</button>
                                        )}
                                        {booking.status === 'confirmed' && (
                                            <button onClick={() => handleUpdateStatus(booking, 'completed')} className="px-3 py-1.5 rounded-lg text-xs font-bold text-white bg-green-600">完成</button>
                                        )}
                                    </>
                                )}
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="flex flex-col items-center justify-center py-20 text-center opacity-60">
                        <FunnelIcon className="w-12 h-12 text-gray-300 mb-2" />
                        <p className="text-sm text-gray-500">此分類無訂單</p>
                    </div>
                )}
            </div>
        </div>
      </main>
    </div>
  );
};


export default OrderManagementPage;
