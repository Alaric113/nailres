import React from 'react';
import type { Service } from '../../types/service';
import type { Coupon } from '../../types/coupon';

interface BookingFormProps {
  services: Service[];
  totalPrice: number;
  notes: string;
  onNotesChange: (notes: string) => void;
}

const BookingForm: React.FC<BookingFormProps> = ({ services, totalPrice, notes, onNotesChange }) => {
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
          <div className="flex justify-between items-center mb-4">
            <span className="text-gray-600 font-medium">總計費用</span>
            <span className="text-2xl font-bold text-[#9F9586]">${totalPrice}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookingForm;
