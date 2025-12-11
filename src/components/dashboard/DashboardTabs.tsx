import { useBookings } from '../../hooks/useBookings';
import BookingCard from './BookingCard';
import LoadingSpinner from '../common/LoadingSpinner';
import { Tab } from '@headlessui/react';
import { useToast } from '../../context/ToastContext'; // NEW IMPORT
import { 
  CalendarDaysIcon, 
  ArchiveBoxIcon, 
  TicketIcon, 
  CreditCardIcon 
} from '@heroicons/react/24/outline';

const DashboardTabs = () => {
  const { bookings, isLoading, error, cancelBooking } = useBookings();
  const { showToast } = useToast(); // NEW HOOK USAGE

  const handleCancel = async (bookingId: string) => {
    if (window.confirm('您確定要取消這個預約嗎？')) {
      try {
        await cancelBooking(bookingId);
        showToast('預約已取消', 'success'); // Success toast
      } catch (err) {
        console.error('取消失敗:', err);
        showToast('取消預約失敗，請稍後再試。', 'error'); // Error toast
      }
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-20 h-full items-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 text-red-600 p-4 rounded-xl text-center h-full flex items-center justify-center">
        {error}
      </div>
    );
  }

  // Filter bookings
  const now = new Date();
  const upcomingBookings = bookings.filter(b => 
    new Date(b.dateTime) >= now && !['cancelled', 'completed'].includes(b.status)
  );
  
  const pastBookings = bookings.filter(b => 
    new Date(b.dateTime) < now || ['cancelled', 'completed'].includes(b.status)
  );

  const tabs = [
    { name: '即將到來', icon: CalendarDaysIcon, count: upcomingBookings.length },
    { name: '歷史紀錄', icon: ArchiveBoxIcon, count: null },
    { name: '我的季卡', icon: TicketIcon, count: 0 },
    { name: '儲值金', icon: CreditCardIcon, count: null }, // Value could be shown here later
  ];

  return (
    <div className="flex flex-col h-full overflow-hidden"> {/* Removed card styles */}
      <Tab.Group>
        <div className="flex-shrink-0 overflow-x-auto custom-scrollbar mb-2"> {/* Removed border-b, added mb-2 */}
          <Tab.List className="flex space-x-2 min-w-max sm:min-w-0"> {/* Added space-x-2 */}
            {tabs.map((tab) => (
              <Tab
                key={tab.name}
                className={({ selected }) =>
                  `px-4 py-2.5 text-sm font-medium rounded-full transition-all whitespace-nowrap outline-none
                  ${selected 
                    ? 'bg-[#9F9586] text-white shadow-md' 
                    : 'bg-white text-gray-500 hover:bg-gray-50 border border-[#EFECE5]'
                  }`
                }
              >
                {({ selected }) => (
                  <div className="flex items-center justify-center gap-2">
                    <tab.icon className="w-5 h-5" />
                    {tab.name}
                    {tab.count !== null && tab.count > 0 && (
                      <span className={`py-0.5 px-2 rounded-full text-xs ${selected ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-600'}`}>
                        {tab.count}
                      </span>
                    )}
                  </div>
                )}
              </Tab>
            ))}
          </Tab.List>
        </div>

        <Tab.Panels className="flex-1 overflow-y-auto custom-scrollbar pr-1 pb-1"> {/* Added padding for scrollbar/shadows */}
          {/* Upcoming Panel */}
          <Tab.Panel className="space-y-4 focus:outline-none">
            {upcomingBookings.length > 0 ? (
              upcomingBookings.map(booking => (
                <BookingCard 
                  key={booking.id} 
                  booking={booking} 
                  onCancel={handleCancel}
                />
              ))
            ) : (
              <div className="text-center h-full flex flex-col justify-center items-center text-gray-400">
                <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mb-4 shadow-sm">
                  <CalendarDaysIcon className="w-8 h-8 text-[#9F9586]/50" />
                </div>
                <h3 className="text-gray-900 font-medium mb-1">目前沒有即將到來的預約</h3>
                <p className="text-gray-500 text-sm">準備好預約新的服務了嗎？</p>
              </div>
            )}
          </Tab.Panel>

          {/* Past Panel */}
          <Tab.Panel className="space-y-4 focus:outline-none h-full">
             {pastBookings.length > 0 ? (
              pastBookings.map(booking => (
                <BookingCard 
                  key={booking.id} 
                  booking={booking} 
                  isPast={true}
                />
              ))
            ) : (
              <div className="text-center h-full flex flex-col justify-center items-center text-gray-400">
                <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mb-4 shadow-sm">
                  <ArchiveBoxIcon className="w-8 h-8 text-[#9F9586]/50" />
                </div>
                <p>尚無歷史紀錄</p>
              </div>
            )}
          </Tab.Panel>

          {/* Season Pass Panel (Placeholder) */}
          <Tab.Panel className="space-y-4 focus:outline-none h-full">
            <div className="text-center h-full flex flex-col justify-center items-center text-gray-400">
              <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mb-4 shadow-sm">
                <TicketIcon className="w-8 h-8 text-[#9F9586]/50" />
              </div>
              <h3 className="text-gray-900 font-medium mb-1">您目前沒有有效的季卡</h3>
              <p className="text-gray-500 text-sm">敬請期待更多優惠方案</p>
            </div>
          </Tab.Panel>

          {/* Prepaid Panel (Placeholder) */}
          <Tab.Panel className="space-y-4 focus:outline-none h-full">
            <div className="text-center h-full flex flex-col justify-center items-center text-gray-400 min-h-[200px]">
              <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mb-4 shadow-sm border border-gray-100">
                <CreditCardIcon className="w-8 h-8 text-[#9F9586]/50" />
              </div>
              <h3 className="text-gray-900 font-medium mb-1">儲值金餘額: $0</h3>
              <p className="text-gray-500 text-sm">儲值可享更多折扣</p>
            </div>
          </Tab.Panel>
        </Tab.Panels>
      </Tab.Group>
    </div>
  );
};

export default DashboardTabs;
