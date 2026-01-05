import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeftIcon, TicketIcon, GiftIcon, CreditCardIcon } from '@heroicons/react/24/outline';
import { useUserCoupons } from '../../hooks/useUserCoupons';
import { useCouponClaim } from '../../hooks/useCouponClaim';
import { useRedemptionItems } from '../../hooks/useRedemptionItems';
import { useRedemption } from '../../hooks/useRedemption';
import { useUserGiftCards } from '../../hooks/useUserGiftCards';
import { useAuthStore } from '../../store/authStore';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import Modal from '../../components/common/Modal';
import { CheckCircleIcon } from '@heroicons/react/24/solid';

const MemberCouponsPage = () => {
    const navigate = useNavigate();
    const { userProfile } = useAuthStore();

    // Main Tab State
    const [mainTab, setMainTab] = useState<'coupons' | 'giftcards' | 'rewards'>('coupons');

    // --- Coupons Logic ---
    const { userCoupons, isLoading: isLoadingCoupons } = useUserCoupons();
    const { claimCoupon, isClaiming } = useCouponClaim();
    const [claimCode, setClaimCode] = useState('');
    const [couponTab, setCouponTab] = useState<'active' | 'history'>('active');

    // --- Gift Cards Logic ---
    const { userGiftCards, isLoading: isLoadingGiftCards, redeemGiftCard } = useUserGiftCards();
    const [giftCardTab, setGiftCardTab] = useState<'active' | 'used'>('active');

    // --- Redemption Modal Logic ---
    const [redeemModalOpen, setRedeemModalOpen] = useState(false);
    const [successModalOpen, setSuccessModalOpen] = useState(false);
    const [selectedRedeemItem, setSelectedRedeemItem] = useState<any>(null);

    const handleRedeemClick = (item: any) => {
        setSelectedRedeemItem(item);
        setRedeemModalOpen(true);
    };

    const confirmRedemption = async () => {
        if (selectedRedeemItem) {
            try {
                await redeemGiftCard(selectedRedeemItem.id);
                setRedeemModalOpen(false);
                setSuccessModalOpen(true);
            } catch (error) {
                alert("兌換失敗，請稍後再試");
            }
        }
    };

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

    const filteredGiftCards = userGiftCards.filter(gc => {
        if (giftCardTab === 'active') {
            return gc.status === 'active';
        } else {
            return gc.status === 'redeemed';
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
            <div className="flex p-4 gap-2">
                <button
                    onClick={() => setMainTab('coupons')}
                    className={`flex-1 py-2.5 px-3 rounded-xl border-2 flex items-center justify-center gap-1.5 transition-all ${mainTab === 'coupons'
                            ? 'border-[#9F9586] bg-[#9F9586] text-white shadow-md'
                            : 'border-white bg-white text-gray-400 hover:bg-gray-50'
                        }`}
                >
                    <TicketIcon className="w-4 h-4" />
                    <span className="font-bold text-xs">優惠券</span>
                </button>

                <button
                    onClick={() => setMainTab('giftcards')}
                    className={`flex-1 py-2.5 px-3 rounded-xl border-2 flex items-center justify-center gap-1.5 transition-all ${mainTab === 'giftcards'
                            ? 'border-[#9F9586] bg-[#9F9586] text-white shadow-md'
                            : 'border-white bg-white text-gray-400 hover:bg-gray-50'
                        }`}
                >
                    <CreditCardIcon className="w-4 h-4" />
                    <span className="font-bold text-xs">商品卡</span>
                </button>

                <button
                    onClick={() => setMainTab('rewards')}
                    className={`flex-1 py-2.5 px-3 rounded-xl border-2 flex items-center justify-center gap-1.5 transition-all ${mainTab === 'rewards'
                            ? 'border-[#9F9586] bg-[#9F9586] text-white shadow-md'
                            : 'border-white bg-white text-gray-400 hover:bg-gray-50'
                        }`}
                >
                    <GiftIcon className="w-4 h-4" />
                    <span className="font-bold text-xs">點數兌換</span>
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

                {/* ==================== Gift Cards Content ==================== */}
                {mainTab === 'giftcards' && (
                    <div className="space-y-6 animate-fadeIn">
                        {/* Gift Card Tabs */}
                        <div className="flex border-b border-gray-200">
                            <button
                                onClick={() => setGiftCardTab('active')}
                                className={`flex-1 py-2 text-sm font-bold border-b-2 transition-colors ${giftCardTab === 'active' ? 'border-[#9F9586] text-[#9F9586]' : 'border-transparent text-gray-400'}`}
                            >
                                可使用
                            </button>
                            <button
                                onClick={() => setGiftCardTab('used')}
                                className={`flex-1 py-2 text-sm font-bold border-b-2 transition-colors ${giftCardTab === 'used' ? 'border-[#9F9586] text-[#9F9586]' : 'border-transparent text-gray-400'}`}
                            >
                                已兌換
                            </button>
                        </div>

                        {/* Gift Card List */}
                        {isLoadingGiftCards ? (
                            <LoadingSpinner />
                        ) : filteredGiftCards.length === 0 ? (
                            <div className="text-center py-12 bg-white rounded-2xl border border-gray-100">
                                <CreditCardIcon className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                                <p className="text-gray-400 mb-4">
                                    {giftCardTab === 'active' ? '目前沒有商品卡' : '沒有已兌換的商品卡'}
                                </p>
                                {giftCardTab === 'active' && (
                                    <button
                                        onClick={() => setMainTab('rewards')}
                                        className="px-5 py-2 bg-[#9F9586] text-white text-sm font-bold rounded-xl hover:bg-[#8A8173] transition-colors"
                                    >
                                        使用點數兌換 →
                                    </button>
                                )}
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {filteredGiftCards.map(gc => (
                                    <div key={gc.id} className={`bg-white rounded-xl overflow-hidden border ${gc.status === 'active' ? 'border-[#EFECE5]' : 'border-gray-100 opacity-60'}`}>
                                        <div className="flex flex-row">
                                            {/* Image */}
                                            {gc.imageUrl ? (
                                                <div className="w-24 h-24 shrink-0">
                                                    <img src={gc.imageUrl} alt={gc.name} className="w-full h-full object-cover" />
                                                </div>
                                            ) : (
                                                <div className="w-24 h-24 shrink-0 bg-gradient-to-br from-purple-100 to-purple-50 flex items-center justify-center">
                                                    <CreditCardIcon className="w-10 h-10 text-purple-300" />
                                                </div>
                                            )}

                                            {/* Content */}
                                            <div className="flex-1 p-4 flex flex-col justify-center relative">
                                                <h4 className="font-bold text-gray-900 line-clamp-1">{gc.name}</h4>
                                                <p className="text-xs text-gray-500 mt-1 line-clamp-2">{gc.description}</p>
                                                <p className="text-[10px] text-gray-400 mt-2 flex flex-col">
                                                    領取日期: {formatDate(gc.createdAt)}
                                                    {gc.redeemedAt && (
                                                        <span >使用日期: {formatDate(gc.redeemedAt)}</span>
                                                    )}
                                                </p>

                                                
                                            </div>
                                            <div className="flex-1 flex items-center justify-end">
                                            {gc.status === 'active' && (
                                                    <div className="m-3 flex justify-end">
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleRedeemClick(gc);
                                                            }}
                                                            className="px-3 py-1.5 bg-[#9F9586] text-white text-xs font-bold rounded-lg hover:bg-[#8A8173] transition-colors shadow-sm"
                                                        >
                                                            我要兌換
                                                        </button>
                                                    </div>
                                                )}

                                                {gc.status === 'redeemed' && (
                                                    <div className="mr-3 flex items-center justify-center border-2 border-gray-700 text-gray-700 rounded p-2 text-xs font-bold -rotate-12">
                                                        已兌換
                                                    </div>
                                                )}
                                            </div>
                                        </div>
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
                                                {reward.redemptionType === 'giftcard' ? <CreditCardIcon className="w-7 h-7" /> : <GiftIcon className="w-7 h-7" />}
                                            </div>
                                            <h4 className="font-bold text-gray-900 text-sm mb-1">{reward.title}</h4>
                                            <p className="text-[#9F9586] font-bold text-xs bg-[#FAF9F6] px-2 py-1 rounded-md">{reward.points} pt</p>
                                            <button
                                                disabled={!canRedeem || isRedeeming}
                                                onClick={() => canRedeem && handleRedeem(reward)}
                                                className={`mt-4 w-full py-2 text-xs font-bold rounded-xl transition-all ${canRedeem
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

            {/* Redemption Confirmation Modal */}
            <Modal
                isOpen={redeemModalOpen}
                onClose={() => setRedeemModalOpen(false)}
                title="確認兌換"
            >
                <div className="space-y-4">
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex gap-3">
                        <div className="shrink-0 text-amber-500">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
                                <path fillRule="evenodd" d="M9.401 3.003c1.155-2 4.043-2 5.197 0l7.355 12.748c1.154 2-.29 4.5-2.599 4.5H4.645c-2.309 0-3.752-2.5-2.598-4.5L9.4 3.003zM12 8.25a.75.75 0 01.75.75v3.75a.75.75 0 01-1.5 0V9a.75.75 0 01.75-.75zm0 8.25a.75.75 0 100-1.5.75.75 0 000 1.5z" clipRule="evenodd" />
                            </svg>
                        </div>
                        <div>
                            <h4 className="font-bold text-amber-800 text-sm">請注意</h4>
                            <p className="text-amber-700 text-xs mt-1">
                                請確認<strong>工作人員在一旁</strong>再進行兌換操作。一旦兌換將無法復原。
                            </p>
                        </div>
                    </div>

                    {selectedRedeemItem && (
                        <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                            {selectedRedeemItem.imageUrl ? (
                                <img src={selectedRedeemItem.imageUrl} alt="" className="w-12 h-12 rounded object-cover" />
                            ) : (
                                <div className="w-12 h-12 bg-gray-200 rounded flex items-center justify-center">
                                    <GiftIcon className="w-6 h-6 text-gray-400" />
                                </div>
                            )}
                            <div>
                                <p className="font-bold text-gray-900 text-sm">{selectedRedeemItem.name}</p>
                                <p className="text-xs text-gray-500 line-clamp-1">{selectedRedeemItem.description}</p>
                            </div>
                        </div>
                    )}

                    <div className="flex gap-3 pt-2">
                        <button
                            onClick={() => setRedeemModalOpen(false)}
                            className="flex-1 py-2.5 border border-gray-300 text-gray-700 font-bold rounded-xl text-sm hover:bg-gray-50"
                        >
                            取消
                        </button>
                        <button
                            onClick={confirmRedemption}
                            className="flex-1 py-2.5 bg-[#9F9586] text-white font-bold rounded-xl text-sm hover:bg-[#8A8173] shadow-sm"
                        >
                            確認兌換
                        </button>
                    </div>
                </div>
            </Modal>

            {/* Success Modal */}
            <Modal
                isOpen={successModalOpen}
                onClose={() => setSuccessModalOpen(false)}
                title=""
            >
                <div className="flex flex-col items-center justify-center p-4 text-center space-y-4">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-2">
                        <CheckCircleIcon className="w-10 h-10 text-green-500" />
                    </div>
                    
                    <h3 className="text-xl font-bold text-gray-900">已成功兌換</h3>
                    
                    {selectedRedeemItem && (
                        <div className="w-full bg-gray-50 rounded-xl p-4 mt-4 border border-gray-100">
                             {selectedRedeemItem.imageUrl ? (
                                <div className="w-full h-32 rounded-lg bg-white overflow-hidden mb-3 border border-gray-100">
                                    <img src={selectedRedeemItem.imageUrl} alt="" className="w-full h-full object-cover" />
                                </div>
                            ) : (
                                <div className="w-full h-20 rounded-lg bg-gray-200 flex items-center justify-center mb-3">
                                    <GiftIcon className="w-8 h-8 text-gray-400" />
                                </div>
                            )}
                            <h4 className="font-bold text-gray-900 text-lg">{selectedRedeemItem.name}</h4>
                            <p className="text-gray-500 text-sm mt-1">{selectedRedeemItem.description}</p>
                        </div>
                    )}

                    <button
                        onClick={() => setSuccessModalOpen(false)}
                        className="w-full py-3 bg-[#9F9586] text-white font-bold rounded-xl shadow-lg shadow-orange-900/10 hover:bg-[#8A8173] transition-all mt-6"
                    >
                        關閉
                    </button>
                </div>
            </Modal>
        </div>
    );
};

export default MemberCouponsPage;

