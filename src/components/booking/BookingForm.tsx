import React from 'react';
import type { UserCoupon } from '../../types/coupon';


interface BookingFormProps {
  // services: Service[]; // Unused
  totalPrice: number;
  originalPrice?: number;
  discountAmount?: number;
  /** 白金會員折扣金額（不含優惠券） */
  platinumDiscountAmount?: number;
  /** 優惠券折扣金額 */
  couponDiscountAmount?: number;
  /** 當前選擇的優惠券（含名稱/類型/值等） */
  selectedCoupon?: UserCoupon | null;
  totalServicePrice?: number;
  /** Σ 可折扣加購項目原價（折扣前） */
  totalDiscountableOptionsPrice?: number;
  /** Σ 不可折扣加購項目原價 */
  totalNonDiscountableOptionsPrice?: number;
  /** Σ 不可折扣服務本體原價 */
  totalNonDiscountableServicePrice?: number;
  /** Σ 可折扣加購項目折後價（折扣後） */
  totalDiscountedDiscountableOptions?: number;
  notes: string;
  onNotesChange: (notes: string) => void;
}

const BookingForm: React.FC<BookingFormProps> = ({
  totalPrice,
  originalPrice,
  discountAmount,
  platinumDiscountAmount,
  couponDiscountAmount,
  selectedCoupon,
  totalServicePrice,
  totalDiscountableOptionsPrice,
  totalNonDiscountableOptionsPrice,
  totalNonDiscountableServicePrice,
  totalDiscountedDiscountableOptions,
  notes,
  onNotesChange
}) => {
  const hasDiscount = typeof discountAmount === 'number' && discountAmount > 0;
  const hasPlatinumDiscount = typeof platinumDiscountAmount === 'number' && platinumDiscountAmount > 0;
  const hasCouponDiscount = typeof couponDiscountAmount === 'number' && couponDiscountAmount > 0 && selectedCoupon;
  const hasDiscountableOptions = typeof totalDiscountableOptionsPrice === 'number' && totalDiscountableOptionsPrice > 0;
  const hasNonDiscountableOptions = typeof totalNonDiscountableOptionsPrice === 'number' && totalNonDiscountableOptionsPrice > 0;
  const discountableOptionsDiscounted = hasDiscount && hasDiscountableOptions &&
    typeof totalDiscountedDiscountableOptions === 'number' &&
    totalDiscountedDiscountableOptions < totalDiscountableOptionsPrice!;

  // 計算優惠券公式顯示文字
  const getCouponFormulaText = (): string | null => {
    if (!selectedCoupon || !hasCouponDiscount || !originalPrice) return null;
    // 折扣前金額 = 可折扣基礎（白金折扣後）— 不含不可折扣項目（服務+加購）
    const totalNonDiscountableAmount = (totalNonDiscountableOptionsPrice ?? 0) + (totalNonDiscountableServicePrice ?? 0);
    const beforeCoupon = (originalPrice - (platinumDiscountAmount ?? 0)) - totalNonDiscountableAmount;
    if (beforeCoupon <= 0) return null;

    if (selectedCoupon.type === 'percentage') {
      // e.g., value=15 → "折扣 15%" (代表打85折)
      return `計算方式：折扣項目原價 $${beforeCoupon.toLocaleString()}，折扣 ${selectedCoupon.value}% → -$${couponDiscountAmount!.toLocaleString()}`;
    } else {
      // fixed
      return `計算方式：折扣項目原價 $${beforeCoupon.toLocaleString()} - $${selectedCoupon.value.toLocaleString()} = -$${couponDiscountAmount!.toLocaleString()}`;
    }
  };

  const couponFormula = getCouponFormulaText();

  return (
    <div className="pt-2">
      <div className="space-y-4">
        <div>
          <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">
            備註 (選填)
          </label>
          <textarea
            id="notes"
            value={notes}
            onChange={(e) => onNotesChange(e.target.value)}
            rows={3}
            className="w-full rounded-xl border-gray-200 bg-gray-50 focus:bg-white focus:border-[#9F9586] focus:ring-[#9F9586] text-sm transition-all"
            placeholder="有特殊需求嗎？例如：需要卸甲、指定美甲師..."
          ></textarea>
        </div>

        <div className="pt-2 pb-4 md:pb-0">
          {/* 明細卡片 */}
          <div className="bg-gray-50 rounded-xl p-4 space-y-2 border border-gray-100">
            {/* 服務本體費用 */}
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-600">服務本體費用</span>
              <span className="text-gray-700 font-medium">
                ${totalServicePrice ?? (originalPrice ?? 0)}
              </span>
            </div>

            {/* 可折扣加購費用（折扣後） */}
            {hasDiscountableOptions && (
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-500">
                  ＋ 可折扣加購
                  {discountableOptionsDiscounted && (
                    <span className="text-purple-500 font-medium"> (折扣後)</span>
                  )}
                </span>
                <span className={discountableOptionsDiscounted ? 'text-purple-600 font-medium' : 'text-gray-500'}>
                  ${totalDiscountedDiscountableOptions ?? totalDiscountableOptionsPrice}
                </span>
              </div>
            )}

            {/* 不可折扣加購費用（原價） */}
            {hasNonDiscountableOptions && (
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-400">＋ 不可折扣加購 <span className="text-xs">(原價)</span></span>
                <span className="text-gray-400">${totalNonDiscountableOptionsPrice}</span>
              </div>
            )}

            {/* 折扣金額（有折扣才顯示整行） */}
            {hasDiscount && (
              <>
                <div className="border-t border-dashed border-gray-200 pt-1"></div>

                {/* 白金會員折扣（如有） */}
                {hasPlatinumDiscount && (
                  <div className="flex justify-between items-center text-sm">
                    <div className="flex flex-col">
                      <span className="text-purple-600 font-medium">
                        － 會員折扣 (-${platinumDiscountAmount!.toLocaleString()})
                      </span>
                    </div>
                    <span className="text-purple-600 font-bold">-${platinumDiscountAmount!.toLocaleString()}</span>
                  </div>
                )}

                {/* 優惠券折扣（如有） */}
                {hasCouponDiscount && (
                  <div className="flex justify-between items-center text-sm">
                    <div className="flex flex-col">
                      <span className="text-purple-600 font-medium">
                        － {selectedCoupon!.title} (-${couponDiscountAmount!.toLocaleString()})
                      </span>
                      {couponFormula && (
                        <span className="text-xs text-gray-400 mt-0.5">
                          ({couponFormula})
                        </span>
                      )}
                    </div>
                    <span className="text-purple-600 font-bold">-${couponDiscountAmount!.toLocaleString()}</span>
                  </div>
                )}

                {/* 折扣說明小字 */}
                <span className="block text-xs text-purple-400/70 mt-0.5">
                  (折扣適用於服務本體及可折扣加購，不可折扣項目維持原價)
                </span>
              </>
            )}

            {/* 分隔線 */}
            <div className="border-t-2 border-gray-200 pt-2"></div>

            {/* 總計費用 */}
            <div className="flex justify-between items-center">
              <span className="text-gray-800 font-bold text-sm">總計費用</span>
              <span className="text-2xl font-extrabold text-[#9F9586] tracking-wide">
                ${totalPrice}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookingForm;
