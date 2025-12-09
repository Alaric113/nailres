import React from 'react';
import { format } from 'date-fns';
import { CalendarDaysIcon, ClockIcon } from '@heroicons/react/24/outline';
import { bookingStatusTextMap, getBookingStatusChipClass } from '../../utils/bookingUtils';
import type { BookingWithService } from '../../hooks/useBookings';

interface BookingCardProps {
  booking: BookingWithService;
  onCancel?: (id: string) => void;
  isPast?: boolean;
}

const BookingCard: React.FC<BookingCardProps> = ({ booking, onCancel, isPast }) => {
  const isCancellable = !isPast && !['completed', 'cancelled'].includes(booking.status);

  return (
    <div className={`
      relative group bg-white rounded-xl p-5 border border-[#EFECE5] 
      transition-all duration-300 hover:shadow-md hover:border-[#9F9586]/30
      ${isPast ? 'opacity-75 grayscale-[0.5] hover:grayscale-0 hover:opacity-100' : ''}
    `}>
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        {/* Date & Time Column */}
        <div className="flex-shrink-0 flex sm:flex-col items-center sm:items-start gap-3 sm:gap-1 min-w-[100px]">
           <div className="flex items-center gap-2 text-[#9F9586]">
             <CalendarDaysIcon className="w-5 h-5" />
             <span className="font-serif font-bold text-lg text-gray-900">
               {format(booking.dateTime, 'MM/dd')}
             </span>
           </div>
           <div className="flex items-center gap-2 text-gray-500 text-sm pl-0 sm:pl-7">
             <ClockIcon className="w-4 h-4" />
             <span>{format(booking.dateTime, 'HH:mm')}</span>
           </div>
        </div>

        {/* Details Column */}
        <div className="flex-1 border-l-0 sm:border-l sm:border-gray-100 sm:pl-4 border-t sm:border-t-0 pt-3 sm:pt-0 border-gray-100">
          <div className="flex justify-between items-start mb-2">
            <h4 className="font-bold text-gray-800 text-lg line-clamp-1">{booking.serviceName}</h4>
            <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${getBookingStatusChipClass(booking.status)}`}>
              {bookingStatusTextMap[booking.status]}
            </span>
          </div>
          
          <div className="flex items-center justify-between mt-4">
             <span className="text-xs text-gray-400">
               預約編號: #{booking.id.slice(-6).toUpperCase()}
             </span>
             
             {isCancellable && onCancel && (
               <button
                 onClick={() => onCancel(booking.id)}
                 className="text-sm text-red-500 hover:text-red-700 font-medium px-3 py-1 rounded-md hover:bg-red-50 transition-colors"
               >
                 取消
               </button>
             )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookingCard;
