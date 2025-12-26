import { useMemo } from 'react';
import Modal from '../common/Modal';
import LoadingSpinner from '../common/LoadingSpinner';
import { useUserCoupons } from '../../hooks/useUserCoupons';
import type { Coupon } from '../../types/coupon';
import type { Service } from '../../types/service';
import type { Designer } from '../../types/designer';
import { format } from 'date-fns';

interface CouponSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (coupon: Coupon | null) => void;
  selectedServices: Service[];
  selectedDesigner: Designer | null;
  currentPrice: number;
}

const CouponSelectorModal = ({ isOpen, onClose, onSelect, selectedServices, selectedDesigner, currentPrice }: CouponSelectorModalProps) => {
  const { userCoupons, isLoading, error } = useUserCoupons();

  const availableCoupons = useMemo(() => {
    const now = new Date();
    return userCoupons.filter(coupon => {
      // 1. Audit Status & Expiry
      // Robust check for legacy data (which might use isUsed boolean)
      const isUsed = coupon.status === 'used' || (coupon as any).isUsed === true;
      if (isUsed) return false;
      
      const isActive = coupon.status === 'active' || (!coupon.status && !(coupon as any).isUsed);
      if (!isActive) return false;

      // Check expiry
      if (coupon.validUntil && coupon.validUntil.toDate() < now) return false;

      // 2. Check minimum spend
      if (currentPrice < (coupon.minSpend || 0)) {
        return false;
      }

      // 3. Check service scope
      // Default to 'all' if scopeType is missing (legacy support)
      const scopeType = coupon.scopeType || 'all';
      const scopeIds = coupon.scopeIds || [];

      switch (scopeType) {
        case 'all':
          return true;
        case 'category':
          return selectedServices.some(service => scopeIds.includes(service.category));
        case 'service':
          return selectedServices.some(service => scopeIds.includes(service.id));
        case 'designer':
          return selectedDesigner ? scopeIds.includes(selectedDesigner.id) : false;
        default:
          return true; // Treat unknown scope as 'all' to avoid hiding valid coupons
      }
    });
  }, [userCoupons, selectedServices, currentPrice]);

  const getDiscountText = (coupon: { type: Coupon['type']; value: number }) => {
    return coupon.type === 'fixed' ? `$${coupon.value} 折扣` : `${coupon.value}% 折扣`;
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="選擇優惠券">
      <div className="max-h-[60vh] overflow-y-auto p-1">
        {isLoading && <div className="flex justify-center p-8"><LoadingSpinner /></div>}
        {error && <p className="text-red-500 text-center p-4">{error}</p>}
        {!isLoading && !error && (
          <div className="space-y-3">
            {/* Option to not use a coupon */}
            <div
              onClick={() => { onSelect(null); onClose(); }}
              className="p-4 border-2 border-dashed border-gray-300 rounded-lg text-center cursor-pointer hover:bg-gray-100"
            >
              <p className="font-semibold text-gray-600">不使用優惠券</p>
            </div>
            {availableCoupons.length > 0 ? (
              availableCoupons.map(coupon => (
                <div
                  key={coupon.id}
                  onClick={() => { onSelect(coupon); onClose(); }}
                  className="p-4 border-2 border-pink-200 bg-pink-50 rounded-lg cursor-pointer hover:border-pink-400 transition-colors"
                >
                  <div className="flex justify-between items-center">
                    <h3 className="font-bold text-lg text-pink-700">{coupon.title}</h3>
                    <p className="font-bold text-lg text-green-600">{getDiscountText(coupon)}</p>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">{coupon.details}</p>
                  <p className="text-xs text-gray-500 mt-2">
                    {coupon.minSpend > 0 && `低消 ${coupon.minSpend} 元 | `}
                    有效期限至 {format(coupon.validUntil.toDate(), 'yyyy-MM-dd')}
                  </p>
                </div>
              ))
            ) : (
              <p className="text-center text-gray-500 py-8">您目前沒有可用的優惠券。</p>
            )}
          </div>
        )}
      </div>
    </Modal>
  );
};

export default CouponSelectorModal;