

import { GiftIcon, ChevronLeftIcon } from '@heroicons/react/24/outline';
import { useNavigate } from 'react-router-dom';
import { useRedemptionItems } from '../../hooks/useRedemptionItems';
import { useRedemption } from '../../hooks/useRedemption';
import { useAuthStore } from '../../store/authStore';
import LoadingSpinner from '../../components/common/LoadingSpinner';

const MemberRewardsPage = () => {
  const navigate = useNavigate();
  const { userProfile } = useAuthStore();
  const { items, isLoading } = useRedemptionItems();
  const { redeemReward, isRedeeming } = useRedemption();

  const themeColors = {
      orange: 'bg-orange-50 text-orange-600',
      blue: 'bg-blue-50 text-blue-600',
      green: 'bg-green-50 text-green-600',
      pink: 'bg-pink-50 text-pink-600',
      gray: 'bg-gray-50 text-gray-600'
  };

  const activeRewards = items.filter(item => item.isActive);
  const userPoints = userProfile?.loyaltyPoints || 0;

  const handleRedeem = async (item: typeof items[0]) => {
      if (userPoints < item.points) {
          alert("點數不足無法兌換");
          return;
      }
      
      if (!window.confirm(`確定要花費 ${item.points} 點兌換「${item.title}」嗎？`)) {
          return;
      }

      const success = await redeemReward(item);
      if (success) {
          alert("兌換成功！優惠券已發送至您的帳戶。");
      } else {
          // Error is handled in hook/alert, but we can safeguard here
          // alert("兌換失敗，請稍後再試。"); 
          // (Hook sets error state, but detailed alert is better here for simple UI)
      }
  };

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
        <div className="ml-auto flex items-center gap-1 bg-[#9F9586]/10 px-3 py-1 rounded-full">
            <span className="text-xs text-gray-500">目前點數</span>
            <span className="text-sm font-bold text-[#9F9586]">{userPoints}</span>
        </div>
      </div>

      <div className="px-4 py-6">
        {isLoading ? (
             <div className="flex justify-center py-10">
                 <LoadingSpinner />
             </div>
        ) : activeRewards.length === 0 ? (
             <div className="text-center text-gray-500 py-10 bg-white rounded-2xl border border-gray-100">
                 <p>目前沒有可供兌換的獎勵。</p>
             </div>
        ) : (
            <div className="grid grid-cols-2 gap-4">
            {activeRewards.map(reward => {
                const canRedeem = userPoints >= reward.points;
                return (
                    <div key={reward.id} className={`bg-white p-5 rounded-2xl border flex flex-col items-center text-center transition-shadow group ${canRedeem ? 'border-[#EFECE5] hover:shadow-lg cursor-pointer' : 'border-gray-100 opacity-70 grayscale'}`}>
                        <div className={`w-14 h-14 rounded-full mb-3 ${themeColors[reward.colorTheme]} flex items-center justify-center group-hover:scale-110 transition-transform`}>
                        <GiftIcon className="w-7 h-7" />
                        </div>
                        <h4 className="font-bold text-gray-900 text-sm mb-1">{reward.title}</h4>
                        <p className="text-[#9F9586] font-bold text-xs bg-[#FAF9F6] px-2 py-1 rounded-md">{reward.points} pt</p>
                        <button 
                            disabled={!canRedeem || isRedeeming}
                            onClick={() => canRedeem && handleRedeem(reward)}
                            className={`mt-4 w-full py-2 text-xs font-bold rounded-xl transition-all ${
                                canRedeem 
                                ? 'bg-[#9F9586] text-white opacity-100 md:opacity-0 md:group-hover:opacity-100 translate-y-0 md:translate-y-2 md:group-hover:translate-y-0' 
                                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                            }`}
                        >
                        {canRedeem ? '立即兌換' : '點數不足'}
                        </button>
                    </div>
                );
            })}
            </div>
        )}
      </div>
    </div>
  );
};

export default MemberRewardsPage;
