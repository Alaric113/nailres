import React from 'react';
import { ClockIcon } from '@heroicons/react/24/outline';
import type { ActiveFollowUp } from '../../types/user';
import { getFollowUpPriceRange } from '../../hooks/useUserFollowUps';

interface FollowUpServiceCardProps {
    followUp: ActiveFollowUp;
    onClick: () => void;
    selectedDate?: Date | null; // If date selected, show exact price
}

const FollowUpServiceCard: React.FC<FollowUpServiceCardProps> = ({
    followUp,
    onClick,
    selectedDate: _selectedDate // Will be used in Phase 4 for exact price calculation
}) => {
    const { minPrice, maxPrice } = getFollowUpPriceRange(followUp);

    // Calculate days remaining
    const now = new Date();
    const expiryDate = followUp.expiresAt.toDate();
    const daysRemaining = Math.ceil((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    // Sort tiers for display
    const sortedTiers = [...followUp.pricingTiers].sort((a, b) => a.withinDays - b.withinDays);

    return (
        <button
            onClick={onClick}
            className="w-full bg-gradient-to-r from-amber-50 to-orange-50 border-2 border-amber-200 rounded-2xl p-4 text-left hover:border-amber-400 hover:shadow-lg transition-all group"
        >


            {/* Service Info */}
            <div className="mb-3 flex items-center justify-between">
                <div>
                    <h3 className="text-lg font-bold text-gray-800 group-hover:text-amber-700 transition-colors">
                        {followUp.followUpName}
                    </h3>
                    <p className="text-sm text-gray-500">
                        原服務：{followUp.serviceName}
                    </p>
                </div>

                <div className="flex items-center gap-1 text-xs text-amber-600">
                    <ClockIcon className="w-3 h-3" />
                    <span>剩餘 {daysRemaining} 天</span>
                </div>
            </div>

            {/* Pricing Tiers */}
            <div className="space-y-1 mb-3">
                {sortedTiers.map((tier, index) => (
                    <div key={index} className="flex justify-between text-xs">
                        <span className="text-gray-500">
                            {tier.label || `${tier.withinDays}天內`}
                        </span>
                        <span className="font-bold text-amber-600">
                            NT${Math.round(followUp.originalPrice * tier.discountRate)}
                            <span className="text-gray-400 font-normal ml-1">
                                ({Math.round(tier.discountRate * 100)}%)
                            </span>
                        </span>
                    </div>
                ))}
            </div>

            {/* Price Display */}
            <div className="flex items-center justify-end pt-3 border-t border-amber-200">
                <div className='hidden'>
                    <span className="text-xs text-gray-400 line-through mr-2">
                        原價 NT${followUp.originalPrice}
                    </span>
                </div>
                <div className="text-right flex flex-row items-center justify-between gap-3">
                    <p className="text-xs text-gray-400">依預約日期計算</p>
                    {minPrice === maxPrice ? (
                        <span className="text-lg font-bold text-amber-600">
                            NT${minPrice}
                        </span>
                    ) : (
                        <span className="text-lg font-bold text-amber-600">
                            NT${minPrice} ~ ${maxPrice}
                        </span>
                    )}

                </div>
            </div>
        </button>
    );
};

export default FollowUpServiceCard;
