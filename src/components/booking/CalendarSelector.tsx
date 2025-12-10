import { DayPicker } from 'react-day-picker';
import { zhTW } from 'date-fns/locale';
import { startOfDay, isBefore, isSameDay, isAfter } from 'date-fns';
import 'react-day-picker/src/style.css';
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
      color: '#B7AD9E', // primary-light
      textDecoration: 'line-through',
      opacity: 0.5,
    },
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <LoadingSpinner />
      </div>
    );
  }

  const today = startOfDay(new Date());

  const isDateDisabled = (date: Date) => {
    // 1. Disable past days (strictly before today)
    if (isBefore(date, today)) return true;
    
    // 2. Disable closed days
    if (closedDays.some(closed => isSameDay(closed, date))) return true;

    // 3. Disable after deadline
    if (bookingDeadline && isAfter(date, bookingDeadline)) return true;

    return false;
  };

  return (
    <div 
      className="flex justify-center bg-white rounded-xl p-2"
      style={{
        // @ts-ignore - CSS variables for DayPicker
        '--rdp-cell-size': '40px',
        '--rdp-accent-color': '#9F9586',
        '--rdp-background-color': '#FDFBF7',
      }}
    >
      <DayPicker
        mode="single"
        selected={selectedDate}
        onSelect={onDateSelect}
        locale={zhTW}
        modifiers={modifiers}
        modifiersStyles={modifierStyles}
        disabled={isDateDisabled}
      />
    </div>
  );
};

export default CalendarSelector;
