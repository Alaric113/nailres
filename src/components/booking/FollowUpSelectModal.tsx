import React, { useState } from 'react';
import { XMarkIcon, CalendarIcon, CheckCircleIcon } from '@heroicons/react/24/outline';
import type { ActiveFollowUp } from '../../types/user';
import { getFollowUpPrice, getFollowUpPriceRange } from '../../hooks/useUserFollowUps';
import { useBookingStore } from '../../store/bookingStore';
import { useServices } from '../../hooks/useServices';

interface FollowUpSelectModalProps {
    followUp: ActiveFollowUp;
    onClose: () => void;
    onAdded: () => void;
}

const FollowUpSelectModal: React.FC<FollowUpSelectModalProps> = ({
    followUp,
    onClose,
    onAdded
}) => {
    const { services } = useServices();
    const { addFollowUpToCart } = useBookingStore();
    const [isAdding, setIsAdding] = useState(false);

    const { maxRate } = getFollowUpPriceRange(followUp);

    // Find original service to get duration
    const originalService = services.find(s => s.id === followUp.serviceId);

    // Calculate days remaining
    const now = new Date();
    const expiryDate = followUp.expiresAt.toDate();
    const daysRemaining = Math.ceil((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    const completedDate = followUp.completedAt.toDate();

    // Sort tiers for display
    const sortedTiers = [...followUp.pricingTiers].sort((a, b) => a.withinDays - b.withinDays);

    // Find current applicable tier based on today's date
    const { price: currentPrice } = getFollowUpPrice(followUp, new Date());

    const handleAddToCart = async () => {
        if (!originalService) return;

        setIsAdding(true);

        // Use the minimum rate (best price for earliest booking)
        // The actual price will be recalculated when user selects a date
        addFollowUpToCart(followUp, maxRate, originalService);

        setTimeout(() => {
            setIsAdding(false);
            onAdded();
        }, 300);
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-10000 p-4" onClick={onClose}>
            <div
                className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl"
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="bg-gradient-to-r from-amber-100 to-orange-100 px-6 py-4 flex items-center justify-between">
                    <div>
                        <span className="text-xs font-medium text-amber-600 bg-amber-200 px-2 py-0.5 rounded-full">
                            售後優惠
                        </span>
                        <h2 className="text-xl font-bold text-gray-800 mt-1">
                            {followUp.followUpName}
                        </h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-gray-500 hover:text-gray-700 p-1"
                    >
                        <XMarkIcon className="w-6 h-6" />
                    </button>
                </div>

                {/* Content */}
                <div className="px-6 py-4 space-y-4">
                    {/* Original Service Info */}
                    <div className="bg-gray-50 rounded-lg p-3">
                        <p className="text-sm text-gray-500">原服務</p>
                        <p className="font-medium text-gray-800">{followUp.serviceName}</p>
                        <p className="text-xs text-gray-400 mt-1">
                            完成日期：{completedDate.toLocaleDateString('zh-TW')}
                        </p>
                    </div>

                    {/* Pricing Tiers */}
                    <div>
                        <h3 className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-1">
                            <CalendarIcon className="w-4 h-4" />
                            價格梯度（依預約日期）
                        </h3>
                        <div className="bg-amber-50 rounded-lg p-3 space-y-2">
                            {sortedTiers.map((tier, index) => {
                                const tierPrice = Math.round(followUp.originalPrice * tier.discountRate);
                                const tierEndDate = new Date(completedDate);
                                tierEndDate.setDate(tierEndDate.getDate() + tier.withinDays);

                                return (
                                    <div
                                        key={index}
                                        className={`flex justify-between items-center text-sm p-2 rounded `}
                                    >
                                        <div>
                                            <span className="text-gray-700">
                                                {tier.label || `${tier.withinDays}天內`}
                                            </span>
                                            <span className="text-xs text-gray-400 ml-2">
                                                ~{tierEndDate.toLocaleDateString('zh-TW', { month: 'numeric', day: 'numeric' })}
                                            </span>
                                        </div>
                                        <span className="text-amber-700 font-bold">
                                            NT${tierPrice}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                        <p className="text-xs text-gray-400 mt-2">
                            * 最終價格將根據您選擇的預約日期計算
                        </p>
                    </div>

                    {/* Expiry Warning */}
                    <div className="flex items-center gap-2 text-sm text-amber-600 bg-amber-50 p-3 rounded-lg">
                        <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span>此優惠將於 <strong>{daysRemaining} 天後</strong> 到期</span>
                    </div>

                    {/* Price Summary */}
                    <div className="border-t pt-4 hidden">
                        <div className="flex justify-between items-center">
                            <div>

                                <p className="text-sm text-gray-600">
                                    今日預約可享
                                </p>
                            </div>
                            <div className='flex flex-row gap-2 items-center'>
                                <p className="text- text-gray-400 line-through font-bold">
                                    ${followUp.originalPrice}
                                </p>
                                <p className="text-2xl font-bold text-amber-600">
                                    ${currentPrice}
                                </p>
                            </div>

                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="px-6 py-4 bg-gray-50 flex gap-3">
                    <button
                        onClick={onClose}
                        className="flex-1 py-3 px-4 rounded-xl border border-gray-200 text-gray-600 font-medium hover:bg-gray-100 transition-colors"
                    >
                        取消
                    </button>
                    <button
                        onClick={handleAddToCart}
                        disabled={isAdding || !originalService}
                        className="flex-1 py-3 px-4 rounded-xl bg-amber-500 text-white font-bold hover:bg-amber-600 transition-colors flex items-center justify-center gap-2 disabled:bg-gray-300"
                    >
                        {isAdding ? (
                            <>
                                <CheckCircleIcon className="w-5 h-5 animate-pulse" />
                                已加入
                            </>
                        ) : (
                            '加入預約'
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default FollowUpSelectModal;
