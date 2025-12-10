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
  
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <LoadingSpinner />
      </div>
    );
  }

  const today = startOfDay(new Date());

  const handleSelect = (date: Date | undefined) => {
    console.log('CalendarSelector internal select:', date);
    onDateSelect(date);
  };

  const isDateDisabled = (date: Date) => {
    const disabled = (
      isBefore(date, today) ||
      closedDays.some(closed => isSameDay(closed, date)) ||
      (bookingDeadline ? isAfter(date, bookingDeadline) : false)
    );
    // console.log(`Date check ${date.toISOString().split('T')[0]}: disabled=${disabled}`);
    return disabled;
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
      <style>{`
        .rdp-button_reset {
            all: unset;
        }
        .rdp-button {
            width: var(--rdp-cell-size);
            height: var(--rdp-cell-size);
            border-radius: 100%;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
        }
        .rdp-button:hover:not([disabled]) {
            background-color: #EFECE5;
            color: #5C5548;
        }
        .rdp-day_selected {
            background-color: var(--rdp-accent-color);
            color: white;
            font-weight: bold;
        }
        .rdp-day_today {
            font-weight: bold;
            color: #A67C52;
        }
        .rdp-nav_button {
            width: 30px;
            height: 30px;
        }
      `}</style>
      <DayPicker
        mode="single"
        selected={selectedDate}
        onSelect={handleSelect}
        locale={zhTW}
        disabled={isDateDisabled}
      />
    </div>
  );
};

export default CalendarSelector;