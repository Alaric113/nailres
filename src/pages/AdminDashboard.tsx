import { useMemo, useState, useEffect } from 'react';
import { isWithinInterval, startOfDay, endOfDay, addDays, format, differenceInDays } from 'date-fns';
import { Link } from 'react-router-dom';
import { useAllBookings, type EnrichedBooking } from '../hooks/useAllBookings';
import { useBusinessHoursSummary } from '../hooks/useBusinessHoursSummary';
import { useAllUsers } from '../hooks/useAllUsers';
import { useServices } from '../hooks/useServices';
import { useAuthStore } from '../store/authStore';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { db } from '../lib/firebase';
import type { Designer } from '../types/designer';
import LoadingSpinner from '../components/common/LoadingSpinner';
import SummaryCard from '../components/admin/SummaryCard';
import ImageManagementModal from '../components/admin/ImageManagementModal';
import { Listbox, ListboxButton, ListboxOptions, ListboxOption } from '@headlessui/react';

import {
  BellAlertIcon,
  UsersIcon,
  CalendarDaysIcon,
  ClipboardDocumentCheckIcon,
  CreditCardIcon,
  ExclamationTriangleIcon,
  ClockIcon,
  ChevronDownIcon,
  CheckIcon,
  BuildingStorefrontIcon
} from '@heroicons/react/24/outline';

const AdminDashboard = () => {
  const { bookings, loading: bookingsLoading } = useAllBookings(null); // Removed unused error
  const { closedDays } = useBusinessHoursSummary();
  const { users } = useAllUsers();
  const { services } = useServices();
  const { userProfile, currentUser } = useAuthStore();
  
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);

  // State for View Mode (Admin/Manager only)
  // 'all' = Global View
  // 'designerId' = Specific Designer View
  const [viewMode, setViewMode] = useState<string>('all'); 
  const [allDesigners, setAllDesigners] = useState<Designer[]>([]);
  
  // Profile of the designer currently being viewed (either self or selected)
  const [targetDesignerProfile, setTargetDesignerProfile] = useState<Designer | null>(null);
  
  const [unsetDaysCount, setUnsetDaysCount] = useState<number>(0);
  // Removed unused checkingHours state

  const isAdminOrManager = userProfile?.role === 'admin' || userProfile?.role === 'manager';
  const isDesignerRole = userProfile?.role === 'designer';

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
    const fetchTargetProfile = async () => {
      // Case A: Admin/Manager selected a specific designer
      if (isAdminOrManager && viewMode !== 'all') {
        const selected = allDesigners.find(d => d.id === viewMode);
        setTargetDesignerProfile(selected || null);
        return;
      }

      // Case B: Designer Role (Always view self) (Or linked logic)
      if (isAdminOrManager && viewMode === 'all') {
        setTargetDesignerProfile(null);
        return;
      }

      // Case C: Designer Check
      if (isDesignerRole && currentUser) {
         try {
            const q = query(collection(db, 'designers'), where('linkedUserId', '==', currentUser.uid));
            const snap = await getDocs(q);
            if (!snap.empty) {
              setTargetDesignerProfile({ id: snap.docs[0].id, ...snap.docs[0].data() } as Designer);
            }
         } catch (e) { console.error(e); }
      }
    };
    fetchTargetProfile();
  }, [isAdminOrManager, isDesignerRole, currentUser, viewMode, allDesigners]);

  // Check for unset business hours (gap analysis)
  useEffect(() => {
    if (!targetDesignerProfile || !targetDesignerProfile.bookingDeadline) {
        setUnsetDaysCount(0); // Reset if no profile or no deadline
        return;
    }

    const checkUnsetHours = async () => {
      try {
        const today = startOfDay(new Date());
        const deadline = startOfDay(targetDesignerProfile.bookingDeadline!.toDate());
        
        if (deadline < today) {
            setUnsetDaysCount(0);
            return;
        }

        const hoursRef = collection(db, `designers/${targetDesignerProfile.id}/businessHours`);
        const q = query(hoursRef); 
        const snap = await getDocs(q);
        const setDates = new Set(snap.docs.map(doc => doc.id)); 

        let count = 0;
        let current = today;
        while (current <= deadline) {
            const dateStr = format(current, 'yyyy-MM-dd');
            if (!setDates.has(dateStr)) {
                count++;
            }
            current = addDays(current, 1);
        }
        setUnsetDaysCount(count);

      } catch (err) {
        console.error("Error checking unset hours:", err);
      }
    };
    checkUnsetHours();
  }, [targetDesignerProfile]);

  // --- Metrics Calculation ---
  const metrics = useMemo(() => {
    const now = new Date();
    const sevenDaysFromNow = addDays(now, 7);
    const sevenDaysAgo = addDays(now, -7);

    // Global Stats
    const global = {
        holidaysNext7Days: closedDays.filter(day => 
          isWithinInterval(day, { start: startOfDay(now), end: endOfDay(sevenDaysFromNow) })
        ).length,
        newUsersLast7Days: users.filter(user => {
          const createdAtDate = user.createdAt && 'toDate' in user.createdAt ? user.createdAt.toDate() : null;
          if (!createdAtDate) return false;
          return isWithinInterval(createdAtDate, { start: sevenDaysAgo, end: now });
        }).length,
        activeServices: services.filter(service => service.available).length,
        pendingConfirmation: bookings.filter(b => b.status === 'pending_confirmation').length,
        pendingPayment: bookings.filter(b => b.status === 'pending_payment').length,
    };

    // Personal Stats (Filtered by targetDesignerProfile if set, otherwise empty)
    let personalBookings: EnrichedBooking[] = []; // Explicit type
    if (targetDesignerProfile) {
        personalBookings = bookings.filter(b => b.designerId === targetDesignerProfile.id);
    }

    const personal = {
        pendingConfirmation: personalBookings.filter(b => b.status === 'pending_confirmation').length,
        upcomingCount: personalBookings.filter(b => b.status === 'confirmed' && b.dateTime > now).length,
        completedCount: personalBookings.filter(b => b.status === 'completed').length,
        todayCount: personalBookings.filter(b => isWithinInterval(b.dateTime, { start: startOfDay(now), end: endOfDay(now) })).length,
    };

    return { global, personal };
  }, [bookings, closedDays, users, services, targetDesignerProfile]);

  const loading = bookingsLoading; // Profile loading handled by targetDesignerProfile null check essentially

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center h-full min-h-[50vh] bg-[#FAF9F6]">
        <LoadingSpinner />
        <p className="mt-4 text-gray-500 font-medium">載入儀表板...</p>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-6 pb-20">

      {/* 0. View Switcher (Admin/Manager Only) */}
      {isAdminOrManager && (
        <div className="flex justify-between items-center bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
           <div className="flex items-center gap-3">
              <div className="bg-[#9F9586]/10 p-2 rounded-lg">
                 {viewMode === 'all' ? <BuildingStorefrontIcon className="w-6 h-6 text-[#9F9586]" /> : <UsersIcon className="w-6 h-6 text-[#9F9586]" />}
              </div>
              <div className="flex flex-col">
                  <span className="text-xs text-gray-500 font-bold uppercase tracking-wider">目前檢視</span>
                  <div className="relative w-48">
                      <Listbox value={viewMode} onChange={setViewMode}>
                          <ListboxButton className="text-left w-full flex items-center gap-2 font-bold text-gray-900 border-none p-0 focus:ring-0 text-lg cursor-pointer hover:opacity-70 transition-opacity">
                              <span className="truncate">
                                  {viewMode === 'all' ? '全店總覽' : allDesigners.find(d => d.id === viewMode)?.name || '選擇設計師'}
                              </span>
                              <ChevronDownIcon className="w-4 h-4 text-gray-400" />
                          </ListboxButton>
                          <ListboxOptions className="absolute left-0 z-50 mt-2 max-h-80 w-60 overflow-auto rounded-xl bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
                              <ListboxOption
                                  value="all"
                                  className={({ active, selected }) =>
                                      `relative cursor-default select-none py-3 pl-10 pr-4 ${
                                      active ? 'bg-[#FAF9F6] text-[#9F9586]' : 'text-gray-900'
                                      } ${selected ? 'font-bold' : 'font-normal'}`
                                  }
                              >
                                  {({ selected }) => (
                                      <>
                                          <span className="block truncate">全店總覽</span>
                                          {selected && (
                                              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-[#9F9586]">
                                                  <CheckIcon className="h-5 w-5" aria-hidden="true" />
                                              </span>
                                          )}
                                      </>
                                  )}
                              </ListboxOption>
                              <div className="border-t border-gray-100 my-1 mx-4"></div>
                              <div className="px-4 py-1 text-xs text-gray-400 font-bold uppercase">設計師</div>
                              {allDesigners.map((designer) => (
                                  <ListboxOption
                                      key={designer.id}
                                      value={designer.id}
                                      className={({ active, selected }) =>
                                          `relative cursor-default select-none py-3 pl-10 pr-4 ${
                                          active ? 'bg-[#FAF9F6] text-[#9F9586]' : 'text-gray-900'
                                          } ${selected ? 'font-bold' : 'font-normal'}`
                                      }
                                  >
                                      {({ selected }) => (
                                          <>
                                              <span className="block truncate">{designer.name}</span>
                                              {selected && (
                                                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-[#9F9586]">
                                                      <CheckIcon className="h-5 w-5" aria-hidden="true" />
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
           </div>
        </div>
      )}
      
      {/* 1. View Content */}
      {/* CASE A: Specific Designer Profile (Either by Dropdown Selection OR Designer Role Login) */}
      {targetDesignerProfile ? (
          <div className="space-y-4 animate-fade-in-up">
                {/* Personal Quick Stats */}
               <h2 className="text-xl font-serif font-bold text-gray-900 flex items-center gap-2 px-1">
                   <div className="flex items-center gap-2">
                     {targetDesignerProfile.avatarUrl ? (
                        <img src={targetDesignerProfile.avatarUrl} className="w-8 h-8 rounded-full border border-gray-200" alt="Avatar"/> 
                     ) : (
                        <span className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-xs font-bold text-gray-500">{targetDesignerProfile.name[0]}</span>
                     )}
                     <span>{targetDesignerProfile.name} 的概況</span>
                   </div>
               </h2>
               {/* Alert: Unset Business Hours / Deadline */}
               {/* Alert Logic */}
               {(() => {
                   const today = startOfDay(new Date());
                   const deadlineDate = targetDesignerProfile.bookingDeadline ? startOfDay(targetDesignerProfile.bookingDeadline.toDate()) : null;
                   const daysRemaining = deadlineDate ? differenceInDays(deadlineDate, today) : null;
                   
                   // 1. Not Set
                   if (!deadlineDate) {
                       return (
                           <div className="bg-orange-50 border border-orange-200 rounded-2xl p-4 flex items-start gap-4">
                               <div className="bg-orange-100 p-2 rounded-full text-orange-600 shrink-0">
                                   <ExclamationTriangleIcon className="w-6 h-6" />
                               </div>
                               <div className="flex-1">
                                   <h3 className="font-bold text-orange-800 text-lg">尚未設定預約期限</h3>
                                   <p className="text-sm text-orange-700 mt-1">
                                       為了讓客戶能夠預約，請前往「營業時間」設定可預約的截止日期 (Booking Deadline)。
                                   </p>
                                   <Link to="/admin/hours" className="inline-block mt-3 px-4 py-2 bg-orange-600 text-white text-sm font-bold rounded-lg hover:bg-orange-700 transition-colors">
                                       前往設定
                                   </Link>
                               </div>
                           </div>
                       );
                   }

                   // 2. Expired
                   if (daysRemaining !== null && daysRemaining < 0) {
                        return (
                           <div className="bg-red-50 border border-red-200 rounded-2xl p-4 flex items-start gap-4">
                               <div className="bg-red-100 p-2 rounded-full text-red-600 shrink-0">
                                   <ExclamationTriangleIcon className="w-6 h-6" />
                               </div>
                               <div className="flex-1">
                                   <h3 className="font-bold text-red-800 text-lg">預約期限已過期</h3>
                                   <p className="text-sm text-red-700 mt-1">
                                       目前的預約期限 ({format(deadlineDate, 'MM/dd')}) 已經過期，客戶目前無法進行新的預約。請立即更新期限。
                                   </p>
                                   <Link to="/admin/hours" className="inline-block mt-3 px-4 py-2 bg-red-600 text-white text-sm font-bold rounded-lg hover:bg-red-700 transition-colors">
                                       立即更新
                                   </Link>
                               </div>
                           </div>
                        );
                   }

                   // 3. Expiring Soon (<= 10 days)
                   if (daysRemaining !== null && daysRemaining <= 10) {
                        return (
                           <div className="bg-orange-50 border border-orange-200 rounded-2xl p-4 flex items-start gap-4">
                               <div className="bg-orange-100 p-2 rounded-full text-orange-600 shrink-0">
                                   <ClockIcon className="w-6 h-6" />
                               </div>
                               <div className="flex-1">
                                   <h3 className="font-bold text-orange-800 text-lg">預約期限即將到期</h3>
                                   <p className="text-sm text-orange-700 mt-1">
                                       距離預約截止日 ({format(deadlineDate, 'MM/dd')}) 僅剩 {daysRemaining} 天。建議您提早更新班表與期限，以免影響客戶預約權益。
                                   </p>
                                   <Link to="/admin/hours" className="inline-block mt-3 px-4 py-2 bg-orange-600 text-white text-sm font-bold rounded-lg hover:bg-orange-700 transition-colors">
                                       延長期限
                                   </Link>
                               </div>
                           </div>
                        );
                   }

                   // 4. Unset Days Gap (Only if deadline is valid and active)
                   if (unsetDaysCount > 0) {
                        return (
                            <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-4 flex items-start gap-4">
                                <div className="bg-yellow-100 p-2 rounded-full text-yellow-600 shrink-0">
                                    <ExclamationTriangleIcon className="w-6 h-6" />
                                </div>
                                <div className="flex-1">
                                    <h3 className="font-bold text-yellow-800 text-lg">有 {unsetDaysCount} 天班表未確認</h3>
                                    <p className="text-sm text-yellow-700 mt-1">
                                        在目前設定的截止日期 ({format(deadlineDate, 'MM/dd')}) 之前，尚有部分日期未設定營業時間。系統將預設為「開放預約」，請確認是否正確。
                                    </p>
                                    <Link to="/admin/hours" className="inline-block mt-3 px-4 py-2 bg-yellow-600 text-white text-sm font-bold rounded-lg hover:bg-yellow-700 transition-colors">
                                        檢查班表
                                    </Link>
                                </div>
                            </div>
                        );
                   }
                   
                   return null;
               })()}

               
               <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                   <SummaryCard
                       title="待確認訂單"
                       value={metrics.personal.pendingConfirmation}
                       unit="筆"
                       linkTo="/admin/orders?status=pending_confirmation"
                       icon={<BellAlertIcon className="h-6 w-6" />}
                       color="bg-red-500"
                       urgent={metrics.personal.pendingConfirmation > 0}
                   />
                   <SummaryCard
                       title="今日預約"
                       value={metrics.personal.todayCount}
                       unit="位"
                       linkTo="/admin/calendar"
                       icon={<CalendarDaysIcon className="h-6 w-6" />}
                       color="bg-blue-500"
                   />
                   <SummaryCard
                       title="預約期限"
                       value={targetDesignerProfile.bookingDeadline ? format(targetDesignerProfile.bookingDeadline.toDate(), 'MM/dd') : '未設定'}
                       unit=""
                       linkTo="/admin/hours"
                       icon={<CalendarDaysIcon className="h-6 w-6" />}
                       color="bg-teal-500"
                   />
                   <SummaryCard
                       title="即將到來"
                       value={metrics.personal.upcomingCount}
                       unit="筆"
                       linkTo="/admin/orders?status=confirmed"
                       icon={<ClockIcon className="h-6 w-6" />}
                       color="bg-indigo-500"
                   />
               </div>
          </div>
      ) : (
          /* CASE B: Global Overview (When viewMode === 'all' AND user is Admin/Manager in charge) */
          isAdminOrManager && (
            <div className="space-y-4 pt-4 animate-fade-in">
                 <h2 className="text-xl font-serif font-bold text-gray-900 flex items-center gap-2 px-1">
                     <UsersIcon className="w-6 h-6 text-[#9F9586]" /> 全店營運總覽
                 </h2>
                 <div className="grid grid-cols-2 lg:grid-cols-3 gap-6">
                   {/* Urgent Store-wide Items */}
                   {(metrics.global.pendingConfirmation > 0 || metrics.global.pendingPayment > 0) && (
                      <div className="col-span-2 lg:col-span-3 grid grid-cols-2 gap-4 bg-red-50 p-4 rounded-2xl border border-red-100">
                          <SummaryCard
                              title="全店待確認"
                              value={metrics.global.pendingConfirmation}
                              unit="筆"
                              linkTo="/admin/orders?status=pending_confirmation"
                              icon={<BellAlertIcon className="h-6 w-6" />}
                              color="bg-red-500"
                              urgent={true}
                          />
                           <SummaryCard
                              title="全店待付款"
                              value={metrics.global.pendingPayment}
                              unit="筆"
                              linkTo="/admin/orders?status=pending_payment"
                              icon={<CreditCardIcon className="h-6 w-6" />}
                              color="bg-orange-500"
                              urgent={true}
                          />
                      </div>
                   )}
  
                   <SummaryCard
                     title="近7日新用戶"
                     value={metrics.global.newUsersLast7Days}
                     unit="位"
                     linkTo="/admin/customers"
                     icon={<UsersIcon className="h-6 w-6" />}
                     color="bg-blue-500"
                   />
                   <SummaryCard
                     title="未來7日公休"
                     value={metrics.global.holidaysNext7Days}
                     unit="天"
                     linkTo="/admin/hours"
                     icon={<CalendarDaysIcon className="h-6 w-6" />}
                     color="bg-purple-500"
                   />
                   <SummaryCard
                     title="上架中服務"
                     value={metrics.global.activeServices}
                     unit="項"
                     linkTo="/admin/services"
                     icon={<ClipboardDocumentCheckIcon className="h-6 w-6" />}
                     color="bg-green-500"
                   />
                 </div>
            </div>
          )
      )}

      {/* Image Management Modal */}
      {isImageModalOpen && (
        <ImageManagementModal onClose={() => setIsImageModalOpen(false)} />
      )}
    </div>
  );
};

export default AdminDashboard;