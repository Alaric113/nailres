

import { useBookings } from '../../hooks/useBookings';
import BookingCard from '../../components/dashboard/BookingCard';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { ArchiveBoxIcon, ChevronLeftIcon } from '@heroicons/react/24/outline';
import { useNavigate } from 'react-router-dom';

const MemberHistoryPage = () => {
  const { bookings, isLoading, error } = useBookings();
  const navigate = useNavigate();
  
  // Filter for Past History (Completed, Cancelled, or Past Dates)
  const now = new Date();
  const historyBookings = bookings.filter(b => 
    new Date(b.dateTime) < now || ['cancelled', 'completed'].includes(b.status)
  );

  return (
    <div className="min-h-[calc(100vh-64px)] bg-[#FAF9F6] pb-24">
      {/* Header */}
      <div className="bg-white px-4 py-3 shadow-sm sticky top-16 z-10 flex items-center gap-2">
        <button 
          onClick={() => navigate(-1)}
          className="p-2 rounded-full hover:bg-gray-100 transition-colors"
        >
          <ChevronLeftIcon className="w-5 h-5 text-gray-600" />
        </button>
        <h1 className="text-lg font-bold text-gray-900">歷史預約紀錄</h1>
      </div>

      <div className="px-4 py-6 space-y-4">
        {isLoading ? (
          <div className="py-10 flex justify-center"><LoadingSpinner /></div>
        ) : error ? (
          <div className="text-red-500 text-center py-10">{error}</div>
        ) : historyBookings.length > 0 ? (
          historyBookings.map(booking => (
            <BookingCard 
              key={booking.id} 
              booking={booking} 
              isPast={true}
            />
          ))
        ) : (
          <div className="flex flex-col items-center justify-center py-16 text-gray-400 bg-white rounded-2xl border border-dashed border-[#EFECE5]">
            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
              <ArchiveBoxIcon className="w-8 h-8 text-gray-300" />
            </div>
            <p>尚無歷史預約紀錄</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default MemberHistoryPage;
