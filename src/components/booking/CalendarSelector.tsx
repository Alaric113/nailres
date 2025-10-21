import { DayPicker } from 'react-day-picker';
import { zhTW } from 'date-fns/locale';
import 'react-day-picker/dist/style.css';
import LoadingSpinner from '../common/LoadingSpinner';

interface CalendarSelectorProps {
  selectedDate: Date | undefined;
  onDateSelect: (date: Date | undefined) => void;
  closedDays: Date[];
  isLoading: boolean;
}

const CalendarSelector = ({ selectedDate, onDateSelect, closedDays, isLoading }: CalendarSelectorProps) => {
  
  const modifiers = {
    closed: closedDays,
    disabled: closedDays, // Also disable selection for closed days
  };

  const modifierStyles = {
    closed: {
      color: '#9ca3af', // gray-400
      textDecoration: 'line-through',
    },
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="flex justify-center">
      <DayPicker
        mode="single"
        selected={selectedDate}
        onSelect={onDateSelect}
        locale={zhTW}
        className="bg-white p-4 rounded-lg shadow-md"
        modifiers={modifiers}
        modifiersStyles={modifierStyles}
        disabled={{ before: new Date() }} // Disable past dates
      />
    </div>
  );
};

export default CalendarSelector;
