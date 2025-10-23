import { DayPicker, type Matcher } from 'react-day-picker';
import { zhTW } from 'date-fns/locale';
import 'react-day-picker/dist/style.css';
import LoadingSpinner from '../common/LoadingSpinner';

interface CalendarSelectorProps {
  selectedDate: Date | undefined;
  onDateSelect: (date: Date | undefined) => void;
  closedDays: Date[];
  isLoading: boolean;
  bookingDeadline: Date | null;
}

const CalendarSelector = ({ selectedDate, onDateSelect, closedDays, isLoading, bookingDeadline }: CalendarSelectorProps) => {
  
  const modifiers = {
    closed: closedDays, // Keep this for styling closed days
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

  const disabledDays: Matcher[] = [{ before: new Date() }, ...closedDays];
  if (bookingDeadline) {
    disabledDays.push({ after: bookingDeadline });
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
        disabled={disabledDays}
      />
    </div>
  );
};

export default CalendarSelector;
