import React from 'react';


interface BookingFormProps {
  // services: Service[]; // Unused
  totalPrice: number;
  originalPrice?: number;
  discountAmount?: number;
  notes: string;
  onNotesChange: (notes: string) => void;
}

const BookingForm: React.FC<BookingFormProps> = ({ totalPrice, originalPrice, discountAmount, notes, onNotesChange }) => {
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
          {/* Discount Detail */}
          {discountAmount && discountAmount > 0 && (
             <div className="flex justify-between items-center mb-1 text-sm">
                <span className="text-gray-500">原價</span>
                <span className="text-gray-400 ">${originalPrice}</span>
             </div>
          )}
          {discountAmount && discountAmount > 0 && (
             <div className="flex justify-between items-center mb-2 text-sm">
                <span className="text-purple-600 font-medium">折扣優惠 (會員/優惠券)</span>
                <span className="text-purple-600 font-bold">-${discountAmount}</span>
             </div>
          )}
          <div className="flex justify-between items-center mb-4 border-t border-dashed border-gray-200 pt-3">
            <span className="text-gray-600 font-medium">總計費用</span>
            <span className="text-2xl font-bold text-[#9F9586]">${totalPrice}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookingForm;
