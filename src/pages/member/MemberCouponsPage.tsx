import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeftIcon, TicketIcon } from '@heroicons/react/24/outline';
import { useUserCoupons } from '../../hooks/useUserCoupons';
import { useCouponClaim } from '../../hooks/useCouponClaim';
import LoadingSpinner from '../../components/common/LoadingSpinner';

const MemberCouponsPage = () => {
  const navigate = useNavigate();
  const { userCoupons, isLoading } = useUserCoupons();
  const { claimCoupon, isClaiming } = useCouponClaim();
  const [claimCode, setClaimCode] = useState('');
  const [activeTab, setActiveTab] = useState<'active' | 'history'>('active');

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
      if (activeTab === 'active') {
          return coupon.status === 'active' && coupon.validUntil.seconds * 1000 > Date.now();
      } else {
          return coupon.status !== 'active' || coupon.validUntil.seconds * 1000 <= Date.now();
      }
  });

  const formatDate = (timestamp: any) => {
      if (!timestamp) return '';
      return new Date(timestamp.seconds * 1000).toLocaleDateString('zh-TW');
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
        <h1 className="text-lg font-bold text-gray-900">我的優惠券</h1>
      </div>

      <div className="px-4 py-4 space-y-6">
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

          {/* Tabs */}
          <div className="flex border-b border-gray-200">
              <button 
                onClick={() => setActiveTab('active')}
                className={`flex-1 py-2 text-sm font-bold border-b-2 transition-colors ${activeTab === 'active' ? 'border-[#9F9586] text-[#9F9586]' : 'border-transparent text-gray-400'}`}
              >
                  可使用
              </button>
              <button 
                onClick={() => setActiveTab('history')}
                className={`flex-1 py-2 text-sm font-bold border-b-2 transition-colors ${activeTab === 'history' ? 'border-[#9F9586] text-[#9F9586]' : 'border-transparent text-gray-400'}`}
              >
                  已失效 / 歷史
              </button>
          </div>

          {/* List */}
          {isLoading ? (
              <LoadingSpinner />
          ) : filteredCoupons.length === 0 ? (
              <div className="text-center py-12 text-gray-400">
                  沒有相關優惠券
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

                          {/* Stamp if Used */}
                          {coupon.status === 'used' && (
                              <div className="absolute right-2 bottom-2 border-2 border-gray-300 text-gray-300 rounded px-2 text-xs font-bold -rotate-12">
                                  已使用
                              </div>
                          )}
                          {/* Stamp if Expired */}
                          {coupon.status === 'expired' && ( // Or calculated expiry
                              <div className="absolute right-2 bottom-2 border-2 border-gray-300 text-gray-300 rounded px-2 text-xs font-bold -rotate-12">
                                  已過期
                              </div>
                          )}
                      </div>
                  ))}
              </div>
          )}
      </div>
    </div>
  );
};

export default MemberCouponsPage;
