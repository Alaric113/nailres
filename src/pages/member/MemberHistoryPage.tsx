import { useState } from 'react';
import { useBookings } from '../../hooks/useBookings';
import BookingCard from '../../components/dashboard/BookingCard';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { ArchiveBoxIcon, ChevronLeftIcon, CalendarDaysIcon } from '@heroicons/react/24/outline';
import { useNavigate } from 'react-router-dom';
import { isBefore } from 'date-fns';
import { isLiffBrowser } from '../../lib/liff'; // Import isLiffBrowser

type Tab = 'upcoming' | 'history';

const MemberHistoryPage = () => {
  const { bookings, isLoading, error, cancelBooking } = useBookings();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<Tab>('upcoming');
  const now = new Date();
  
  // Check if running in LIFF
  const isLiff = isLiffBrowser();

  // Filter Bookings
  const upcomingBookings = bookings.filter(b => {
    const isPast = isBefore(b.dateTime, now);
    const isCompleted = ['completed', 'cancelled'].includes(b.status);
    return !isPast && !isCompleted;
  });

  const historyBookings = bookings.filter(b => {
    const isPast = isBefore(b.dateTime, now);
    const isCompleted = ['completed', 'cancelled'].includes(b.status);
    return isPast || isCompleted;
  });

  const displayedBookings = activeTab === 'upcoming' ? upcomingBookings : historyBookings;

  return (
    <div className={`min-h-screen bg-[#FAF9F6] pb-24 ${isLiff ? 'pt-[env(safe-area-inset-top)]' : ''}`}>
      {/* Header */}
      <div className={`bg-white px-4 py-3 shadow-sm sticky z-30 ${isLiff ? 'top-0 pt-2' : 'top-16'}`}>
        <div className="flex items-center gap-2 mb-4">
          {/* Hide Back Button in LIFF if appropriate, or keep it. User requested optimization. 
              Usually in LIFF, native header might handle back, or we want full width. 
              Let's keep it but ensure spacing is distinct. 
          */}
          <button 
            onClick={() => navigate(-1)}
            className="p-2 rounded-full hover:bg-gray-100 transition-colors"
          >
            <ChevronLeftIcon className="w-5 h-5 text-gray-600" />
          </button>
          <h1 className="text-lg font-bold text-gray-900">我的預約</h1>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-100">
            <button
                onClick={() => setActiveTab('upcoming')}
                className={`flex-1 pb-3 text-sm font-bold transition-colors relative ${
                    activeTab === 'upcoming' ? 'text-[#9F9586]' : 'text-gray-400'
                }`}
            >
                未完成預約
                {activeTab === 'upcoming' && (
                    <MotionDiv layoutId="activeTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#9F9586]" />
                )}
            </button>
            <button
                onClick={() => setActiveTab('history')}
                className={`flex-1 pb-3 text-sm font-bold transition-colors relative ${
                    activeTab === 'history' ? 'text-[#9F9586]' : 'text-gray-400'
                }`}
            >
                歷史預約
                {activeTab === 'history' && (
                    <MotionDiv layoutId="activeTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#9F9586]" />
                )}
            </button>
        </div>
      </div>

      <div className="px-4 py-6 space-y-4">
        {isLoading ? (
          <div className="py-10 flex justify-center"><LoadingSpinner /></div>
        ) : error ? (
          <div className="text-red-500 text-center py-10">{error}</div>
        ) : displayedBookings.length > 0 ? (
          displayedBookings.map(booking => (
            <BookingCard 
              key={booking.id} 
              booking={booking} 
              isPast={activeTab === 'history'}
              onCancel={activeTab === 'upcoming' ? cancelBooking : undefined} // Enable cancel for upcoming
            />
          ))
        ) : (
          <div className="flex flex-col items-center justify-center py-16 text-gray-400 bg-white rounded-2xl border border-dashed border-[#EFECE5]">
            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
              {activeTab === 'upcoming' ? (
                  <CalendarDaysIcon className="w-8 h-8 text-gray-300" />
              ) : (
                  <ArchiveBoxIcon className="w-8 h-8 text-gray-300" />
              )}
            </div>
            <p>{activeTab === 'upcoming' ? '尚無即將到來的預約' : '尚無歷史預約紀錄'}</p>
          </div>
        )}
      </div>
    </div>
  );
};

// Simple Motion div replacement
const MotionDiv = ({ className }: { className: string, layoutId?: string }) => <div className={className} />;

export default MemberHistoryPage;
