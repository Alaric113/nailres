import { useState, useMemo, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { isSameMonth, isSameDay, isSameWeek } from 'date-fns';
import { collection, getDocs, orderBy, query } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAllBookings, type EnrichedBooking } from '../hooks/useAllBookings';
import { useCurrentDesigner } from '../hooks/useCurrentDesigner';
import { useAuthStore } from '../store/authStore';
import type { BookingStatus } from '../types/booking';
import type { Designer } from '../types/designer';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { useToast } from '../context/ToastContext';
import { 
  BanknotesIcon, 
  ClockIcon, 
  CheckCircleIcon, 
  FunnelIcon, 
  UserCircleIcon,
  CalendarDaysIcon,
  MagnifyingGlassIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import OrderTypeTabs from '../components/admin/OrderTypeTabs';
import { updateBookingStatus } from '../utils/bookingActions';
import BookingOrderCard from '../components/admin/BookingOrderCard';

// Stats KPI Card Component
const StatCard = ({ 
  title, 
  value, 
  subtitle,
  icon: Icon, 
  color, 
  bgColor,
  onClick,
  active
}: { 
  title: string; 
  value: string | number; 
  subtitle?: string;
  icon: any; 
  color: string; 
  bgColor: string;
  onClick?: () => void;
  active?: boolean;
}) => (
  <button
    onClick={onClick}
    disabled={!onClick}
    className={`w-full min-w-0 max-w-full bg-white p-3.5 sm:p-5 rounded-2xl sm:rounded-3xl border transition-all duration-200 text-left flex items-center justify-between shadow-soft overflow-hidden ${
      active ? 'border-[#9F9586] ring-2 ring-[#9F9586]/20' : 'border-[#EFECE5] hover:border-[#9F9586]/40'
    } ${onClick ? 'cursor-pointer active:scale-[0.98]' : 'cursor-default'}`}
  >
    <div className="space-y-0.5 sm:space-y-1 min-w-0 flex-1 pr-2">
      <p className="text-[11px] sm:text-xs font-medium text-text-light truncate">{title}</p>
      <p className="text-lg sm:text-2xl font-serif font-bold text-gray-900 truncate">{value}</p>
      {subtitle && <p className="text-[9px] sm:text-[10px] text-text-light/80 truncate">{subtitle}</p>}
    </div>
    <div className={`w-9 h-9 sm:w-11 sm:h-11 rounded-xl sm:rounded-2xl flex items-center justify-center ${bgColor} ${color} shrink-0`}>
      <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
    </div>
  </button>
);

const OrderManagementPage = () => {
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  
  // Tab & Filters State
  const [activeTab, setActiveTab] = useState<BookingStatus | 'all'>((queryParams.get('status') as BookingStatus) || 'all');
  const [dateFilterPreset, setDateFilterPreset] = useState<'all' | 'today' | 'week' | 'month'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

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
      return currentDesigner?.id || null;
    }
    return selectedDesignerFilter === 'all' ? null : selectedDesignerFilter;
  }, [userProfile?.role, currentDesigner, selectedDesignerFilter]);

  const { bookings, loading, error } = useAllBookings(null, effectiveDesignerId);

  // --- Stats Calculation ---
  const stats = useMemo(() => {
    const now = new Date();

    // Monthly Revenue (This Month Completed)
    const monthlyRevenue = bookings
      .filter(b => isSameMonth(b.dateTime, now) && b.status === 'completed')
      .reduce((acc, curr) => acc + curr.amount, 0);

    // Today's Bookings
    const todayBookings = bookings.filter(b => isSameDay(b.dateTime, now) && b.status !== 'cancelled');
    const todayRevenue = todayBookings.reduce((acc, curr) => acc + curr.amount, 0);

    // Pending Count (Needs Action)
    const pendingCount = bookings.filter(b => b.status === 'pending_confirmation' || b.status === 'pending_payment').length;
    
    // Monthly Completed Count
    const completedCount = bookings.filter(b => b.status === 'completed' && isSameMonth(b.dateTime, now)).length;

    return { 
      monthlyRevenue, 
      todayCount: todayBookings.length, 
      todayRevenue,
      pendingCount, 
      completedCount 
    };
  }, [bookings]);

  // Status Tab Counts
  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = { all: bookings.length };
    bookings.forEach(b => {
      counts[b.status] = (counts[b.status] || 0) + 1;
    });
    return counts;
  }, [bookings]);

  // --- Filter & Search Logic ---
  const filteredBookings = useMemo(() => {
    const now = new Date();

    return bookings.filter(b => {
      // 1. Status Filter
      if (activeTab !== 'all' && b.status !== activeTab) return false;

      // 2. Date Preset Filter
      if (dateFilterPreset === 'today' && !isSameDay(b.dateTime, now)) return false;
      if (dateFilterPreset === 'week' && !isSameWeek(b.dateTime, now)) return false;
      if (dateFilterPreset === 'month' && !isSameMonth(b.dateTime, now)) return false;

      // 3. Search Query Match
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesName = b.userName?.toLowerCase().includes(q);
        const matchesId = b.id?.toLowerCase().includes(q);
        const matchesService = b.serviceName?.toLowerCase().includes(q) || b.serviceNames?.some(s => s.toLowerCase().includes(q));
        const matchesNotes = b.notes?.toLowerCase().includes(q);
        const matchesDesigner = b.designerId?.toLowerCase().includes(q);

        if (!matchesName && !matchesId && !matchesService && !matchesNotes && !matchesDesigner) {
          return false;
        }
      }

      return true;
    }).sort((a, b) => {
      // Prioritize Pending Attention items on top
      if (a.status.includes('pending') && !b.status.includes('pending')) return -1;
      if (!a.status.includes('pending') && b.status.includes('pending')) return 1;
      return b.dateTime.getTime() - a.dateTime.getTime();
    });
  }, [bookings, activeTab, dateFilterPreset, searchQuery]);

  // --- Actions ---
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
      await updateBookingStatus(booking.id, newStatus);
      showToast(`訂單已更新：${getStatusLabel(newStatus)}`, 'success');

      if (['confirmed', 'completed', 'cancelled'].includes(newStatus)) {
        sendLineNotification(booking, newStatus);
      }
    } catch (error) {
      console.error("Failed to update booking status:", error);
      showToast('更新失敗，請稍後再試', 'error');
    } finally {
      setUpdatingId(null);
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pending_confirmation': return '待確認';
      case 'pending_payment': return '待付款';
      case 'confirmed': return '已確認';
      case 'completed': return '已完成';
      case 'cancelled': return '已取消';
      default: return status;
    }
  };

  const tabs: { id: BookingStatus | 'all'; label: string; count?: number; color?: string }[] = [
    { id: 'all', label: '全部' },
    { id: 'pending_confirmation', label: '待確認', color: 'bg-amber-100 text-amber-800' },
    { id: 'pending_payment', label: '待付款', color: 'bg-blue-100 text-blue-800' },
    { id: 'confirmed', label: '已確認', color: 'bg-emerald-100 text-emerald-800' },
    { id: 'completed', label: '已完成', color: 'bg-[#9F9586]/20 text-[#8A8173]' },
    { id: 'cancelled', label: '已取消', color: 'bg-gray-100 text-gray-600' },
  ];

  if (loading) return <div className="flex justify-center items-center h-full min-h-[50vh] bg-[#FAF9F6]"><LoadingSpinner text="載入訂單資料中..." /></div>;
  if (error) return <div className="text-rose-600 text-center mt-10 p-6 bg-white rounded-3xl border border-rose-200 max-w-md mx-auto">讀取錯誤: {typeof error === 'string' ? error : JSON.stringify(error)}</div>;

  return (
    <div className="min-h-full bg-[#FAF9F6] pb-24 md:pb-16 pt-2 md:pt-4 w-full max-w-full overflow-x-hidden text-text-main">
      <main className="max-w-6xl mx-auto px-3 sm:px-6 lg:px-8 space-y-4 sm:space-y-6 w-full min-w-0">

        {/* 1. Top Navigation: Order Types & Header Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-3 min-w-0">
          <div className="w-full sm:w-auto min-w-0">
            <OrderTypeTabs />
          </div>

          {/* Designer Filter Dropdown */}
          {(userProfile?.role === 'admin' || userProfile?.role === 'manager') && (
            <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-2xl border border-[#EFECE5] shadow-subtle self-start sm:self-auto min-w-0">
              <UserCircleIcon className="w-5 h-5 text-[#9F9586] shrink-0" />
              <select
                value={selectedDesignerFilter}
                onChange={(e) => setSelectedDesignerFilter(e.target.value)}
                className="bg-transparent border-none text-xs sm:text-sm font-bold text-gray-800 focus:ring-0 p-0 pr-4 cursor-pointer outline-none truncate"
              >
                <option value="all">全店所有設計師</option>
                {allDesigners.map(d => (
                  <option key={d.id} value={d.id}>{d.name} 設計師</option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* 2. Top KPI Statistics Ribbon */}
        <section className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4 w-full min-w-0">
          <StatCard 
            title="本月營收總額" 
            value={`$${stats.monthlyRevenue.toLocaleString()}`} 
            subtitle="已完成服務之實際營收"
            icon={BanknotesIcon} 
            bgColor="bg-emerald-50" 
            color="text-emerald-700" 
          />
          <StatCard 
            title="今日預約行程" 
            value={`${stats.todayCount} 場`} 
            subtitle={`預估 $${stats.todayRevenue.toLocaleString()}`}
            icon={CalendarDaysIcon} 
            bgColor="bg-blue-50" 
            color="text-blue-700"
            onClick={() => setDateFilterPreset(dateFilterPreset === 'today' ? 'all' : 'today')}
            active={dateFilterPreset === 'today'}
          />
          <StatCard 
            title="待處理審核" 
            value={stats.pendingCount} 
            subtitle="待確認 / 待收款"
            icon={ClockIcon} 
            bgColor={stats.pendingCount > 0 ? "bg-amber-50" : "bg-gray-50"} 
            color={stats.pendingCount > 0 ? "text-amber-700 font-bold" : "text-gray-500"}
            onClick={() => setActiveTab(activeTab === 'pending_confirmation' ? 'all' : 'pending_confirmation')}
            active={activeTab === 'pending_confirmation' || activeTab === 'pending_payment'}
          />
          <StatCard 
            title="本月完成場次" 
            value={`${stats.completedCount} 場`} 
            subtitle="本月滿意服務件數"
            icon={CheckCircleIcon} 
            bgColor="bg-[#9F9586]/10" 
            color="text-[#9F9586]" 
            onClick={() => setActiveTab(activeTab === 'completed' ? 'all' : 'completed')}
            active={activeTab === 'completed'}
          />
        </section>

        {/* 3. Main Order Management Area */}
        <div className="w-full min-w-0 max-w-full bg-white rounded-2xl sm:rounded-3xl shadow-soft border border-[#EFECE5] overflow-hidden flex flex-col min-h-[60vh]">
          
          {/* Header Bar with Search & Date Presets */}
          <div className="p-3.5 sm:p-5 border-b border-[#EFECE5] bg-white space-y-3 min-w-0">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 min-w-0">
              
              {/* Search Bar */}
              <div className="relative w-full md:max-w-md min-w-0">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="搜尋顧客、電話、預約 # 或項目..."
                  className="w-full pl-9 pr-8 py-2 bg-[#FAF9F6] rounded-xl sm:rounded-2xl border border-[#EFECE5] text-xs sm:text-sm text-text-main placeholder:text-text-light/60 focus:outline-none focus:border-[#9F9586] focus:ring-1 focus:ring-[#9F9586] transition-all"
                />
                <MagnifyingGlassIcon className="w-4 h-4 text-text-light absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 rounded-full cursor-pointer"
                  >
                    <XMarkIcon className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Date Presets Filter */}
              <div className="flex items-center gap-1 bg-[#FAF9F6] p-1 rounded-xl sm:rounded-2xl border border-[#EFECE5] shrink-0 self-start md:self-auto overflow-x-auto max-w-full">
                {[
                  { key: 'all', label: '全部日期' },
                  { key: 'today', label: '今日' },
                  { key: 'week', label: '本週' },
                  { key: 'month', label: '本月' },
                ].map(preset => (
                  <button
                    key={preset.key}
                    onClick={() => setDateFilterPreset(preset.key as any)}
                    className={`px-3 py-1.5 rounded-lg sm:rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                      dateFilterPreset === preset.key
                        ? 'bg-white text-gray-900 shadow-sm'
                        : 'text-gray-500 hover:text-gray-900'
                    }`}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>

            </div>

            {/* Status Filter Tabs */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 pt-0.5 max-w-full custom-scrollbar">
              {tabs.map(tab => {
                const count = statusCounts[tab.id] || 0;
                const isSelected = activeTab === tab.id;

                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`px-3 py-1.5 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all duration-200 flex items-center gap-1.5 shrink-0 cursor-pointer ${
                      isSelected
                        ? 'bg-[#9F9586] text-white shadow-sm scale-[1.02]'
                        : 'bg-[#FAF9F6] text-text-main border border-[#EFECE5] hover:border-[#9F9586]/40 hover:bg-white'
                    }`}
                  >
                    <span>{tab.label}</span>
                    <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-medium ${
                      isSelected ? 'bg-white/20 text-white' : tab.color || 'bg-gray-200 text-gray-600'
                    }`}>
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Order Cards Grid */}
          <div className="p-3.5 sm:p-5 bg-[#FAF9F6]/40 flex-1 min-w-0">
            {filteredBookings.length > 0 ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4 min-w-0">
                {filteredBookings.map(booking => (
                  <BookingOrderCard
                    key={booking.id}
                    booking={booking}
                    updatingId={updatingId}
                    onUpdateStatus={handleUpdateStatus}
                  />
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-16 sm:py-20 text-center space-y-3 bg-white rounded-3xl border border-dashed border-[#EFECE5] max-w-md mx-auto p-6">
                <div className="w-12 h-12 rounded-full bg-[#FAF9F6] border border-[#EFECE5] flex items-center justify-center text-text-light">
                  <FunnelIcon className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 text-sm">目前無符合條件的訂單</h3>
                  <p className="text-xs text-text-light mt-1">請嘗試變更狀態分類、日期區間或清除搜尋關鍵字</p>
                </div>
                <button
                  onClick={() => {
                    setActiveTab('all');
                    setDateFilterPreset('all');
                    setSearchQuery('');
                  }}
                  className="px-4 py-2 bg-[#9F9586] text-white text-xs font-bold rounded-xl hover:bg-[#8A8173] transition-all shadow-sm cursor-pointer"
                >
                  重置所有篩選條件
                </button>
              </div>
            )}
          </div>

        </div>

      </main>
    </div>
  );
};

export default OrderManagementPage;
