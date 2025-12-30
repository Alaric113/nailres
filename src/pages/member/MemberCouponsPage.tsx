import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeftIcon, TicketIcon, GiftIcon } from '@heroicons/react/24/outline';
import { useUserCoupons } from '../../hooks/useUserCoupons';
import { useCouponClaim } from '../../hooks/useCouponClaim';
import { useRedemptionItems } from '../../hooks/useRedemptionItems';
import { useRedemption } from '../../hooks/useRedemption';
import { useAuthStore } from '../../store/authStore';
import LoadingSpinner from '../../components/common/LoadingSpinner';

const MemberCouponsPage = () => {
  const navigate = useNavigate();
  const { userProfile } = useAuthStore();
  
  // Main Tab State
  const [mainTab, setMainTab] = useState<'coupons' | 'rewards'>('coupons');

  // --- Coupons Logic ---
  const { userCoupons, isLoading: isLoadingCoupons } = useUserCoupons();
  const { claimCoupon, isClaiming } = useCouponClaim();
  const [claimCode, setClaimCode] = useState('');
  const [couponTab, setCouponTab] = useState<'active' | 'history'>('active');

  const handleClaim = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!claimCode.trim()) return;
      
      const success = await claimCoupon(claimCode);
      if (success) {
          alert("領取成功！");
          setClaimCode('');
      } else {
          alert("領取失敗，請確認代碼是否正確或已過期。");
      }
  };

  const filteredCoupons = userCoupons.filter(coupon => {
      if (couponTab === 'active') {
          return coupon.status === 'active' && coupon.validUntil.seconds * 1000 > Date.now();
      } else {
          return coupon.status !== 'active' || coupon.validUntil.seconds * 1000 <= Date.now();
      }
  });

  const formatDate = (timestamp: any) => {
      if (!timestamp) return '';
      return new Date(timestamp.seconds * 1000).toLocaleDateString('zh-TW');
  };

  // --- Rewards Logic ---
  const { items: rewardItems, isLoading: isLoadingRewards } = useRedemptionItems();
  const { redeemReward, isRedeeming } = useRedemption();
  const activeRewards = rewardItems.filter(item => item.isActive);
  const userPoints = userProfile?.loyaltyPoints || 0;

  const themeColors: Record<string, string> = {
      orange: 'bg-orange-50 text-orange-600',
      blue: 'bg-blue-50 text-blue-600',
      green: 'bg-green-50 text-green-600',
      pink: 'bg-pink-50 text-pink-600',
      gray: 'bg-gray-50 text-gray-600'
  };

  const handleRedeem = async (item: typeof rewardItems[0]) => {
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
      }
  };

  return (
    <div className="min-h-[calc(100vh-64px)] bg-[#FAF9F6] pb-24">
      {/* Header */}
      <div className="bg-white px-4 py-3 shadow-sm sticky top-0 z-10 flex items-center gap-2">
        <button 
          onClick={() => navigate('/member')}
          className="p-2 rounded-full hover:bg-gray-100 transition-colors"
        >
          <ChevronLeftIcon className="w-5 h-5 text-gray-600" />
        </button>
        <h1 className="text-lg font-bold text-gray-900">優惠與兌換</h1>
        
        {/* Points Badge (Visible on both tabs) */}
        <div className="ml-auto flex items-center gap-1 bg-[#9F9586]/10 px-3 py-1 rounded-full">
            <span className="text-xs text-gray-500">點數</span>
            <span className="text-sm font-bold text-[#9F9586]">{userPoints}</span>
        </div>
      </div>

      {/* Main Tabs */}
      <div className="flex p-4 gap-4">
          <button 
            onClick={() => setMainTab('coupons')}
            className={`flex-1 py-3 px-4 rounded-xl border-2 flex items-center justify-center gap-2 transition-all ${
                mainTab === 'coupons' 
                ? 'border-[#9F9586] bg-[#9F9586] text-white shadow-md' 
                : 'border-white bg-white text-gray-400 hover:bg-gray-50'
            }`}
          >
              <TicketIcon className="w-5 h-5" />
              <span className="font-bold text-sm">我的優惠券</span>
          </button>

          <button 
            onClick={() => setMainTab('rewards')}
            className={`flex-1 py-3 px-4 rounded-xl border-2 flex items-center justify-center gap-2 transition-all ${
                mainTab === 'rewards' 
                ? 'border-[#9F9586] bg-[#9F9586] text-white shadow-md' 
                : 'border-white bg-white text-gray-400 hover:bg-gray-50'
            }`}
          >
              <GiftIcon className="w-5 h-5" />
              <span className="font-bold text-sm">點數兌換</span>
          </button>
      </div>

      <div className="px-4 space-y-6">
          
          {/* ==================== Coupons Content ==================== */}
          {mainTab === 'coupons' && (
              <div className="space-y-6 animate-fadeIn">
                  {/* Claim Box */}
                  <div className="bg-white p-4 rounded-2xl shadow-sm border border-[#EFECE5]">
                      <h3 className="font-bold text-gray-900 text-sm mb-3 flex items-center gap-2">
                          <TicketIcon className="w-4 h-4 text-[#9F9586]" />
                          輸入優惠碼
                      </h3>
                      <form onSubmit={handleClaim} className="flex gap-2">
                          <input 
                            type="text" 
                            value={claimCode}
                            onChange={e => setClaimCode(e.target.value)}
                            placeholder="請輸入代碼"
                            className="flex-1 rounded-lg border-gray-300 text-sm focus:ring-[#9F9586] focus:border-[#9F9586]"
                          />
                          <button 
                            disabled={isClaiming || !claimCode.trim()}
                            className="px-4 py-2 bg-[#9F9586] text-white text-sm font-bold text-nowrap rounded-lg disabled:opacity-50"
                          >
                              {isClaiming ? '...' : '領取'}
                          </button>
                      </form>
                  </div>

                  {/* Coupon Type Tabs */}
                  <div className="flex border-b border-gray-200">
                      <button 
                        onClick={() => setCouponTab('active')}
                        className={`flex-1 py-2 text-sm font-bold border-b-2 transition-colors ${couponTab === 'active' ? 'border-[#9F9586] text-[#9F9586]' : 'border-transparent text-gray-400'}`}
                      >
                          可使用
                      </button>
                      <button 
                        onClick={() => setCouponTab('history')}
                        className={`flex-1 py-2 text-sm font-bold border-b-2 transition-colors ${couponTab === 'history' ? 'border-[#9F9586] text-[#9F9586]' : 'border-transparent text-gray-400'}`}
                      >
                          已失效 / 歷史
                      </button>
                  </div>

                  {/* Coupon List */}
                  {isLoadingCoupons ? (
                      <LoadingSpinner />
                  ) : filteredCoupons.length === 0 ? (
                      <div className="text-center py-12 text-gray-400">
                          {couponTab === 'active' ? '目前沒有可使用的優惠券' : '沒有歷史紀錄'}
                      </div>
                  ) : (
                      <div className="space-y-3">
                          {filteredCoupons.map(coupon => (
                              <div key={coupon.id} className={`bg-white rounded-xl p-4 border relative overflow-hidden flex gap-4 ${coupon.status === 'active' ? 'border-[#EFECE5]' : 'border-gray-100 grayscale opacity-60'}`}>
                                  {/* Left Visual */}
                                  <div className="w-20 bg-[#FAF9F6] rounded-lg flex flex-col items-center justify-center text-[#9F9586] p-2 text-center shrink-0">
                                      <span className="text-xl font-bold">
                                          {coupon.type === 'percentage' ? `${coupon.value}%` : `$${coupon.value}`}
                                      </span>
                                      <span className="text-[10px] font-bold">OFF</span>
                                  </div>
                                  
                                  {/* Right Content */}
                                  <div className="flex-1 min-w-0 flex flex-col justify-center">
                                      <h4 className="font-bold text-gray-900 truncate">{coupon.title}</h4>
                                      <p className="text-xs text-gray-500 mt-1">
                                          {coupon.minSpend > 0 ? `滿 $${coupon.minSpend} 可用` : '無低消限制'}
                                      </p>
                                      <p className="text-[10px] text-gray-400 mt-2">
                                          有效期限: {formatDate(coupon.validUntil)}
                                      </p>
                                  </div>

                                  {/* Stamps */}
                                  {coupon.status === 'used' && (
                                      <div className="absolute right-2 bottom-2 border-2 border-gray-300 text-gray-300 rounded px-2 text-xs font-bold -rotate-12">
                                          已使用
                                      </div>
                                  )}
                                  {coupon.status === 'expired' && (
                                      <div className="absolute right-2 bottom-2 border-2 border-gray-300 text-gray-300 rounded px-2 text-xs font-bold -rotate-12">
                                          已過期
                                      </div>
                                  )}
                              </div>
                          ))}
                      </div>
                  )}
              </div>
          )}

          {/* ==================== Rewards Content ==================== */}
          {mainTab === 'rewards' && (
              <div className="animate-fadeIn">
                  {isLoadingRewards ? (
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
                                      <div className={`w-14 h-14 rounded-full mb-3 ${themeColors[reward.colorTheme] || themeColors.gray} flex items-center justify-center group-hover:scale-110 transition-transform`}>
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
          )}
      </div>
    </div>
  );
};

export default MemberCouponsPage;
