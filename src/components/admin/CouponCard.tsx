import React from 'react';
import type { Coupon } from '../../types/coupon';
import { format } from 'date-fns';
import { PencilIcon, TagIcon, ClockIcon, CurrencyDollarIcon, UserIcon } from '@heroicons/react/24/outline';

interface CouponCardProps {
  coupon: Coupon;
  onEdit: (coupon: Coupon) => void;
}

const CouponCard: React.FC<CouponCardProps> = ({ coupon, onEdit }) => {
  const isActive = coupon.isActive;
  const isFixedDiscount = coupon.type === 'fixed';
  const discountValue = isFixedDiscount ? `NT$ ${coupon.value}` : `${coupon.value}%`;
  const validUntilDate = coupon.validUntil.toDate();
  const isExpired = new Date() > validUntilDate;

  return (
    <div className={`bg-white rounded-xl shadow-sm border ${isActive && !isExpired ? 'border-gray-200' : 'border-gray-300 bg-gray-50 opacity-80'} overflow-hidden relative`}>
      <div className="p-5">
        {/* Header & Edit Button */}
        <div className="flex justify-between items-start mb-3">
          <div>
            <h3 className="text-xl font-bold text-gray-900">{coupon.title}</h3>
            <p className="text-sm font-mono text-gray-600 bg-gray-100 px-2 py-0.5 rounded-md inline-block mt-1">{coupon.code}</p>
          </div>
          <button 
            onClick={() => onEdit(coupon)}
            className="p-2 rounded-full text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
            title="編輯優惠券"
          >
            <PencilIcon className="h-5 w-5" />
          </button>
        </div>

        {/* Status & Discount Type */}
        <div className="flex items-center gap-3 mb-4">
          <span className={`px-3 py-1 text-xs font-semibold rounded-full ${isActive && !isExpired ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
            {isActive && !isExpired ? '啟用中' : '已停用或過期'}
          </span>
          <span className="flex items-center text-sm text-gray-600 gap-1">
            <TagIcon className="h-4 w-4" />
            {isFixedDiscount ? '固定金額折抵' : '百分比折扣'}
          </span>
        </div>

        {/* Details Grid */}
        <div className="grid grid-cols-2 gap-y-2 text-sm">
          <div className="flex items-center gap-2">
            <CurrencyDollarIcon className="h-4 w-4 text-gray-500" />
            <span className="font-medium text-gray-700">折扣額度:</span>
          </div>
          <div className="text-right text-gray-800 font-bold">{discountValue}</div>

          <div className="flex items-center gap-2">
            <ClockIcon className="h-4 w-4 text-gray-500" />
            <span className="font-medium text-gray-700">有效期限:</span>
          </div>
          <div className="text-right text-gray-800">{format(validUntilDate, 'yyyy年MM月dd日')}</div>

          <div className="flex items-center gap-2">
            <UserIcon className="h-4 w-4 text-gray-500" />
            <span className="font-medium text-gray-700">使用狀況:</span>
          </div>
          <div className="text-right text-gray-800">{coupon.usageCount} / {coupon.usageLimit === -1 ? '無限制' : coupon.usageLimit}</div>
        </div>
      </div>
    </div>
  );
};

export default CouponCard;
