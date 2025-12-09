import { useBookings } from '../../hooks/useBookings';
import { format } from 'date-fns';
import { zhTW } from 'date-fns/locale';
import { CalendarDaysIcon, ClockIcon } from '@heroicons/react/24/outline';
import { Link } from 'react-router-dom';

const UpcomingBookingWidget = () => {
  const { bookings, isLoading } = useBookings();
  
  // Find the next upcoming confirmed booking
  const nextBooking = bookings
    .filter(b => new Date(b.dateTime) >= new Date() && ['confirmed', 'pending_confirmation'].includes(b.status))
    .sort((a, b) => new Date(a.dateTime).getTime() - new Date(b.dateTime).getTime())[0];

  if (isLoading || !nextBooking) return null;

  return (
    <div className="bg-white rounded-2xl p-4 border border-[#EFECE5] shadow-sm mb-6">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-bold text-[#9F9586] flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
          </span>
          即將到來的預約
        </h3>
        <Link to="/booking" className="text-xs text-gray-400 hover:text-gray-600">
          查看全部
        </Link>
      </div>
      
      <div className="flex gap-4 items-center">
        <div className="bg-[#FAF9F6] p-3 rounded-xl flex flex-col items-center justify-center min-w-[60px]">
          <span className="text-xs text-gray-500 font-medium">
            {format(nextBooking.dateTime, 'MMM', { locale: zhTW })}
          </span>
          <span className="text-xl font-bold text-gray-900">
            {format(nextBooking.dateTime, 'dd')}
          </span>
        </div>
        
        <div className="flex-1 overflow-hidden">
          <h4 className="font-bold text-gray-900 truncate">{nextBooking.serviceName}</h4>
          <div className="flex items-center gap-3 mt-1 text-sm text-gray-500">
             <div className="flex items-center gap-1">
               <ClockIcon className="w-4 h-4" />
               {format(nextBooking.dateTime, 'HH:mm')}
             </div>
             <div className="flex items-center gap-1">
               <CalendarDaysIcon className="w-4 h-4" />
               {format(nextBooking.dateTime, 'EEEE', { locale: zhTW })}
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UpcomingBookingWidget;
