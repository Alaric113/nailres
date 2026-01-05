import React from 'react';
import type { Coupon } from '../../types/coupon';
import { format } from 'date-fns';
import { PencilIcon, TagIcon, ClockIcon, CurrencyDollarIcon, UserIcon, TrashIcon } from '@heroicons/react/24/outline';
import { motion, useAnimation, type PanInfo } from 'framer-motion';

interface CouponCardProps {
  coupon: Coupon;
  onEdit: (coupon: Coupon) => void;
  onDelete?: (coupon: Coupon) => void;
}

const CouponCard: React.FC<CouponCardProps> = ({ coupon, onEdit, onDelete }) => {
  const isActive = coupon.isActive;
  const isFixedDiscount = coupon.type === 'fixed';
  const discountValue = isFixedDiscount ? `NT$ ${coupon.value}` : `${coupon.value}%`;
  const validUntilDate = coupon.validUntil.toDate();
  const isExpired = new Date() > validUntilDate;

  const controls = useAnimation();

  const handleDragEnd = async (_: any, info: PanInfo) => {
    if (info.offset.x < -60) {
      // Swiped left enough: Reveal button (snap to -80px)
      controls.start({ x: -80 });
    } else {
      // Snap back to closed
      controls.start({ x: 0 });
    }
  };

  const handleDeleteClick = () => {
    if (onDelete && window.confirm('確定要刪除此優惠券嗎？')) {
      onDelete(coupon);
      controls.start({ x: 0 }); // Reset after delete
    }
  };

  return (
    <div className="relative rounded-xl overflow-hidden shadow-sm border border-gray-200 bg-red-500">
      {/* Delete Background Button */}
      <button 
        onClick={handleDeleteClick}
        className="absolute inset-y-0 right-0 w-20 flex flex-col items-center justify-center text-white z-0 hover:bg-red-600 transition-colors"
      >
        <TrashIcon className="h-6 w-6" />
        <span className="text-xs font-bold mt-1">刪除</span>
      </button>

      {/* Swipeable Foreground */}
      <motion.div
        drag="x"
        dragConstraints={{ left: -80, right: 0 }}
        dragElastic={0.1}
        onDragEnd={handleDragEnd}
        animate={controls}
        className={`bg-white p-5 border-l-4 ${isActive && !isExpired ? 'border-l-green-400' : 'border-l-gray-300'} relative z-10 h-full`}
        whileTap={{ cursor: "grabbing" }}
        style={{ cursor: "grab" }}
      >
        {/* Header & Edit Button */}
        <div className="flex justify-between items-start mb-3">
          <div>
            <h3 className="text-xl font-bold text-gray-900">{coupon.title}</h3>
            <p className="text-sm font-mono text-gray-600 bg-gray-100 px-2 py-0.5 rounded-md inline-block mt-1">{coupon.code}</p>
          </div>
          <button 
            onClick={(e) => {
                e.stopPropagation();
                onEdit(coupon);
            }}
            onPointerDown={(e) => e.stopPropagation()} // Prevent drag conflict
            className="p-2 rounded-full text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors z-20 relative"
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
      </motion.div>
    </div>
  );
};

export default CouponCard;
