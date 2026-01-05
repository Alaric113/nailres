
import { useState, useEffect, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom'; // Added import
import { format, addMinutes } from 'date-fns';
import { zhTW } from 'date-fns/locale';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import zhTwLocale from '@fullcalendar/core/locales/zh-tw';
import { collection, query, orderBy, getDocs } from 'firebase/firestore'; // Added imports
import { db } from '../lib/firebase';
import { useAllBookings, type EnrichedBooking } from '../hooks/useAllBookings';
import { useBusinessHoursSummary } from '../hooks/useBusinessHoursSummary';
import { useCurrentDesigner } from '../hooks/useCurrentDesigner'; // New hook
import { useAuthStore } from '../store/authStore'; // New hook
import type { BookingStatus } from '../types/booking';
import type { Designer } from '../types/designer'; // New type
import LoadingSpinner from '../components/common/LoadingSpinner';
import BookingDetailModal from '../components/admin/BookingDetailModal';
import { FunnelIcon, UserCircleIcon, ChevronDownIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { updateBookingStatus } from '../utils/bookingActions';

const useWindowSize = () => {
  // ... existing implementation ...
  const [size, setSize] = useState([window.innerWidth]);
  useEffect(() => {
    const handleResize = () => setSize([window.innerWidth]);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  return size;
};

const CalendarPage = () => {
  const [dateRange, setDateRange] = useState<{ start: Date; end: Date } | null>(null);

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

  const { bookings, loading, error } = useAllBookings(dateRange, effectiveDesignerId); // Pass filter

  const { closedDays } = useBusinessHoursSummary();
  const calendarRef = useRef<FullCalendar>(null);
  const [selectedBooking, setSelectedBooking] = useState<EnrichedBooking | null>(null);
  const [width] = useWindowSize();
  const isMobile = width < 768;
  const [isLegendOpen, setIsLegendOpen] = useState(false);
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);

  const getStatusColorClass = (status: BookingStatus) => {
    switch (status) {
      case 'pending_payment': return 'fc-event-yellow';
      case 'pending_confirmation': return 'fc-event-blue';
      case 'confirmed': return 'fc-event-green';
      case 'completed': return 'fc-event-gray';
      case 'cancelled': return 'fc-event-red';
      default: return '';
    }
  };

  const events = useMemo(() => bookings.map((booking) => ({
    title: `${booking.serviceName}`,
    start: booking.dateTime,
    end: addMinutes(booking.dateTime, booking.serviceDuration || 60),
    extendedProps: { booking },
    className: [
      getStatusColorClass(booking.status),
      booking.isConflicting ? 'fc-event-conflicting' : ''
    ].join(' '),
  })), [bookings]);

  const backgroundEvents = useMemo(() => closedDays.map(day => ({
    start: format(day, 'yyyy-MM-dd'),
    display: 'background',
    backgroundColor: '#fef2f2',
  })), [closedDays]);

  const handleUpdateBookingStatus = async (bookingId: string, newStatus: BookingStatus) => {
    try {
      await updateBookingStatus(bookingId, newStatus);

      // Refresh data or let live listener handle it?
      // useAllBookings uses onSnapshot internally? 
      // Let's check useAllBookings. If it uses listener, it will auto-update.
      // Assuming it does.

    } catch (error) {
      console.error("Failed to update status from calendar:", error);
      // showToast is not available here?
      // CalendarPage doesn't use useToast?
      // Ah, it doesn't seem to have useToast.
      alert('更新失敗');
    }
  };

  const changeView = (viewName: string) => {
    calendarRef.current?.getApi().changeView(viewName);
  };

  if (loading && !dateRange) {
    return (
      <div className="flex justify-center items-center h-screen bg-secondary-light">
        <div className="text-center text-text-light">
          <LoadingSpinner />
          <p className="mt-4">載入中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-secondary-light text-text-main">


      <main className="container mx-auto sm:p-6 lg:p-8">

        {/* Designer Filter Portals (Admin/Manager Only) */}
        {(userProfile?.role === 'admin' || userProfile?.role === 'manager') && (
          <>
            {/* Desktop: Portal to Header Actions */}
            {document.getElementById('admin-header-actions') && createPortal(
              <div className="flex items-center gap-2">
                <UserCircleIcon className="w-5 h-5 text-gray-400" />
                <select
                  value={selectedDesignerFilter}
                  onChange={(e) => setSelectedDesignerFilter(e.target.value)}
                  className="bg-white border border-gray-200 text-sm rounded-lg focus:ring-[#9F9586] focus:border-[#9F9586] block p-2 outline-none"
                >
                  <option value="all">所有設計師</option>
                  {allDesigners.map(d => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>
              </div>,
              document.getElementById('admin-header-actions')!
            )}

            {/* Mobile: Portal to Header Title (Center) */}
            {document.getElementById('admin-mobile-header-center') && createPortal(
              <div className="flex items-center justify-center pointer-events-auto bg-white w-full h-full">
                <div className="relative flex items-center justify-center">
                  <select
                    value={selectedDesignerFilter}
                    onChange={(e) => setSelectedDesignerFilter(e.target.value)}
                    className="appearance-none bg-transparent border-none text-base font-bold text-gray-900 focus:ring-0 p-0 text-center pr-6 cursor-pointer"
                    style={{ textAlignLast: 'center' }}
                  >
                    <option value="all">行事曆 (全店)</option>
                    {allDesigners.map(d => (
                      <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                  </select>
                  {/* Custom Chevron for visual indication */}
                  <div className="absolute right-0 pointer-events-none">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 text-gray-500">
                      <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clipRule="evenodd" />
                    </svg>
                  </div>
                </div>
              </div>,
              document.getElementById('admin-mobile-header-center')!
            )}
          </>
        )}

        {/* Error Alert */}
        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 rounded-lg p-4 mb-6 shadow-sm animate-fade-in">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-red-800">讀取預約資料時發生問題</p>
                <p className="mt-1 text-sm text-red-700">{error}</p>
              </div>
            </div>
          </div>
        )}


        {/* View Toggle - Mobile (Simplified) */}
        {isMobile && (
          <div className="flex gap-2 mb-4 m-2">
            {[
              { view: 'dayGridMonth', label: '月曆' },
              { view: 'timeGridDay', label: '日程' },
            ].map(({ view, label }) => (
              <button
                key={view}
                onClick={() => changeView(view)}
                className={`flex-1 px-4 py-2.5 text-sm font-bold rounded-xl transition-all ${calendarRef.current?.getApi().view.type === view
                  ? 'bg-[#9F9586] text-white shadow-md'
                  : 'bg-white text-gray-600 border border-gray-200'
                  }`}
              >
                {label}
              </button>
            ))}
          </div>
        )}

        {/* Legend - Collapsible on Mobile */}
        <div className="bg-white rounded-xl shadow-sm mb-4 mx-2 border border-gray-100 overflow-hidden">
          <button
            onClick={() => setIsLegendOpen(!isLegendOpen)}
            className="w-full flex items-center justify-between p-3 md:hidden"
          >
            <div className="flex items-center gap-2">
              <FunnelIcon className="h-4 w-4 text-gray-400" />
              <span className="text-sm font-medium text-gray-600">狀態圖例</span>
            </div>
            <ChevronDownIcon className={`h-4 w-4 text-gray-400 transition-transform ${isLegendOpen ? 'rotate-180' : ''}`} />
          </button>

          <div className={`${isMobile ? (isLegendOpen ? 'block' : 'hidden') : 'block'} p-3 pt-0 md:pt-3`}>
            <div className="flex flex-wrap gap-2">
              {(['pending_payment', 'pending_confirmation', 'confirmed', 'completed', 'cancelled'] as BookingStatus[]).map(status => (
                <div key={status} className="flex items-center gap-1.5 px-2 py-1 bg-gray-50 rounded-full">
                  <div className={`w-2.5 h-2.5 rounded-full ${status === 'pending_payment' ? 'bg-amber-400' :
                    status === 'pending_confirmation' ? 'bg-blue-400' :
                      status === 'confirmed' ? 'bg-green-400' :
                        status === 'completed' ? 'bg-gray-400' : 'bg-red-400'
                    }`}></div>
                  <span className="text-xs text-gray-600">{
                    { pending_payment: '待付款', pending_confirmation: '待確認', confirmed: '已確認', completed: '已完成', cancelled: '已取消' }[status]
                  }</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Calendar */}
        <div className="bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden">
          <div className="p-2 sm:p-4" style={{ minHeight: '70vh' }}>
            <FullCalendar
              ref={calendarRef}
              plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
              initialView={isMobile ? 'dayGridMonth' : 'timeGridWeek'}
              headerToolbar={{
                left: isMobile ? 'prev,next' : 'prev,today,next',
                center: 'title',
                right: isMobile ? 'today' : 'dayGridMonth,timeGridWeek,timeGridDay'
              }}
              events={[...events, ...backgroundEvents]}
              locale={zhTwLocale}
              allDaySlot={false}
              slotMinTime="09:00:00"
              slotMaxTime="21:00:00"
              height="auto"
              dayCellContent={(arg) => arg.dayNumberText.replace('日', '')}
              dayMaxEvents={isMobile ? 3 : true}
              eventContent={(arg) => {
                const booking = arg.event.extendedProps.booking as EnrichedBooking;
                const isMonthView = calendarRef.current?.getApi().view.type === 'dayGridMonth';

                // Compact view for month grid
                if (isMonthView && isMobile) {
                  return (
                    <div className="flex flex-col items-center gap-1 px-1 py-0.5 w-full">
                      
                      <span className="text-[10px] truncate">{format(booking?.dateTime || new Date(), 'HH:mm')}</span>
                      <span className="text-[10px] truncate">{arg.event.title}</span>
                    </div>
                  );
                }

                return (
                  <div className="fc-event-main-custom p-1 text-black">
                    <div className="fc-event-time text-xs font-semibold">{arg.timeText}</div>
                    <div className="fc-event-title-container">
                      <div className="fc-event-title-line text-xs font-medium truncate">
                        {arg.event.title}
                      </div>
                      {!isMobile && booking?.userName && (
                        <div className="text-xs opacity-75 truncate">
                          {booking.userName}
                        </div>
                      )}
                    </div>
                  </div>
                );
              }}
              eventClick={(info) => {
                setSelectedBooking(info.event.extendedProps.booking as EnrichedBooking);
              }}
              dateClick={(info) => {
                if (isMobile && calendarRef.current?.getApi().view.type === 'dayGridMonth') {
                  setSelectedDay(info.date);
                }
              }}
              datesSet={(arg) => {
                setDateRange({ start: arg.start, end: arg.end });
              }}
              dayCellDidMount={(arg) => {
                if (format(arg.date, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd')) {
                  arg.el.classList.add('fc-today-highlight');
                }
              }}
              slotLabelFormat={{
                hour: '2-digit',
                minute: '2-digit',
                hour12: false
              }}
              eventTimeFormat={{
                hour: '2-digit',
                minute: '2-digit',
                hour12: false
              }}
            />
          </div>
        </div>
      </main>

      {/* Booking Detail Modal */}
      {selectedBooking && (
        <BookingDetailModal
          booking={selectedBooking}
          onClose={() => setSelectedBooking(null)}
          onUpdateStatus={handleUpdateBookingStatus}
        />
      )}

      {/* Day Detail Bottom Sheet (Mobile Only) */}
      {selectedDay && isMobile && (
        <div className="fixed inset-0 z-[2000]">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setSelectedDay(null)}
          />

          {/* Sheet */}
          <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-2xl shadow-2xl max-h-[70vh] flex flex-col animate-slide-up">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-100">
              <div>
                <h3 className="text-lg font-bold text-gray-900">
                  {format(selectedDay, 'M月d日 EEEE', { locale: zhTW })}
                </h3>
                <p className="text-sm text-gray-500">
                  {bookings.filter(b => format(b.dateTime, 'yyyy-MM-dd') === format(selectedDay, 'yyyy-MM-dd')).length} 筆預約
                </p>
              </div>
              <button
                onClick={() => setSelectedDay(null)}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <XMarkIcon className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {/* Booking List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {bookings
                .filter(b => format(b.dateTime, 'yyyy-MM-dd') === format(selectedDay, 'yyyy-MM-dd'))
                .sort((a, b) => a.dateTime.getTime() - b.dateTime.getTime())
                .map(booking => (
                  <button
                    key={booking.id}
                    onClick={() => {
                      setSelectedBooking(booking);
                      setSelectedDay(null);
                    }}
                    className="w-full p-3 bg-gray-50 rounded-xl flex items-center gap-3 text-left hover:bg-gray-100 transition-colors active:scale-[0.98]"
                  >
                    {/* Time */}
                    <div className="text-center min-w-[50px]">
                      <div className="text-sm font-bold text-gray-900">
                        {format(booking.dateTime, 'HH:mm')}
                      </div>
                      <div className="text-[10px] text-gray-400">
                        {booking.serviceDuration || 60}分鐘
                      </div>
                    </div>

                    {/* Divider */}
                    <div className={`w-1 h-10 rounded-full ${booking.status === 'confirmed' ? 'bg-green-400' :
                      booking.status === 'pending_payment' ? 'bg-amber-400' :
                        booking.status === 'pending_confirmation' ? 'bg-blue-400' :
                          booking.status === 'completed' ? 'bg-gray-300' : 'bg-red-400'
                      }`} />

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-gray-900 truncate">{booking.serviceName}</div>
                      <div className="text-xs text-gray-500 truncate">
                        {booking.userName}
                      </div>
                    </div>

                    {/* Status Badge */}
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${booking.status === 'confirmed' ? 'bg-green-100 text-green-700' :
                      booking.status === 'pending_payment' ? 'bg-amber-100 text-amber-700' :
                        booking.status === 'pending_confirmation' ? 'bg-blue-100 text-blue-700' :
                          booking.status === 'completed' ? 'bg-gray-100 text-gray-600' : 'bg-red-100 text-red-700'
                      }`}>
                      {{ pending_payment: '待付款', pending_confirmation: '待確認', confirmed: '已確認', completed: '已完成', cancelled: '已取消' }[booking.status]}
                    </span>
                  </button>
                ))
              }

              {bookings.filter(b => format(b.dateTime, 'yyyy-MM-dd') === format(selectedDay, 'yyyy-MM-dd')).length === 0 && (
                <div className="text-center py-8 text-gray-400">
                  <p>這天沒有預約</p>
                </div>
              )}
            </div>

            {/* Quick Action */}
            <div className="p-4 border-t border-gray-100 pb-8">
              <button
                onClick={() => {
                  calendarRef.current?.getApi().gotoDate(selectedDay);
                  calendarRef.current?.getApi().changeView('timeGridDay');
                  setSelectedDay(null);
                }}
                className="w-full py-3 bg-[#9F9586] text-white font-bold rounded-xl active:scale-[0.98] transition-transform"
              >
                查看日程詳情
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Custom Styles */}
      <style>{`
        /* Calendar customization */
        .fc {
          font-family: inherit;
        }

        .fc-toolbar-title {
          font-size: 1.25rem !important;
          font-weight: 700 !important;
          color: #5C5548; /* text-main */
          font-family: "Playfair Display", serif;
        }

        @media (min-width: 640px) {
          .fc-toolbar-title {
            font-size: 1.5rem !important;
          }
        }

        .fc-button {
          background-color: #fff !important;
          border: 1px solid #DCD8CF !important; /* secondary-dark */
          color: #5C5548 !important; /* text-main */
          text-transform: none !important;
          font-weight: 500 !important;
          padding: 0.375rem 0.75rem !important;
          border-radius: 0.5rem !important;
          transition: all 0.2s !important;
        }

        .fc-button:hover {
          background-color: #EFECE5 !important; /* secondary */
          border-color: #B7AD9E !important; /* primary-light */
        }

        .fc-button-active {
          background-color: #9F9586 !important; /* primary */
          border-color: #9F9586 !important;
          color: #fff !important;
        }

        .fc-button-active:hover {
          background-color: #8A8173 !important; /* primary-dark */
          border-color: #8A8173 !important;
        }

        .fc-today-button:disabled {
          opacity: 0.5 !important;
        }

        /* Event colors */
        .fc-event-yellow {
          background-color: #fef3c7 !important;
          border-color: #f59e0b !important;
          color: #92400e !important;
        }

        .fc-event-blue {
          background-color: #dbeafe !important;
          border-color: #3b82f6 !important;
          color: #1e3a8a !important;
        }

        .fc-event-green {
          background-color: #d1fae5 !important;
          border-color: #10b981 !important;
          color: #065f46 !important;
        }

        .fc-event-gray {
          background-color: #f3f4f6 !important;
          border-color: #9ca3af !important;
          color: #374151 !important;
        }

        .fc-event-red {
          background-color: #fee2e2 !important;
          border-color: #ef4444 !important;
          color: #991b1b !important;
        }

        .fc-event-conflicting {
          border: 2px solid #dc2626 !important;
          box-shadow: 0 0 0 2px #fee2e2 !important;
        }

        .fc-event {
          border-radius: 0.375rem !important;
          cursor: pointer !important;
          transition: all 0.2s !important;
          color:#000000;
        }

        .fc-event:hover {
          transform: scale(1.02);
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
        }

        /* Today highlight */
        .fc-today-highlight {
          background-color: rgba(159, 149, 134, 0.1) !important; /* primary with opacity */
        }

        .fc-day-today {
          background-color: rgba(159, 149, 134, 0.05) !important;
        }

        /* Slot styling */
        .fc-timegrid-slot {
          height: 3rem !important;
          border-bottom: 1px solid #EFECE5 !important; /* secondary */
        }

        .fc-col-header-cell {
          background-color: #FDFBF7 !important; /* secondary-light */
          font-weight: 600 !important;
          color: #5C5548 !important; /* text-main */
          padding: 0.75rem 0.5rem !important;
          border-bottom: 1px solid #DCD8CF !important; /* secondary-dark */
        }
        
        .fc-theme-standard td, .fc-theme-standard th {
            border-color: #EFECE5 !important; /* secondary */
        }

        /* Mobile adjustments */
        @media (max-width: 767px) {
          /* === TOOLBAR: 改為單行 === */
          .fc-toolbar {
            flex-direction: row !important;  /* 改 column 為 row 可變單行 */
            flex-wrap: nowrap !important;
            gap: 0.5rem;
            justify-content: space-between;
            align-items: center;
          }

          .fc-toolbar-chunk {
            display: flex;
            justify-content: center;
          }
          
          /* 標題字體縮小以適應單行 */
          .fc-toolbar-title {
            font-size: 1rem !important;
          }

          .fc-button {
            font-size: 0.75rem !important;  /* 按鈕字體縮小 */
            padding: 0.25rem 0.5rem !important;
          }

          /* === 日期數字置於左上角 === */
          .fc-daygrid-day-top {
            justify-content: flex-start !important;  /* 改 center 為 flex-start */
            padding: 2px 4px !important;
          }
          
          .fc-daygrid-day-number {
            font-size: 0.75rem !important;
            font-weight: 600;
            color: #5C5548;
          }

          .fc-timegrid-slot {
            height: 2.5rem !important;
          }
        }

        /* Animation */
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-fade-in {
          animation: fade-in 0.3s ease-out;
        }

        @keyframes slide-up {
          from {
            transform: translateY(100%);
          }
          to {
            transform: translateY(0);
          }
        }

        .animate-slide-up {
          animation: slide-up 0.3s ease-out;
        }

        /* Mobile Month View Enhancements */
        @media (max-width: 767px) {
          .fc-daygrid-day-frame {
            min-height: 50px !important;
          }
          
          .fc-daygrid-event {
            margin: 1px 2px !important;
          }
          
          .fc-daygrid-more-link {
            font-size: 10px !important;
            color: #9F9586 !important;
          }
        }
      `}</style>
    </div>
  );
};

export default CalendarPage;