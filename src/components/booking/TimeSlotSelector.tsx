import React from 'react';
import { useAvailableSlots } from '../../hooks/useAvailableSlots';
import LoadingSpinner from '../common/LoadingSpinner';
import { format } from 'date-fns';

interface TimeSlotSelectorProps {
  selectedDate: string;
  serviceDuration: number | null; // Allow null
  onTimeSelect: (time: Date) => void;
  selectedTime: Date | null;
}

const TimeSlotSelector: React.FC<TimeSlotSelectorProps> = ({ selectedDate, serviceDuration, onTimeSelect, selectedTime }) => {
  const { availableSlots, loading, error } = useAvailableSlots(selectedDate, serviceDuration);

  if (!selectedDate || !serviceDuration) {
    return <div className="p-4 text-center text-gray-500 bg-gray-50 rounded-lg">請先選擇服務項目與日期。</div>;
  }

  if (loading) {
    return <div className="flex justify-center p-4"><LoadingSpinner /></div>;
  }

  if (error) {
    return <p className="text-red-500 text-center">{error}</p>;
  }

  if (availableSlots.length === 0) {
    return <div className="p-4 text-center text-gray-500 bg-gray-50 rounded-lg">該日期已無可預約時段。</div>;
  }

  return (
    <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
      {availableSlots.map((slot, index) => (
        <button
          key={index}
          onClick={() => onTimeSelect(slot)}
          className={`p-3 border rounded-md text-center transition-colors ${
            selectedTime?.getTime() === slot.getTime() ? 'bg-pink-500 text-white border-pink-500' : 'bg-white border-gray-300 hover:bg-pink-50'
          }`}
        >
          {format(slot, 'HH:mm')}
        </button>
      ))}
    </div>
  );
};

export default TimeSlotSelector;
