import React from 'react';
import { format } from 'date-fns';
import { CalendarDaysIcon, ClockIcon, SparklesIcon } from '@heroicons/react/24/outline';
import { bookingStatusTextMap, getBookingStatusChipClass } from '../../utils/bookingUtils';
import type { BookingWithService } from '../../hooks/useBookings';

interface BookingCardProps {
  booking: BookingWithService;
  onCancel?: (id: string) => void;
  isPast?: boolean;
}

const BookingCard: React.FC<BookingCardProps> = ({ booking, onCancel, isPast }) => {
  const isCancellable = !isPast && !['completed', 'cancelled'].includes(booking.status);
  
  // Reschedule restriction: Cannot change within 3 days (72 hours) of start time
  const now = new Date();
  const diffInHours = (booking.dateTime.getTime() - now.getTime()) / (1000 * 60 * 60);
  const isWithinRestrictionPeriod = diffInHours < 72;
  const canReschedule = (!booking.rescheduleCount || booking.rescheduleCount < 1) && !isWithinRestrictionPeriod;

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
           {/* General View Details Link */}
             <a
                 href={`/orders/${booking.id}`}
                 className="flex items-center gap-1.5 px-3 py-2 text-sm text-[#9F9586] hover:text-[#8a8174] font-medium transition-colors ml-auto"
             >
                 查看詳情 &rarr;
             </a>
        </div>

        {/* Details Column */}
        <div className="flex-1 border-l-0 sm:border-l sm:border-gray-100 sm:pl-4 border-t sm:border-t-0 pt-3 sm:pt-0 border-gray-100">
          <div className="flex justify-between items-start mb-2">
            <h4 className="font-bold text-gray-800 text-lg line-clamp-1">{booking.serviceName}</h4>
            <span className={`px-2.5 py-1 text-xs text-nowrap font-medium rounded-full ${getBookingStatusChipClass(booking.status)}`}>
              {bookingStatusTextMap[booking.status]}
            </span>
          </div>

          <div className="flex items-center justify-between gap-1.5 text-sm text-gray-600 mb-2">
            <div className="flex items-center gap-2">
               <SparklesIcon className="w-4 h-4 text-[#9F9586]" />
               <span>{booking.designerName || '不指定設計師'}</span>
            </div>
            <span className={`text-xs ${booking.status === 'completed' ? 'hidden' : ''} text-gray-400 bg-[#EFECE5] px-2 py-1 rounded-full`}>剩餘更改次數 {!booking.rescheduleCount || booking.rescheduleCount < 1? '1次': '0次'}</span>
          </div>
          
          <div className="flex items-center justify-between mt-4">
             <span className="text-xs text-gray-400">
               預約編號: #{booking.id.slice(-6).toUpperCase()}
             </span>
             
             {isCancellable && (
                <div className="flex gap-2">
                   {/* Reschedule Button: Only if limit not reached and not within 3 days */}
                   {canReschedule ? (
                       <a
                         href={`/member/reschedule/${booking.id}`}
                         className="text-sm text-[#9F9586] hover:text-primary-dark font-medium px-3 py-1 rounded-md hover:bg-[#FAF9F6] transition-colors border border-[#9F9586]"
                       >
                         更改日期
                       </a>
                   ) : (
                      // Show restriction message if within period but count is OK? 
                      // Or just show nothing? 
                      // If count exhausted -> nothing/count label shows it.
                      // If time restricted -> specific message?
                      // The top label shows "Remaining count". 
                      // Let's just hide the button for now, or show disabled?
                      // User request was "unable to change".
                      // I'll render nothing for the button effectively disabled it.
                      // Maybe I should add a check to show WHY if user is curious?
                      // For now, implementing the hide logic as requested.
                      null
                   )}

                   {onCancel && (
                    <button
                        onClick={() => onCancel(booking.id)}
                        className="text-sm hidden text-red-500 hover:text-red-700 font-medium px-3 py-1 rounded-md hover:bg-red-50 transition-colors border border-red-200"
                    >
                        取消
                    </button>
                   )}
                </div>
             )}
             
             {booking.status === 'completed' && (
                <a 
                    href={`/orders/${booking.id}/feedback`}
                    className="flex items-center gap-1.5 px-4 py-2 text-sm font-bold text-white bg-primary hover:bg-primary-dark rounded-lg shadow-sm hover:shadow-md transition-all ml-2 active:scale-95"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                      <path fillRule="evenodd" d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.007 5.404.433c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.433 2.082-5.006z" clipRule="evenodd" />
                    </svg>
                    {booking.customerFeedback ? '查看評價' : '給予評價'}
                </a>
             )}
             
             
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookingCard;
