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
    <div className="w-full">
      <Tab.Group>
        <div className="sticky top-0 z-10 bg-[#FAF9F6]/95 backdrop-blur-sm pb-4 pt-2 -mx-4 px-4 sm:static sm:bg-transparent sm:p-0 sm:mx-0">
          <Tab.List className="flex space-x-2 overflow-x-auto custom-scrollbar no-scrollbar pb-1">
            {tabs.map((tab) => (
              <Tab
                key={tab.name}
                className={({ selected }) =>
                  `flex-shrink-0 px-5 py-2.5 text-sm font-bold rounded-full transition-all whitespace-nowrap outline-none flex items-center gap-2 border
                  ${selected 
                    ? 'bg-[#9F9586] border-[#9F9586] text-white shadow-md transform scale-105' 
                    : 'bg-white border-[#EFECE5] text-gray-500 hover:bg-gray-50 hover:border-gray-300'
                  }`
                }
              >
                <tab.icon className="w-4 h-4" />
                {tab.name}
              </Tab>
            ))}
          </Tab.List>
        </div>

        <Tab.Panels className="mt-2">
          {/* 1. History Panel */}
          <Tab.Panel className="space-y-4 focus:outline-none animate-fade-in">
            {historyBookings.length > 0 ? (
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
          </Tab.Panel>

          {/* 2. Rewards Redemption Panel (Mockup) */}
          <Tab.Panel className="focus:outline-none animate-fade-in">
            <div className="grid grid-cols-2 gap-4">
               {/* Mock Reward Cards */}
               {[
                 { id: 1, title: '免費卸甲券', points: 500, img: 'bg-orange-50 text-orange-600' },
                 { id: 2, title: '$100 折價券', points: 1000, img: 'bg-blue-50 text-blue-600' },
                 { id: 3, title: '手部保養 5折', points: 2000, img: 'bg-green-50 text-green-600' },
                 { id: 4, title: '精選指緣油', points: 3000, img: 'bg-pink-50 text-pink-600' },
               ].map(reward => (
                 <div key={reward.id} className="bg-white p-5 rounded-2xl border border-[#EFECE5] flex flex-col items-center text-center hover:shadow-lg transition-shadow cursor-pointer group">
                    <div className={`w-14 h-14 rounded-full mb-3 ${reward.img} flex items-center justify-center group-hover:scale-110 transition-transform`}>
                      <GiftIcon className="w-7 h-7" />
                    </div>
                    <h4 className="font-bold text-gray-900 text-sm mb-1">{reward.title}</h4>
                    <p className="text-[#9F9586] font-bold text-xs bg-[#FAF9F6] px-2 py-1 rounded-md">{reward.points} pt</p>
                    <button className="mt-4 w-full py-2 bg-[#9F9586] text-white text-xs font-bold rounded-xl opacity-0 group-hover:opacity-100 transition-opacity translate-y-2 group-hover:translate-y-0">
                      立即兌換
                    </button>
                 </div>
               ))}
            </div>
          </Tab.Panel>

          {/* 3. Season Pass Purchase Panel (Mockup) */}
          <Tab.Panel className="space-y-4 focus:outline-none animate-fade-in">
             {[
               { id: 1, name: '輕量季卡', price: 3000, credit: 3500, color: 'from-[#9F9586] to-[#8a8173]' },
               { id: 2, name: '尊榮年卡', price: 10000, credit: 12000, color: 'from-[#5C5548] to-[#2d2a24]' },
             ].map(pass => (
               <div key={pass.id} className="relative overflow-hidden rounded-2xl shadow-lg text-white group cursor-pointer">
                 <div className={`absolute inset-0 bg-gradient-to-br ${pass.color} transition-transform duration-500 group-hover:scale-105`}></div>
                 <div className="relative p-6 flex flex-col h-32 justify-between">
                    <div className="flex justify-between items-start">
                       <div>
                         <h3 className="text-xl font-serif font-bold">{pass.name}</h3>
                         <p className="text-white/80 text-xs mt-1 font-medium bg-white/10 px-2 py-0.5 rounded-md inline-block">儲值 ${pass.price} 可使用 ${pass.credit}</p>
                       </div>
                       <TicketIcon className="w-8 h-8 opacity-30 group-hover:opacity-100 group-hover:rotate-12 transition-all" />
                    </div>
                    <div className="flex justify-between items-end">
                       <div className="text-3xl font-bold tracking-tight">${pass.price}</div>
                       <button className="px-4 py-2 bg-white text-[#5C5548] rounded-lg text-sm font-bold shadow-sm hover:bg-gray-100 transition-colors">
                         購買
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
