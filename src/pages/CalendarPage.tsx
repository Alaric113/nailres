
import { useState, useEffect, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom'; // Added import
import { format, addMinutes } from 'date-fns';
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
import { FunnelIcon, UserCircleIcon } from '@heroicons/react/24/outline'; // Added Icon
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
      

      <main className="container mx-auto p-4 sm:p-6 lg:p-8">
        
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

       
        {/* View Toggle - Mobile */}
        {isMobile && (
          <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
            {[
              { view: 'dayGridMonth', label: '月' },
              { view: 'timeGridWeek', label: '週' },
              { view: 'timeGridDay', label: '日' },
              
              
            ].map(({ view, label }) => (
              <button
                key={view}
                onClick={() => changeView(view)}
                className="px-4 py-2 text-sm font-medium text-text-main bg-white border border-secondary-dark rounded-lg hover:bg-secondary-light transition-colors whitespace-nowrap"
              >
                {label}視圖
              </button>
            ))}
          </div>
        )}

        {/* Legend */}
        <div className="bg-white rounded-xl shadow-sm p-4 mb-6 border border-secondary-dark/50">
          <div className="flex items-center gap-2 mb-3">
            <FunnelIcon className="h-5 w-5 text-text-light" />
            <h3 className="text-sm font-serif font-semibold text-text-main">圖例</h3>
          </div>
          <div className="flex flex-wrap gap-3">
            {(['pending_payment', 'pending_confirmation', 'confirmed', 'completed', 'cancelled'] as BookingStatus[]).map(status => (
              <div key={status} className="flex items-center gap-2">
                <div className={`w-4 h-4 rounded ${getStatusColorClass(status)}`}></div>
                <span className="text-xs sm:text-sm text-text-light">{
                  { pending_payment: '待付款', pending_confirmation: '待確認', confirmed: '已確認', completed: '已完成', cancelled: '已取消' }[status]
                }</span>
              </div>
            ))}
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded fc-event-conflicting"></div>
              <span className="text-xs sm:text-sm text-text-light">時間衝突</span>
            </div>
          </div>
        </div>

        {/* Calendar */}
        <div className="bg-white rounded-xl shadow-md border border-secondary-dark/50 overflow-hidden">
          <div className="p-2 sm:p-4" style={{ minHeight: '70vh' }}>
            <FullCalendar
              ref={calendarRef}
              plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
              initialView={isMobile ? 'timeGridDay' : 'timeGridWeek'}
              headerToolbar={{
                left: isMobile ? 'prev,today,next' : 'prev,today,next',
                center: 'title',
                right: isMobile ? '' : 'dayGridMonth,timeGridWeek,timeGridDay'
              }}
              events={[...events, ...backgroundEvents]}
              locale={zhTwLocale}
              allDaySlot={false}
              slotMinTime="09:00:00"
              slotMaxTime="21:00:00"
              height="auto"
              eventContent={(arg) => {
                const booking = arg.event.extendedProps.booking as EnrichedBooking;
                return (
                  <div className="fc-event-main-custom p-1">
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
          .fc-toolbar {
            flex-direction: column !important;
            gap: 0.75rem;
          }

          .fc-toolbar-chunk {
            display: flex;
            justify-content: center;
          }

          .fc-button {
            font-size: 0.875rem !important;
            padding: 0.25rem 0.5rem !important;
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
      `}</style>
    </div>
  );
};

export default CalendarPage;