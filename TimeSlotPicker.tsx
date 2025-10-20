import React, { useState } from 'react';
import { useAvailableSlots } from '../hooks/useAvailableSlots';

interface TimeSlotPickerProps {
  selectedServiceDuration: number | null;
  onSlotSelect: (slot: Date) => void;
}

const TimeSlotPicker = ({ selectedServiceDuration }: TimeSlotPickerProps) => {
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const { availableSlots, isLoading, error } = useAvailableSlots(selectedDate, selectedServiceDuration);

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedDate(e.target.value);
    // In the future, changing the date will trigger the useAvailableSlots hook
  };

  return (
    <div>
      <label htmlFor="booking-date" className="block text-sm font-medium text-gray-700">
        Select a Date
      </label>
      <input
        type="date"
        id="booking-date"
        name="booking-date"
        value={selectedDate}
        onChange={handleDateChange}
        min={new Date().toISOString().split('T')[0]} // Disable past dates
        disabled={!selectedServiceDuration} // Disable until a service is selected
        className="w-full px-3 py-2 mt-1 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-gray-50 disabled:cursor-not-allowed"
      />

      {/* This section will display the available time slots */}
      <div className="mt-4">
        <h3 className="text-sm font-medium text-gray-700">Available Times</h3>
        {isLoading && <div className="p-4 mt-2 text-center text-gray-500">Finding available times...</div>}
        {error && <div className="p-4 mt-2 text-center text-red-500">{error}</div>}
        {selectedDate && !isLoading && !error && (
          <div className="grid grid-cols-3 gap-2 mt-2 sm:grid-cols-4">
            {availableSlots.length > 0 ? (
              availableSlots.map((slot) => {
                const timeString = slot.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
                const isSelected = selectedSlot === slot.toISOString();
                return (
                  <button
                    key={slot.toISOString()}
                    type="button"
                    onClick={() => {
                      setSelectedSlot(slot.toISOString());
                      onSlotSelect(slot);
                    }}
                    className={`px-2 py-2 text-sm font-medium border rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${isSelected ? 'bg-indigo-600 text-white border-transparent' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'}`}
                  >
                    {timeString}
                  </button>
                );
              })
            ) : (
              <div className="col-span-full p-4 text-center text-gray-500 bg-gray-50 rounded-md">
                No available times for this date. Please try another.
              </div>
            )}
          </div>
        )}
        {!selectedServiceDuration && <div className="p-4 mt-2 text-sm text-center text-gray-400 bg-gray-50 rounded-md">Please select a service to see available times.</div>}
      </div>
    </div>
  );
};

export default TimeSlotPicker;