import { useBookings } from '../../hooks/useBookings';
import BookingCard from '../dashboard/BookingCard';
import LoadingSpinner from '../common/LoadingSpinner';
import { Tab } from '@headlessui/react';
import { 
  ArchiveBoxIcon, 
  GiftIcon, 
  TicketIcon
} from '@heroicons/react/24/outline';

const MemberTabs = () => {
  const { bookings, isLoading, error } = useBookings();
  
  // Filter for Past History (Completed, Cancelled, or Past Dates)
  const now = new Date();
  const historyBookings = bookings.filter(b => 
    new Date(b.dateTime) < now || ['cancelled', 'completed'].includes(b.status)
  );

  const tabs = [
    { name: '歷史紀錄', icon: ArchiveBoxIcon },
    { name: '點數兌換', icon: GiftIcon },
    { name: '購買季卡', icon: TicketIcon },
  ];

  if (isLoading) return <div className="py-10 flex justify-center"><LoadingSpinner /></div>;
  if (error) return <div className="text-red-500 text-center py-10">{error}</div>;

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <Tab.Group>
        <div className="flex-shrink-0 overflow-x-auto custom-scrollbar mb-4">
          <Tab.List className="flex space-x-2 min-w-max sm:min-w-0">
            {tabs.map((tab) => (
              <Tab
                key={tab.name}
                className={({ selected }) =>
                  `px-4 py-2.5 text-sm font-medium rounded-full transition-all whitespace-nowrap outline-none flex items-center gap-2
                  ${selected 
                    ? 'bg-[#9F9586] text-white shadow-md' 
                    : 'bg-white text-gray-500 hover:bg-gray-50 border border-[#EFECE5]'
                  }`
                }
              >
                <tab.icon className="w-4 h-4" />
                {tab.name}
              </Tab>
            ))}
          </Tab.List>
        </div>

        <Tab.Panels className="flex-1 overflow-y-auto custom-scrollbar pb-20">
          {/* 1. History Panel */}
          <Tab.Panel className="space-y-4 focus:outline-none">
            {historyBookings.length > 0 ? (
              historyBookings.map(booking => (
                <BookingCard 
                  key={booking.id} 
                  booking={booking} 
                  isPast={true}
                />
              ))
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                  <ArchiveBoxIcon className="w-8 h-8 text-gray-300" />
                </div>
                <p>尚無歷史預約紀錄</p>
              </div>
            )}
          </Tab.Panel>

          {/* 2. Rewards Redemption Panel (Mockup) */}
          <Tab.Panel className="space-y-4 focus:outline-none">
            <div className="grid grid-cols-2 gap-4">
               {/* Mock Reward Cards */}
               {[
                 { id: 1, title: '免費卸甲券', points: 500, img: 'bg-orange-100' },
                 { id: 2, title: '$100 折價券', points: 1000, img: 'bg-blue-100' },
                 { id: 3, title: '手部保養 5折', points: 2000, img: 'bg-green-100' },
                 { id: 4, title: '精選指緣油', points: 3000, img: 'bg-pink-100' },
               ].map(reward => (
                 <div key={reward.id} className="bg-white p-4 rounded-xl border border-[#EFECE5] flex flex-col items-center text-center">
                    <div className={`w-12 h-12 rounded-full mb-3 ${reward.img} flex items-center justify-center`}>
                      <GiftIcon className="w-6 h-6 text-gray-600" />
                    </div>
                    <h4 className="font-bold text-gray-900 text-sm">{reward.title}</h4>
                    <p className="text-[#9F9586] font-bold text-xs mt-1">{reward.points} pt</p>
                    <button className="mt-3 w-full py-1.5 bg-[#FAF9F6] text-gray-600 text-xs font-medium rounded-lg hover:bg-[#9F9586] hover:text-white transition-colors">
                      立即兌換
                    </button>
                 </div>
               ))}
            </div>
          </Tab.Panel>

          {/* 3. Season Pass Purchase Panel (Mockup) */}
          <Tab.Panel className="space-y-4 focus:outline-none">
             {[
               { id: 1, name: '輕量季卡', price: 3000, credit: 3500, color: 'from-[#9F9586] to-[#8a8173]' },
               { id: 2, name: '尊榮年卡', price: 10000, credit: 12000, color: 'from-gray-800 to-black' },
             ].map(pass => (
               <div key={pass.id} className="relative overflow-hidden rounded-2xl shadow-lg text-white">
                 <div className={`absolute inset-0 bg-gradient-to-br ${pass.color}`}></div>
                 <div className="relative p-6">
                    <div className="flex justify-between items-start mb-8">
                       <div>
                         <h3 className="text-xl font-serif font-bold">{pass.name}</h3>
                         <p className="text-white/80 text-xs mt-1">儲值 ${pass.price} 可使用 ${pass.credit}</p>
                       </div>
                       <TicketIcon className="w-8 h-8 opacity-50" />
                    </div>
                    <div className="flex justify-between items-end">
                       <div className="text-3xl font-bold">${pass.price}</div>
                       <button className="px-4 py-2 bg-white/20 backdrop-blur-md rounded-lg text-sm font-medium hover:bg-white hover:text-gray-900 transition-all">
                         購買方案
                       </button>
                    </div>
                 </div>
               </div>
             ))}
          </Tab.Panel>
        </Tab.Panels>
      </Tab.Group>
    </div>
  );
};

export default MemberTabs;
