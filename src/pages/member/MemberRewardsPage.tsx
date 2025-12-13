

import { GiftIcon, ChevronLeftIcon } from '@heroicons/react/24/outline';
import { useNavigate } from 'react-router-dom';

const MemberRewardsPage = () => {
  const navigate = useNavigate();

  const rewards = [
    { id: 1, title: '免費卸甲券', points: 500, img: 'bg-orange-50 text-orange-600' },
    { id: 2, title: '$100 折價券', points: 1000, img: 'bg-blue-50 text-blue-600' },
    { id: 3, title: '手部保養 5折', points: 2000, img: 'bg-green-50 text-green-600' },
    { id: 4, title: '精選指緣油', points: 3000, img: 'bg-pink-50 text-pink-600' },
  ];

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
        <h1 className="text-lg font-bold text-gray-900">點數兌換專區</h1>
      </div>

      <div className="px-4 py-6">
        <div className="grid grid-cols-2 gap-4">
           {rewards.map(reward => (
             <div key={reward.id} className="bg-white p-5 rounded-2xl border border-[#EFECE5] flex flex-col items-center text-center hover:shadow-lg transition-shadow cursor-pointer group">
                <div className={`w-14 h-14 rounded-full mb-3 ${reward.img} flex items-center justify-center group-hover:scale-110 transition-transform`}>
                  <GiftIcon className="w-7 h-7" />
                </div>
                <h4 className="font-bold text-gray-900 text-sm mb-1">{reward.title}</h4>
                <p className="text-[#9F9586] font-bold text-xs bg-[#FAF9F6] px-2 py-1 rounded-md">{reward.points} pt</p>
                <button className="mt-4 w-full py-2 bg-[#9F9586] text-white text-xs font-bold rounded-xl opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity translate-y-0 md:translate-y-2 md:group-hover:translate-y-0">
                  立即兌換
                </button>
             </div>
           ))}
        </div>
      </div>
    </div>
  );
};

export default MemberRewardsPage;
