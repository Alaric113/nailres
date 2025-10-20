import React from 'react';
import { DayPicker } from 'react-day-picker';
import 'react-day-picker/dist/style.css';
import { zhTW } from 'date-fns/locale/zh-TW';

interface CalendarSelectorProps {
  selectedDate: Date | undefined;
  onDateSelect: (date: Date | undefined) => void;
}

const CalendarSelector: React.FC<CalendarSelectorProps> = ({ selectedDate, onDateSelect }) => {
  return (
    <div className="flex justify-center bg-white p-4 rounded-lg shadow-md">
      <DayPicker
        mode="single"
        selected={selectedDate}
        onSelect={onDateSelect}
        locale={zhTW}
        showOutsideDays
        fixedWeeks
        disabled={{ before: new Date() }} // Disable past dates
        styles={{
          caption: { color: '#db2777' }, // pink-600
        }}
      />
    </div>
  );
};

export default CalendarSelector;