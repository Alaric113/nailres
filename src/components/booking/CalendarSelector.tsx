import { DayPicker } from 'react-day-picker';
import { zhTW } from 'date-fns/locale';
import { startOfDay, isBefore, isSameDay, isAfter } from 'date-fns';
import LoadingSpinner from '../common/LoadingSpinner';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';

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

  const isDateDisabled = (date: Date) => {
    if (isBefore(date, today)) return true;
    if (closedDays.some(closed => isSameDay(closed, date))) return true;
    if (bookingDeadline && isAfter(date, bookingDeadline)) return true;
    return false;
  };

  const classNames = {
    root: "p-3 bg-white rounded-xl",
    months: "flex justify-center",
    month: "space-y-4",
    caption: "flex justify-center pt-1 relative items-center mb-4",
    caption_label: "text-lg font-serif font-bold text-text-main",
    nav: "flex items-center",
    nav_button: "h-7 w-7 bg-transparent hover:bg-secondary-light rounded-full p-1 text-primary transition-colors disabled:opacity-30 flex items-center justify-center",
    nav_button_previous: "absolute left-1",
    nav_button_next: "absolute right-1",
    table: "w-full border-collapse",
    head_row: "flex justify-center",
    head_cell: "text-[#8A8173] w-10 font-medium text-[0.9rem] flex justify-center",
    row: "flex w-full mt-2 justify-center",
    cell: "text-center text-sm p-0 relative focus-within:relative focus-within:z-20",
    day: "h-10 w-10 p-0 font-normal aria-selected:opacity-100 hover:bg-secondary-light rounded-full transition-colors text-text-main flex items-center justify-center",
    day_selected: "bg-primary text-white hover:bg-primary hover:text-white font-bold",
    day_today: "text-accent font-bold ring-1 ring-accent/50",
    day_outside: "text-gray-300 opacity-50",
    day_disabled: "text-gray-300 opacity-30 cursor-not-allowed hover:bg-transparent decoration-slate-400",
    day_hidden: "invisible",
  };

  return (
    <div className="flex justify-center bg-white rounded-xl p-2">
      <DayPicker
        mode="single"
        selected={selectedDate}
        onSelect={onDateSelect}
        locale={zhTW}
        disabled={isDateDisabled}
        classNames={classNames}
        components={{
          IconLeft: () => <ChevronLeftIcon className="h-4 w-4" />,
          IconRight: () => <ChevronRightIcon className="h-4 w-4" />,
        }}
      />
    </div>
  );
};

export default CalendarSelector;
