import React, { useState } from 'react';
import { format } from 'date-fns';
import { zhTW } from 'date-fns/locale';
import type { EnrichedBooking } from '../../hooks/useAllBookings';
import type { BookingStatus } from '../../types/booking';
import { XMarkIcon, UserIcon, CalendarIcon, ClockIcon, CurrencyDollarIcon, PencilSquareIcon, ChatBubbleLeftEllipsisIcon } from '@heroicons/react/24/outline';

interface BookingDetailModalProps {
  booking: EnrichedBooking;
  onClose: () => void;
  onUpdateStatus: (bookingId: string, newStatus: BookingStatus) => Promise<void>;
}

const statusTextMap: Record<BookingStatus, string> = {
  pending_payment: '訂金待付',
  pending_confirmation: '確認中',
  confirmed: '已確認',
  completed: '已完成',
  cancelled: '已取消',
};

const BookingDetailModal: React.FC<BookingDetailModalProps> = ({ booking, onClose, onUpdateStatus }) => {
  const [isUpdating, setIsUpdating] = useState(false);

  const handleStatusChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newStatus = e.target.value as BookingStatus;
    setIsUpdating(true);
    try {
      await onUpdateStatus(booking.id, newStatus);
    } catch (error) {
      console.error("Failed to update status from modal:", error);
      alert('更新狀態失敗！');
    } finally {
      setIsUpdating(false);
    }
  };

  const DetailItem = ({ icon, label, value }: { icon: React.ReactNode, label: string, value: string | number }) => (
    <div className="flex items-start">
      <div className="flex-shrink-0 w-6 h-6 text-gray-500">{icon}</div>
      <div className="ml-3">
        <p className="text-sm font-medium text-gray-500">{label}</p>
        <p className="text-base text-gray-900">{value}</p>
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-lg shadow-xl w-full max-w-lg" onClick={(e) => e.stopPropagation()}>
        <div className="p-6 border-b border-gray-200 flex justify-between items-center">
          <h2 className="text-xl font-bold text-gray-800">預約詳情</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>
        <div className="p-6 space-y-6">
          <DetailItem icon={<UserIcon />} label="客戶名稱" value={booking.userName || 'N/A'} />
          <DetailItem icon={<PencilSquareIcon />} label="服務項目" value={booking.serviceName || 'N/A'} />
          <DetailItem icon={<CalendarIcon />} label="預約時間" value={format(booking.dateTime, 'yyyy/MM/dd (E) HH:mm', { locale: zhTW })} />
          <div className="grid grid-cols-2 gap-6">
            <DetailItem icon={<ClockIcon />} label="服務時長" value={`${booking.duration} 分鐘`} />
            <DetailItem icon={<CurrencyDollarIcon />} label="訂單金額" value={`$${booking.amount}`} />
          </div>
          {booking.notes && (
            <DetailItem icon={<ChatBubbleLeftEllipsisIcon />} label="客戶備註" value={booking.notes} />
          )}
        </div>
        <div className="p-6 bg-gray-50 rounded-b-lg flex items-center justify-between">
          <div className="flex items-center gap-2">
            <label htmlFor="status-select" className="text-sm font-medium text-gray-700">更新狀態:</label>
            <select
              id="status-select"
              value={booking.status}
              onChange={handleStatusChange}
              disabled={isUpdating}
              className="p-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-sm disabled:bg-gray-200"
            >
              <option value="pending_payment">訂金待付</option>
              <option value="pending_confirmation">確認中</option>
              <option value="confirmed">已確認</option>
              <option value="completed">已完成</option>
              <option value="cancelled">已取消</option>
            </select>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 text-gray-800 font-semibold rounded-md hover:bg-gray-300"
          >
            關閉
          </button>
        </div>
      </div>
    </div>
  );
};

export default BookingDetailModal;