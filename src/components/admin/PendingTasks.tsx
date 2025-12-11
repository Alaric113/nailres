import React, { useState } from 'react';
import { format } from 'date-fns';
import { zhTW } from 'date-fns/locale';
import type { EnrichedBooking } from '../../hooks/useAllBookings';
import type { BookingStatus } from '../../types/booking';
import { useToast } from '../../context/ToastContext'; // NEW IMPORT

type FilterStatus = BookingStatus | 'all';

interface PendingTasksProps {
  bookings: EnrichedBooking[];
  onUpdateStatus: (booking: EnrichedBooking, newStatus: BookingStatus) => Promise<void>;
  activeFilter: FilterStatus;
}

const statusTextMap: Record<BookingStatus, string> = {
  pending_payment: '訂金待付',
  pending_confirmation: '確認中',
  confirmed: '已確認',
  completed: '已完成',
  cancelled: '已取消',
};

const PendingTasks: React.FC<PendingTasksProps> = ({ bookings, onUpdateStatus, activeFilter }) => {
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const { showToast } = useToast(); // NEW HOOK USAGE


  const handleUpdate = async (booking: EnrichedBooking, newStatus: BookingStatus) => {
    setUpdatingId(booking.id);
    try {
      await onUpdateStatus(booking, newStatus);
      showToast('訂單狀態已更新。', 'success'); // Success toast
    } catch (error) {
      console.error("Failed to update booking status:", error);
      showToast('更新訂單狀態失敗！', 'error'); // Error toast
    } finally {
      setUpdatingId(null);
    }
  };

  const renderButtons = (booking: EnrichedBooking) => {
    const isUpdating = updatingId === booking.id;
    switch (booking.status) {
      case 'pending_confirmation':
        return (
          <>
            <button onClick={() => handleUpdate(booking, 'confirmed')} disabled={isUpdating} className="px-2 py-1 text-xs font-semibold text-white bg-green-500 rounded hover:bg-green-600 disabled:bg-gray-300">{isUpdating ? '...' : '確認'}</button>
            <button onClick={() => handleUpdate(booking, 'cancelled')} disabled={isUpdating} className="px-2 py-1 text-xs font-semibold text-white bg-red-500 rounded hover:bg-red-600 disabled:bg-gray-300">{isUpdating ? '...' : '取消'}</button>
          </>
        );
      case 'pending_payment':
        return <button onClick={() => handleUpdate(booking, 'confirmed')} disabled={isUpdating} className="px-2 py-1 text-xs font-semibold text-white bg-blue-500 rounded hover:bg-blue-600 disabled:bg-gray-300">{isUpdating ? '...' : '標記已付'}</button>;
      case 'confirmed':
        return <button onClick={() => handleUpdate(booking, 'completed')} disabled={isUpdating} className="px-2 py-1 text-xs font-semibold text-white bg-purple-500 rounded hover:bg-purple-600 disabled:bg-gray-300">{isUpdating ? '...' : '標記完成'}</button>;
      default:
        return null;
    }
  };

  if (activeFilter === 'all') {
    return null; // Do not show list if 'all' is selected
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-md mt-8">
      <h3 className="text-lg font-bold text-gray-800 mb-4">
        {statusTextMap[activeFilter as BookingStatus]} 訂單 ({bookings.length})
      </h3>
      <div className="space-y-4 max-h-[60vh] overflow-y-auto">
        {bookings.length > 0 ? (
          bookings.map(b => (
            <div key={b.id} className="p-3 bg-gray-50 rounded-md flex flex-col sm:flex-row justify-between sm:items-center gap-2">
              <div>
                {activeFilter === 'pending_payment' ? (
                  <p className="font-semibold text-sm">{b.userName} - {b.serviceName}</p>
                ) : (
                  <p className="font-semibold text-sm">{b.userName} - {b.serviceName}</p>
                )}
                <p className="text-xs text-gray-500">{format(b.dateTime, 'MM/dd HH:mm', { locale: zhTW })}</p>
              </div>
              <div className="flex gap-2 self-end sm:self-center">{renderButtons(b)}</div>
            </div>
          ))
        ) : (
          <p className="text-sm text-gray-400 text-center py-4">沒有符合條件的訂單</p>
        )}
      </div>
    </div>
  );
};

export default PendingTasks;