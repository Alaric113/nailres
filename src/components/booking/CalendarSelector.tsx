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

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const disabledDays: Matcher[] = [{ before: today }, ...closedDays];
  if (bookingDeadline) {
    disabledDays.push({ after: bookingDeadline });
  }

  return (
    <div className="flex justify-center bg-white rounded-xl p-2">
      <style>{`
        .rdp {
          --rdp-cell-size: 40px;
          --rdp-accent-color: #9F9586;
          --rdp-background-color: #FDFBF7;
          margin: 0;
        }
        .rdp-button:hover:not([disabled]):not(.rdp-day_selected) {
          background-color: #EFECE5;
          color: #5C5548;
        }
        .rdp-day_selected {
          font-weight: bold;
        }
        .rdp-caption_label {
          font-family: "Noto Serif Display", serif;
          color: #5C5548;
          font-size: 1.1rem;
        }
        .rdp-head_cell {
          color: #8A8173;
          font-weight: 500;
        }
      `}</style>
      <DayPicker
        mode="single"
        selected={selectedDate}
        onSelect={onDateSelect}
        locale={zhTW}
        modifiers={modifiers}
        modifiersStyles={modifierStyles}
        disabled={disabledDays}
      />
    </div>
  );
};

export default CalendarSelector;
