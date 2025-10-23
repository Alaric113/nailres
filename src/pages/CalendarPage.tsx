import { Link } from 'react-router-dom';
import { useState, useEffect, useMemo, useRef } from 'react';
import { format, addMinutes } from 'date-fns';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import zhTwLocale from '@fullcalendar/core/locales/zh-tw';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAllBookings, type EnrichedBooking } from '../hooks/useAllBookings';
import { useBusinessHoursSummary } from '../hooks/useBusinessHoursSummary';
import type { BookingStatus } from '../types/booking';
import LoadingSpinner from '../components/common/LoadingSpinner';
import BookingDetailModal from '../components/admin/BookingDetailModal';

const useWindowSize = () => {
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
  const { bookings, loading, error } = useAllBookings(dateRange);
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
    title: `${booking.serviceName}`, // Only show service name
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
    backgroundColor: '#fef2f2', // red-50
  })), [closedDays]);

  const handleUpdateBookingStatus = async (bookingId: string, newStatus: BookingStatus) => {
    const bookingRef = doc(db, 'bookings', bookingId);
    await updateDoc(bookingRef, { status: newStatus });
  };

  if (loading && !dateRange) {
    return <div className="flex justify-center items-center h-screen"><LoadingSpinner /></div>;
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow-sm">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-800">
            所有行程
          </h1>
          <Link to="/admin" className="text-sm font-medium text-indigo-600 hover:underline">
            &larr; 返回管理員頁面
          </Link>
        </div>
      </header>
      <main className="container mx-auto p-4 sm:p-6 lg:p-8">
        {error && (
          <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4" role="alert">
            <p className="font-bold">錯誤</p>
            <p>讀取預約資料時發生問題: {error}</p>
          </div>
        )}
        <div className="bg-white p-1 pt-2 rounded-xl shadow-md" style={{ minHeight: '80vh' }}>
          <FullCalendar
            ref={calendarRef}
            plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
            initialView={isMobile ? 'timeGridDay' : 'timeGridWeek'}
            headerToolbar={{
              left: 'prev,today,next',
              center: 'title',
              right: 'dayGridMonth,timeGridWeek,timeGridDay'
            }}
            events={[...events, ...backgroundEvents]}
            locale={zhTwLocale}
            allDaySlot={false}
            slotMinTime="09:00:00"
            slotMaxTime="21:00:00"
            height="auto"
            eventContent={(arg) => {
              const titleParts = arg.event.title.split('\n');
              return (
                <div className="fc-event-main-custom">
                  <div className="fc-event-time">{arg.timeText}</div>
                  <div className="fc-event-title-container">
                    {titleParts.map((part, i) => <div key={i} className="fc-event-title-line">{part}</div>)}
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
          />
        </div>
      </main>
      {selectedBooking && (
        <BookingDetailModal
          booking={selectedBooking}
          onClose={() => setSelectedBooking(null)}
          onUpdateStatus={handleUpdateBookingStatus}
        />
      )}
    </div>
  );
};

export default CalendarPage;
