import { Link } from 'react-router-dom';
import { useState } from 'react';
import { Calendar, dateFnsLocalizer, Views, type View } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay } from 'date-fns';
import { zhTW } from 'date-fns/locale';
import { addMinutes } from 'date-fns';
import { useAllBookings } from '../hooks/useAllBookings';
import { useBusinessHoursSummary } from '../hooks/useBusinessHoursSummary';
import type { EnrichedBooking } from '../types/booking';
import LoadingSpinner from '../components/common/LoadingSpinner';

import 'react-big-calendar/lib/css/react-big-calendar.css';

// Setup the localizer by providing the moment Object
// to the correct localizer.
const locales = {
  'zh-TW': zhTW,
};

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: (date: Date) => startOfWeek(date, { locale: zhTW }),
  getDay,
  locales,
});

const AdminDashboard = () => {
  const { bookings, loading, error } = useAllBookings();
  const { closedDays } = useBusinessHoursSummary();
  const [date, setDate] = useState(new Date());
  const [view, setView] = useState<View>(Views.WEEK);

  const getStatusChipClass = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'bg-green-100 text-green-800';
      case 'completed':
        return 'bg-blue-100 text-blue-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const events = bookings.map((booking: EnrichedBooking) => ({
    title: `${booking.userName} - ${booking.serviceName}`,
    start: booking.dateTime.toDate(),
    end: addMinutes(booking.dateTime.toDate(), booking.serviceDuration || 60),
    resource: booking, // Store original booking data
  }));

  const dayPropGetter = (date: Date) => {
    const isClosed = closedDays.some(
      closedDay => format(closedDay, 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd')
    );
    if (isClosed) {
      return {
        style: {
          backgroundColor: '#fef2f2', // Tailwind's red-50
        },
      };
    }
    return {};
  };
  if (loading && bookings.length === 0) {
    return <div className="flex justify-center items-center h-screen"><LoadingSpinner /></div>;
  }

  if (error) {
    return <div className="text-red-500 text-center mt-10">Error loading bookings: {error.message}</div>;
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow-sm">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-800">
            管理員後台
          </h1>
          <div className="flex items-center gap-4">
            <Link to="/admin/hours" className="px-4 py-2 bg-yellow-500 text-white font-semibold rounded-md shadow-sm hover:bg-yellow-600 transition-colors">
              營業時間
            </Link>
            <Link to="/admin/customers" className="px-4 py-2 bg-green-500 text-white font-semibold rounded-md shadow-sm hover:bg-green-600 transition-colors">
              客戶管理
            </Link>
            <Link to="/admin/services" className="px-4 py-2 bg-blue-500 text-white font-semibold rounded-md shadow-sm hover:bg-blue-600 transition-colors">
              服務管理
            </Link>
            <Link to="/dashboard" className="text-sm font-medium text-indigo-600 hover:underline">
              返回使用者儀表板 &rarr;
            </Link>
          </div>
        </div>
      </header>
      <main className="container mx-auto p-4 sm:p-6 lg:p-8">
        <div className="bg-white p-4 rounded-lg shadow-md" style={{ height: '80vh' }}>
          <Calendar
            localizer={localizer}
            events={events}
            startAccessor="start"
            endAccessor="end"
            defaultView={Views.WEEK}
            date={date}
            view={view}
            onNavigate={setDate}
            culture='zh-TW'
            onView={setView}
            views={[Views.MONTH, Views.WEEK, Views.DAY, Views.AGENDA]}
            messages={{
              next: "向後",
              previous: "向前",
              today: "今天",
              month: "月",
              week: "週",
              day: "日",
              agenda: "列表"
            }}
            components={{
              day: { header: DayHeader },
            }}
            eventPropGetter={(event) => ({
              className: getStatusChipClass(event.resource.status),
              style: {
                border: 'none',
                color: '#1f2937',
              }
            })}
            dayPropGetter={dayPropGetter}
          />
        </div>
      </main>
    </div>
  );
};
// A custom component to render the day headers, allowing us to style them.
const DayHeader = ({ date, label }: { date: Date; label: string }) => {
  const isToday = format(date, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd');
  return (
    <span className={isToday ? 'font-bold text-pink-600' : ''}>
      {label}
    </span>
  );
};

export default AdminDashboard;