import { useMemo, useState, useEffect } from 'react';
import { startOfDay, format, differenceInDays, isSameDay } from 'date-fns';
import { Link, useNavigate } from 'react-router-dom';
import { useAllBookings } from '../hooks/useAllBookings';
import { useAuthStore } from '../store/authStore';
import { collection, query, getDocs, orderBy, where } from 'firebase/firestore';
import { db } from '../lib/firebase';
import type { Designer } from '../types/designer';
import LoadingSpinner from '../components/common/LoadingSpinner';
import CustomerSelectionModal from '../components/admin/CustomerSelectionModal';
import { Listbox, ListboxButton, ListboxOptions, ListboxOption } from '@headlessui/react';

import {
  CalendarDaysIcon,
  ClockIcon,
  CreditCardIcon,
  ExclamationTriangleIcon,
  ChevronDownIcon,
  CheckIcon,
  BuildingStorefrontIcon,
  UserGroupIcon,
  PlusCircleIcon,
  TicketIcon,
  GiftIcon,
  PhotoIcon,
  ClipboardDocumentListIcon,
  PhoneIcon,
  ChevronRightIcon,
  FireIcon,
  SparklesIcon
} from '@heroicons/react/24/outline';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { bookings, loading: bookingsLoading } = useAllBookings(null);
  const { userProfile, currentUser } = useAuthStore();

  // Role Checks
  const isAdmin = userProfile?.role === 'admin';
  const isManager = userProfile?.role === 'manager'; // 管理設計師
  const isDesignerRole = userProfile?.role === 'designer';
  const isAdminOrManager = isAdmin || isManager;

  // View Mode for Admin/Manager: 'all' = All Store, 'designerId' = Specific Designer
  const [viewMode, setViewMode] = useState<string>('all');
  const [allDesigners, setAllDesigners] = useState<Designer[]>([]);
  const [targetDesignerProfile, setTargetDesignerProfile] = useState<Designer | null>(null);

  // Customer Selection Modal for Proxy Booking
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);

  // 1. Fetch Designers List (For Admin/Manager Dropdown)
  useEffect(() => {
    if (!isAdminOrManager) return;
    const fetchAllDesigners = async () => {
      try {
        const q = query(collection(db, 'designers'), orderBy('displayOrder'));
        const snap = await getDocs(q);
        const list = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Designer));
        setAllDesigners(list);
      } catch (err) {
        console.error("Error fetching designers:", err);
      }
    };
    fetchAllDesigners();
  }, [isAdminOrManager]);

  // 2. Determine Target Designer Profile
  useEffect(() => {
    const resolveDesignerProfile = async () => {
      // Case A: Admin/Manager selected a specific designer
      if (isAdminOrManager && viewMode !== 'all') {
        const selected = allDesigners.find(d => d.id === viewMode);
        setTargetDesignerProfile(selected || null);
        return;
      }

      // Case B: Admin/Manager viewing whole store
      if (isAdminOrManager && viewMode === 'all') {
        setTargetDesignerProfile(null);
        return;
      }

      // Case C: Designer Role (Strictly locked to self)
      if (isDesignerRole && currentUser) {
        try {
          const q = query(collection(db, 'designers'), where('linkedUserId', '==', currentUser.uid));
          const snap = await getDocs(q);
          if (!snap.empty) {
            setTargetDesignerProfile({ id: snap.docs[0].id, ...snap.docs[0].data() } as Designer);
          }
        } catch (e) {
          console.error("Error fetching linked designer:", e);
        }
      }
    };
    resolveDesignerProfile();
  }, [isAdminOrManager, isDesignerRole, currentUser, viewMode, allDesigners]);

  // --- Dynamic Metrics & Schedule Calculations ---
  const {
    todayBookings,
    todayEstimatedRevenue,
    pendingConfirmationCount,
    pendingPaymentCount,
    todayCompletedCount,
    hotServices,
    designerWorkload
  } = useMemo(() => {
    const today = new Date();

    // 1. Filter bookings by target designer if specified
    const activeBookings = targetDesignerProfile
      ? bookings.filter(b => b.designerId === targetDesignerProfile.id)
      : bookings;

    // 2. Today's Bookings (excluding cancelled/rejected)
    const todayList = activeBookings
      .filter(b => isSameDay(b.dateTime, today) && b.status !== 'cancelled' && b.status !== 'rejected')
      .sort((a, b) => a.dateTime.getTime() - b.dateTime.getTime());

    // 3. Today's Estimated Revenue (sum of confirmed, completed, and pending_confirmation amounts)
    const todayRevenue = todayList
      .filter(b => b.status !== 'cancelled' && b.status !== 'rejected')
      .reduce((sum, b) => sum + (b.amount || 0), 0);

    // 4. Pending Attention Counts (Action Required)
    const pendingConf = activeBookings.filter(b => b.status === 'pending_confirmation').length;
    const pendingPay = activeBookings.filter(b => b.status === 'pending_payment').length;
    const todayComp = todayList.filter(b => b.status === 'completed').length;

    // 5. Hot Services Ranking (from all non-cancelled bookings in the last 60 days)
    const sixtyDaysAgo = new Date();
    sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

    const serviceCounts: Record<string, { name: string; count: number; totalRevenue: number }> = {};
    activeBookings
      .filter(b => b.dateTime >= sixtyDaysAgo && b.status !== 'cancelled' && b.status !== 'rejected')
      .forEach(b => {
        const names = b.serviceNames?.length ? b.serviceNames : ['精緻美學服務'];
        names.forEach(name => {
          if (!serviceCounts[name]) {
            serviceCounts[name] = { name, count: 0, totalRevenue: 0 };
          }
          serviceCounts[name].count += 1;
          serviceCounts[name].totalRevenue += Math.round((b.amount || 0) / names.length);
        });
      });

    const hotList = Object.values(serviceCounts)
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // 6. Designer Workload for Store Overview
    const designerStats: Record<string, { id: string; name: string; todayCount: number; monthCount: number }> = {};
    if (!targetDesignerProfile) {
      allDesigners.forEach(d => {
        designerStats[d.id] = { id: d.id, name: d.name, todayCount: 0, monthCount: 0 };
      });

      const startOfCurrentMonth = new Date(today.getFullYear(), today.getMonth(), 1);
      bookings.forEach(b => {
        if (!b.designerId || !designerStats[b.designerId]) return;
        if (b.status === 'cancelled' || b.status === 'rejected') return;

        if (isSameDay(b.dateTime, today)) {
          designerStats[b.designerId].todayCount += 1;
        }
        if (b.dateTime >= startOfCurrentMonth) {
          designerStats[b.designerId].monthCount += 1;
        }
      });
    }

    return {
      todayBookings: todayList,
      todayEstimatedRevenue: todayRevenue,
      pendingConfirmationCount: pendingConf,
      pendingPaymentCount: pendingPay,
      todayCompletedCount: todayComp,
      hotServices: hotList,
      designerWorkload: Object.values(designerStats)
    };
  }, [bookings, targetDesignerProfile, allDesigners]);

  if (bookingsLoading) {
    return (
      <div className="flex flex-col justify-center items-center h-full min-h-[50vh] bg-[#FAF9F6]">
        <LoadingSpinner />
        <p className="mt-4 text-gray-500 font-medium text-xs sm:text-sm">正在載入營運數據...</p>
      </div>
    );
  }

  // Quick Action Shortcuts List (Streamlined for Mobile/Tablet)
  const quickActions: {
    title: string;
    fullTitle: string;
    subtitle: string;
    link?: string;
    onClick?: () => void;
    icon: any;
    color: string;
    iconColor: string;
    badge?: string;
  }[] = [
    {
      title: '代客預約',
      fullTitle: '代客預約 / 新單',
      subtitle: '先選擇客戶再進入預約',
      onClick: () => setIsCustomerModalOpen(true),
      icon: PlusCircleIcon,
      color: 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100/80',
      iconColor: 'text-emerald-600',
    },
    {
      title: '訂單管理',
      fullTitle: '預約訂單管理',
      subtitle: '審核確認、查詢與時段調配',
      link: '/admin/orders',
      icon: ClipboardDocumentListIcon,
      color: 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100/80',
      iconColor: 'text-blue-600',
      badge: pendingConfirmationCount > 0 ? `${pendingConfirmationCount}` : undefined,
    },
    {
      title: '季卡管理',
      fullTitle: '開通與管理季卡',
      subtitle: '季卡訂單審核與餘額查詢',
      link: '/admin/orders/pass',
      icon: TicketIcon,
      color: 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100/80',
      iconColor: 'text-amber-600',
    },
    {
      title: '發優惠券',
      fullTitle: '發放優惠券',
      subtitle: '推廣活動與指定發送',
      link: '/admin/promotions',
      icon: GiftIcon,
      color: 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100/80',
      iconColor: 'text-rose-600',
    },
    {
      title: '客戶名冊',
      fullTitle: '客戶名冊與詳情',
      subtitle: '會員標籤、備註與消費紀錄',
      link: '/admin/customers',
      icon: UserGroupIcon,
      color: 'bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100/80',
      iconColor: 'text-purple-600',
    },
    {
      title: '作品集',
      fullTitle: '作品集管理',
      subtitle: '發布與分類首頁作品照',
      link: '/admin/portfolio',
      icon: PhotoIcon,
      color: 'bg-[#9F9586]/10 text-[#5C5548] border-[#9F9586]/30 hover:bg-[#9F9586]/20',
      iconColor: 'text-[#9F9586]',
    },
  ];

  return (
    <div className="p-3 sm:p-4 lg:p-6 space-y-4 sm:space-y-6 max-w-7xl mx-auto pb-24 text-text-main">
      
      {/* ========================================================================= */}
      {/* 0. TOP HEADER & DESIGNER PERSPECTIVE SWITCHER                             */}
      {/* ========================================================================= */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-3 bg-white p-3.5 sm:p-5 rounded-2xl shadow-soft border border-[#EFECE5]">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
            <span className="text-[10px] sm:text-xs font-bold px-2 py-0.5 rounded-full bg-[#9F9586]/15 text-[#8A8173]">
              {format(new Date(), 'MM/dd (eee)')}
            </span>
            <span className="hidden sm:inline text-xs text-text-light font-medium">營運控制台</span>
          </div>
          <h1 className="text-lg sm:text-2xl font-serif font-bold text-gray-900 tracking-tight">
            {targetDesignerProfile ? `${targetDesignerProfile.name} 的今日排程` : '全門市今日營運總覽'}
          </h1>
        </div>

        {/* Designer Dropdown Switcher (Admin / Manager Only) */}
        {isAdminOrManager && (
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-xs text-gray-500 font-bold hidden md:inline">切換視角：</span>
            <div className="relative w-full sm:w-48 md:w-52">
              <Listbox value={viewMode} onChange={setViewMode}>
                <ListboxButton className="w-full flex items-center justify-between gap-1.5 px-3 py-1.5 sm:py-2 rounded-xl bg-[#FAF9F6] border border-[#EFECE5] font-bold text-xs sm:text-sm text-gray-900 hover:bg-[#EFECE5]/60 transition-all cursor-pointer shadow-subtle">
                  <span className="truncate flex items-center gap-1.5">
                    {viewMode === 'all' ? (
                      <>
                        <BuildingStorefrontIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#9F9586]" />
                        <span>全店總覽</span>
                      </>
                    ) : (
                      <>
                        <UserGroupIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#9F9586]" />
                        <span>{allDesigners.find(d => d.id === viewMode)?.name || '選擇設計師'}</span>
                      </>
                    )}
                  </span>
                  <ChevronDownIcon className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                </ListboxButton>
                
                <ListboxOptions className="absolute right-0 z-50 mt-1.5 max-h-72 w-52 sm:w-56 overflow-auto rounded-2xl bg-white p-1.5 text-xs sm:text-sm shadow-xl ring-1 ring-black/5 focus:outline-none border border-[#EFECE5]">
                  <ListboxOption
                    value="all"
                    className={({ active, selected }) =>
                      `relative cursor-pointer select-none py-2 pl-7 pr-3 rounded-xl transition-all ${
                        active ? 'bg-[#FAF9F6] text-[#9F9586]' : 'text-gray-900'
                      } ${selected ? 'font-bold bg-[#9F9586]/10 text-[#8A8173]' : 'font-medium'}`
                    }
                  >
                    {({ selected }) => (
                      <>
                        <span className="block truncate">全店總覽</span>
                        {selected && (
                          <span className="absolute inset-y-0 left-0 flex items-center pl-2 text-[#9F9586]">
                            <CheckIcon className="h-4 w-4" />
                          </span>
                        )}
                      </>
                    )}
                  </ListboxOption>

                  <div className="border-t border-gray-100 my-1 mx-2"></div>
                  <div className="px-2 py-0.5 text-[10px] text-gray-400 font-bold uppercase tracking-wider">個別設計師</div>

                  {allDesigners.map((designer) => (
                    <ListboxOption
                      key={designer.id}
                      value={designer.id}
                      className={({ active, selected }) =>
                        `relative cursor-pointer select-none py-2 pl-7 pr-3 rounded-xl transition-all ${
                          active ? 'bg-[#FAF9F6] text-[#9F9586]' : 'text-gray-900'
                        } ${selected ? 'font-bold bg-[#9F9586]/10 text-[#8A8173]' : 'font-medium'}`
                      }
                    >
                      {({ selected }) => (
                        <>
                          <span className="block truncate">{designer.name}</span>
                          {selected && (
                            <span className="absolute inset-y-0 left-0 flex items-center pl-2 text-[#9F9586]">
                              <CheckIcon className="h-4 w-4" />
                            </span>
                          )}
                        </>
                      )}
                    </ListboxOption>
                  ))}
                </ListboxOptions>
              </Listbox>
            </div>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* 1. BOOKING DEADLINE & SCHEDULE ALERTS (COMPACT BANNER)                     */}
      {/* ========================================================================= */}
      {targetDesignerProfile && (() => {
        const today = startOfDay(new Date());
        const deadlineDate = targetDesignerProfile.bookingDeadline ? startOfDay(targetDesignerProfile.bookingDeadline.toDate()) : null;
        const daysRemaining = deadlineDate ? differenceInDays(deadlineDate, today) : null;

        if (!deadlineDate) {
          return (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 sm:p-4 flex items-center justify-between gap-2 shadow-subtle">
              <div className="flex items-center gap-2.5 min-w-0">
                <ExclamationTriangleIcon className="w-5 h-5 text-amber-700 shrink-0" />
                <div className="min-w-0">
                  <h4 className="font-bold text-amber-900 text-xs sm:text-sm truncate">尚未設定預約截止日</h4>
                  <p className="hidden xs:block text-[11px] text-amber-700 mt-0.5 truncate">顧客目前無法預約，請至營業時間開放。</p>
                </div>
              </div>
              <Link to="/admin/hours" className="px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-lg transition-all shrink-0">
                設定
              </Link>
            </div>
          );
        }

        if (daysRemaining !== null && daysRemaining <= 7) {
          return (
            <div className="bg-rose-50 border border-rose-200 rounded-xl p-3 sm:p-4 flex items-center justify-between gap-2 shadow-subtle">
              <div className="flex items-center gap-2.5 min-w-0">
                <ClockIcon className="w-5 h-5 text-rose-700 shrink-0" />
                <div className="min-w-0">
                  <h4 className="font-bold text-rose-900 text-xs sm:text-sm truncate">
                    預約期限剩餘 {Math.max(0, daysRemaining)} 天 ({format(deadlineDate, 'MM/dd')} 截止)
                  </h4>
                  <p className="hidden xs:block text-[11px] text-rose-700 mt-0.5 truncate">建議提早開放下期時段以利顧客預約。</p>
                </div>
              </div>
              <Link to="/admin/hours" className="px-3 py-1 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-lg transition-all shrink-0">
                延長
              </Link>
            </div>
          );
        }

        return null;
      })()}

      {/* ========================================================================= */}
      {/* 2. TODAY'S OPERATIONAL KPI METRICS (COMPACT 2x2 ON MOBILE, 4-COL DESKTOP) */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
        
        {/* Metric 1: Today Bookings */}
        <div 
          onClick={() => navigate('/admin/orders')}
          className="bg-white p-3 sm:p-4 rounded-2xl border border-[#EFECE5] shadow-soft hover:shadow-medium transition-all cursor-pointer group flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] sm:text-xs font-bold text-gray-500">今日預約客數</span>
            <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-lg sm:rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center group-hover:scale-110 transition-transform">
              <CalendarDaysIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
          </div>
          <div className="mt-2 sm:mt-3 flex items-baseline justify-between gap-1">
            <span className="text-xl sm:text-3xl font-serif font-bold text-gray-900">
              {todayBookings.length}
            </span>
            <span className="text-[10px] sm:text-[11px] font-bold text-emerald-700 bg-emerald-50 px-1.5 sm:px-2 py-0.5 rounded-full border border-emerald-200 shrink-0">
              已完 {todayCompletedCount}
            </span>
          </div>
        </div>

        {/* Metric 2: Today Revenue */}
        <div className="bg-white p-3 sm:p-4 rounded-2xl border border-[#EFECE5] shadow-soft flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] sm:text-xs font-bold text-gray-500">今日預估營業額</span>
            <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-lg sm:rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <SparklesIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
          </div>
          <div className="mt-2 sm:mt-3 flex items-baseline justify-between">
            <span className="text-xl sm:text-3xl font-serif font-bold text-emerald-700">
              ${todayEstimatedRevenue.toLocaleString()}
            </span>
            <span className="hidden sm:inline text-[11px] text-gray-400 font-medium">預約加總</span>
          </div>
        </div>

        {/* Metric 3: Pending Confirmation */}
        <div 
          onClick={() => navigate('/admin/orders?status=pending_confirmation')}
          className={`p-3 sm:p-4 rounded-2xl border transition-all cursor-pointer group flex flex-col justify-between ${
            pendingConfirmationCount > 0 
              ? 'bg-rose-50/70 border-rose-200 shadow-soft hover:bg-rose-50' 
              : 'bg-white border-[#EFECE5] shadow-soft'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className={`text-[11px] sm:text-xs font-bold ${pendingConfirmationCount > 0 ? 'text-rose-700' : 'text-gray-500'}`}>
              待審核確認
            </span>
            <div className={`w-6 h-6 sm:w-8 sm:h-8 rounded-lg sm:rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform ${
              pendingConfirmationCount > 0 ? 'bg-rose-100 text-rose-600' : 'bg-gray-100 text-gray-500'
            }`}>
              <ClipboardDocumentListIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
          </div>
          <div className="mt-2 sm:mt-3 flex items-baseline justify-between">
            <span className={`text-xl sm:text-3xl font-serif font-bold ${pendingConfirmationCount > 0 ? 'text-rose-700' : 'text-gray-900'}`}>
              {pendingConfirmationCount}
            </span>
            {pendingConfirmationCount > 0 ? (
              <span className="text-[10px] sm:text-[11px] font-bold text-rose-700 animate-pulse flex items-center gap-0.5">
                <span>需審核</span>
                <ChevronRightIcon className="w-3 h-3" />
              </span>
            ) : (
              <span className="text-[10px] sm:text-[11px] text-gray-400 font-medium">全清空</span>
            )}
          </div>
        </div>

        {/* Metric 4: Pending Payment */}
        <div 
          onClick={() => navigate('/admin/orders?status=pending_payment')}
          className={`p-3 sm:p-4 rounded-2xl border transition-all cursor-pointer group flex flex-col justify-between ${
            pendingPaymentCount > 0 
              ? 'bg-amber-50/70 border-amber-200 shadow-soft hover:bg-amber-50' 
              : 'bg-white border-[#EFECE5] shadow-soft'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className={`text-[11px] sm:text-xs font-bold ${pendingPaymentCount > 0 ? 'text-amber-700' : 'text-gray-500'}`}>
              待付款 / 訂金
            </span>
            <div className={`w-6 h-6 sm:w-8 sm:h-8 rounded-lg sm:rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform ${
              pendingPaymentCount > 0 ? 'bg-amber-100 text-amber-600' : 'bg-gray-100 text-gray-500'
            }`}>
              <CreditCardIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
          </div>
          <div className="mt-2 sm:mt-3 flex items-baseline justify-between">
            <span className={`text-xl sm:text-3xl font-serif font-bold ${pendingPaymentCount > 0 ? 'text-amber-700' : 'text-gray-900'}`}>
              {pendingPaymentCount}
            </span>
            {pendingPaymentCount > 0 ? (
              <span className="text-[10px] sm:text-[11px] font-bold text-amber-700 flex items-center gap-0.5">
                <span>去查看</span>
                <ChevronRightIcon className="w-3 h-3" />
              </span>
            ) : (
              <span className="text-[10px] sm:text-[11px] text-gray-400 font-medium">已結清</span>
            )}
          </div>
        </div>

      </div>

      {/* ========================================================================= */}
      {/* 3. QUICK ACTION TOOLBAR (3x2 COMPACT GRID ON MOBILE, 6-COL ON DESKTOP)     */}
      {/* ========================================================================= */}
      <div className="space-y-2 sm:space-y-3">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-xs sm:text-base font-serif font-bold text-gray-900 flex items-center gap-1.5">
            <SparklesIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#9F9586]" />
            <span>常用快捷操作</span>
          </h2>
          <span className="hidden sm:inline text-xs text-text-light">一鍵直達功能模組</span>
        </div>

        <div className="grid grid-cols-3 sm:grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-3">
          {quickActions.map((action, i) => {
            const Icon = action.icon;
            const content = (
              <>
                <div className="flex items-center justify-between w-full">
                  <div className={`w-8 h-8 sm:w-9 sm:h-9 mx-auto sm:mx-0 rounded-lg sm:rounded-xl bg-white/90 backdrop-blur-md flex items-center justify-center shadow-2xs group-hover:scale-110 transition-transform ${action.iconColor}`}>
                    <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
                  </div>
                  {action.badge && (
                    <span className="absolute top-1 right-1 sm:static px-1.5 py-0.2 bg-rose-500 text-white text-[9px] font-bold rounded-full animate-bounce">
                      {action.badge}
                    </span>
                  )}
                </div>

                <div className="mt-1.5 sm:mt-3 w-full">
                  <h3 className="font-bold text-xs sm:text-sm text-gray-900 tracking-tight leading-tight truncate">
                    <span className="sm:hidden">{action.title}</span>
                    <span className="hidden sm:inline">{action.fullTitle}</span>
                  </h3>
                  <p className="hidden md:block text-[10px] text-gray-500 line-clamp-1 mt-0.5">
                    {action.subtitle}
                  </p>
                </div>
              </>
            );

            const cardClass = `p-2.5 sm:p-3.5 rounded-xl sm:rounded-2xl border transition-all duration-200 flex flex-col items-center sm:items-start text-center sm:text-left justify-between shadow-subtle group active:scale-[0.97] cursor-pointer ${action.color}`;

            if (action.onClick) {
              return (
                <button
                  key={i}
                  type="button"
                  onClick={action.onClick}
                  className={cardClass}
                >
                  {content}
                </button>
              );
            }

            return (
              <Link
                key={i}
                to={action.link!}
                className={cardClass}
              >
                {content}
              </Link>
            );
          })}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 4. MAIN WORKSPACE: TODAY'S TIMELINE & PERFORMANCE RANKING                 */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        
        {/* Left 2 Cols: Today's Actionable Agenda Timeline */}
        <div className="lg:col-span-2 space-y-2.5 sm:space-y-3">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-sm sm:text-lg font-serif font-bold text-gray-900 flex items-center gap-1.5 sm:gap-2">
              <CalendarDaysIcon className="w-4 h-4 sm:w-5 sm:h-5 text-[#9F9586]" />
              <span>今日排程時間軸</span>
              <span className="text-[10px] sm:text-xs font-sans px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 font-bold">
                {todayBookings.length} 位
              </span>
            </h2>
            <Link 
              to="/admin/calendar" 
              className="text-[11px] sm:text-xs text-[#9F9586] hover:text-[#8A8173] font-bold flex items-center gap-0.5 transition-colors"
            >
              <span>完整行事曆</span>
              <ChevronRightIcon className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
            </Link>
          </div>

          <div className="bg-white rounded-2xl border border-[#EFECE5] shadow-soft p-3 sm:p-5">
            {todayBookings.length === 0 ? (
              <div className="text-center py-8 sm:py-12 space-y-2.5">
                <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-[#FAF9F6] border border-[#EFECE5] flex items-center justify-center mx-auto text-[#9F9586]">
                  <CalendarDaysIcon className="w-6 h-6 sm:w-7 sm:h-7" />
                </div>
                <div className="space-y-0.5">
                  <h3 className="font-bold text-gray-800 text-xs sm:text-sm">今日尚無預約行程</h3>
                  <p className="text-[11px] sm:text-xs text-text-light">
                    {targetDesignerProfile ? `${targetDesignerProfile.name} 今天目前暫無排單` : '全店今天目前暫無預約'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsCustomerModalOpen(true)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-[#9F9586] hover:bg-[#8A8173] text-white text-xs font-bold rounded-xl transition-all shadow-sm active:scale-95 cursor-pointer"
                >
                  <PlusCircleIcon className="w-3.5 h-3.5" />
                  <span>立即選擇客戶排單</span>
                </button>
              </div>
            ) : (
              <div className="relative border-l-2 border-[#EFECE5] ml-2 sm:ml-4 pl-3 sm:pl-5 space-y-3 sm:space-y-4">
                {todayBookings.map((b) => {
                  const timeStr = format(b.dateTime, 'HH:mm');
                  const isCompleted = b.status === 'completed';
                  const isPending = b.status === 'pending_confirmation';

                  return (
                    <div 
                      key={b.id} 
                      onClick={() => navigate('/admin/orders')}
                      className="relative group cursor-pointer"
                    >
                      {/* Timeline Node Icon */}
                      <span className={`absolute -left-[19px] sm:-left-[27px] top-2 w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full border-2 border-white shadow-sm flex items-center justify-center ${
                        isCompleted ? 'bg-emerald-500' : isPending ? 'bg-rose-500 animate-ping' : 'bg-[#9F9586]'
                      }`} />
                      <span className={`absolute -left-[19px] sm:-left-[27px] top-2 w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full border-2 border-white shadow-sm flex items-center justify-center ${
                        isCompleted ? 'bg-emerald-500' : isPending ? 'bg-rose-500' : 'bg-[#9F9586]'
                      }`}>
                        {isCompleted && <CheckIcon className="w-2 sm:w-2.5 h-2 sm:h-2.5 text-white" />}
                      </span>

                      {/* Card Body */}
                      <div className="bg-[#FAF9F6] group-hover:bg-[#EFECE5]/40 p-3 sm:p-4 rounded-xl sm:rounded-2xl border border-[#EFECE5] transition-all space-y-1.5 sm:space-y-2.5 active:scale-[0.99]">
                        
                        {/* Row 1: Time, Customer, Status */}
                        <div className="flex items-center justify-between gap-1.5">
                          <div className="flex items-center gap-1.5 min-w-0">
                            <span className="px-2 py-0.5 rounded-lg bg-white border border-[#EFECE5] font-serif font-bold text-xs sm:text-sm text-gray-900 shadow-2xs shrink-0">
                              {timeStr}
                            </span>
                            <span className="font-bold text-xs sm:text-base text-gray-900 truncate">
                              {b.customerName || '貴賓顧客'}
                            </span>
                            {b.customerPhone && (
                              <a 
                                href={`tel:${b.customerPhone}`}
                                onClick={(e) => e.stopPropagation()}
                                className="p-1 rounded-lg bg-white hover:bg-gray-100 text-gray-600 transition-colors shrink-0"
                                title={`撥打電話：${b.customerPhone}`}
                              >
                                <PhoneIcon className="w-3.5 h-3.5 text-[#9F9586]" />
                              </a>
                            )}
                          </div>

                          <div className="flex items-center gap-1 shrink-0">
                            {/* Designer Tag */}
                            <span className="px-1.5 py-0.5 rounded-md bg-white text-[10px] sm:text-[11px] font-medium text-gray-700 border border-[#EFECE5] truncate max-w-[80px]">
                              {b.designerName || '設計師'}
                            </span>
                            
                            {/* Status Tag */}
                            <span className={`px-1.5 py-0.5 rounded-md text-[9px] sm:text-[10px] font-bold ${
                              b.status === 'completed' ? 'bg-emerald-100 text-emerald-800' :
                              b.status === 'confirmed' ? 'bg-blue-100 text-blue-800' :
                              b.status === 'pending_confirmation' ? 'bg-rose-100 text-rose-800 animate-pulse' :
                              'bg-gray-100 text-gray-700'
                            }`}>
                              {b.status === 'completed' ? '已完成' :
                               b.status === 'confirmed' ? '已確認' :
                               b.status === 'pending_confirmation' ? '待確認' :
                               b.status === 'pending_payment' ? '待付款' : b.status}
                            </span>
                          </div>
                        </div>

                        {/* Row 2: Services List & Price */}
                        <div className="flex items-center justify-between gap-2 text-[11px] sm:text-xs pt-1 border-t border-gray-200/60">
                          <div className="text-gray-700 font-medium truncate">
                            {b.serviceNames?.join(' + ') || '預約服務項目'}
                          </div>
                          <div className="font-serif font-bold text-xs sm:text-sm text-[#9F9586] shrink-0">
                            ${(b.amount || 0).toLocaleString()}
                          </div>
                        </div>

                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right 1 Col: Hot Services & Performance */}
        <div className="space-y-4 sm:space-y-5">
          
          {/* Hot Services Ranking */}
          <div className="space-y-2 sm:space-y-3">
            <div className="flex items-center justify-between px-1">
              <h2 className="text-xs sm:text-base font-serif font-bold text-gray-900 flex items-center gap-1.5">
                <FireIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-500" />
                <span>熱門款式排行榜</span>
              </h2>
              <span className="text-[10px] sm:text-[11px] text-text-light font-medium">近 60 天</span>
            </div>

            <div className="bg-white rounded-2xl border border-[#EFECE5] shadow-soft p-3 sm:p-4 space-y-2.5">
              {hotServices.length === 0 ? (
                <div className="text-center py-6 text-xs text-gray-400">
                  尚無統計數據
                </div>
              ) : (
                hotServices.map((svc, idx) => {
                  const maxCount = hotServices[0]?.count || 1;
                  const percent = Math.round((svc.count / maxCount) * 100);

                  return (
                    <div key={idx} className="space-y-1">
                      <div className="flex items-center justify-between text-xs font-bold">
                        <div className="flex items-center gap-1.5 truncate pr-2">
                          <span className={`w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full flex items-center justify-center text-[9px] sm:text-[10px] text-white shrink-0 ${
                            idx === 0 ? 'bg-amber-500 font-bold' :
                            idx === 1 ? 'bg-slate-400 font-bold' :
                            idx === 2 ? 'bg-amber-700 font-bold' :
                            'bg-gray-300 text-gray-700'
                          }`}>
                            {idx + 1}
                          </span>
                          <span className="text-gray-900 truncate text-[11px] sm:text-xs">{svc.name}</span>
                        </div>
                        <span className="text-[#9F9586] shrink-0 font-serif text-[11px] sm:text-xs">
                          {svc.count} 筆
                        </span>
                      </div>

                      {/* Progress Bar */}
                      <div className="w-full bg-[#FAF9F6] h-1.5 rounded-full overflow-hidden border border-[#EFECE5]">
                        <div 
                          className="h-full bg-gradient-to-r from-[#9F9586] to-[#8A8173] rounded-full"
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Designer Workload Distribution (Only shown when Admin/Manager views whole store) */}
          {!targetDesignerProfile && isAdminOrManager && (
            <div className="space-y-2 sm:space-y-3">
              <div className="flex items-center justify-between px-1">
                <h2 className="text-xs sm:text-base font-serif font-bold text-gray-900 flex items-center gap-1.5">
                  <UserGroupIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#9F9586]" />
                  <span>各設計師接單概況</span>
                </h2>
              </div>

              <div className="bg-white rounded-2xl border border-[#EFECE5] shadow-soft p-3 sm:p-4 space-y-2">
                {designerWorkload.map(d => (
                  <div 
                    key={d.id}
                    onClick={() => setViewMode(d.id)}
                    className="flex items-center justify-between p-2 sm:p-2.5 rounded-xl bg-[#FAF9F6] hover:bg-[#EFECE5]/60 transition-all border border-[#EFECE5] cursor-pointer group"
                  >
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span className="font-bold text-xs text-gray-900 group-hover:text-[#9F9586] transition-colors truncate">
                        {d.name}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 sm:gap-3 text-xs font-serif shrink-0">
                      <span className="text-blue-600 font-bold text-[11px] sm:text-xs">
                        今 {d.todayCount}
                      </span>
                      <span className="text-gray-300">|</span>
                      <span className="text-gray-700 font-bold text-[11px] sm:text-xs">
                        月 {d.monthCount} 筆
                      </span>
                      <ChevronRightIcon className="w-3 h-3 text-gray-400 group-hover:translate-x-0.5 transition-transform" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>

      </div>

      {/* Customer Selection Modal for Proxy Booking */}
      <CustomerSelectionModal
        isOpen={isCustomerModalOpen}
        onClose={() => setIsCustomerModalOpen(false)}
      />

    </div>
  );
};

export default AdminDashboard;