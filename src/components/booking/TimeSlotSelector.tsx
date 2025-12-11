import React from 'react';
import { useDesignerAvailableSlots } from '../../hooks/useDesignerAvailableSlots'; // NEW IMPORT
import LoadingSpinner from '../common/LoadingSpinner';
import { format } from 'date-fns';

interface TimeSlotSelectorProps {
  selectedDesignerId: string | null; // NEW PROP
  selectedDate: string;
  serviceDuration: number | null; // Allow null
  onTimeSelect: (time: Date) => void;
  selectedTime: Date | null;
}

const TimeSlotSelector: React.FC<TimeSlotSelectorProps> = ({ selectedDesignerId, selectedDate, serviceDuration, onTimeSelect, selectedTime }) => {
  const { availableSlots, loading, error } = useDesignerAvailableSlots(selectedDesignerId, selectedDate, serviceDuration); // Use designer-specific hook

  if (!selectedDesignerId || !selectedDate || serviceDuration === null || serviceDuration === 0) { // Check designerId
    return <div className="p-8 text-center text-text-light bg-secondary-light/30 rounded-xl border border-dashed border-secondary-dark/30 font-light">請先選擇設計師、服務項目與日期。</div>;
  }

  if (loading) {
    return <div className="flex justify-center p-4"><LoadingSpinner /></div>;
  }

  if (error) {
    return <p className="text-red-500 text-center">{error}</p>;
  }

  if (availableSlots.length === 0) {
    return <div className="p-8 text-center text-text-light bg-secondary-light/30 rounded-xl border border-dashed border-secondary-dark/30 font-light">該日期已無可預約時段，請嘗試其他日期。</div>;
  }

  return (
    <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
      {availableSlots.map((slot, index) => (
        <button
          key={index}
          onClick={() => onTimeSelect(slot)}
          className={`py-3 px-2 border rounded-lg text-center transition-all duration-200 font-medium text-sm shadow-sm ${
            selectedTime?.getTime() === slot.getTime() 
              ? 'bg-primary text-white border-primary ring-2 ring-primary/30' 
              : 'bg-white border-secondary-dark/30 text-text-main hover:bg-secondary-light hover:border-primary/50 hover:text-primary-dark transform hover:-translate-y-0.5'
          }`}
        >
          {format(slot, 'HH:mm')}
        </button>
      ))}
    </div>
  );
};

export default TimeSlotSelector;