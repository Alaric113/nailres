import type { BookingStatus } from '../types/booking';

export const bookingStatusTextMap: Record<BookingStatus, string> = {
  pending_payment: '訂金待付',
  pending_confirmation: '確認中',
  confirmed: '已確認',
  completed: '已完成',
  cancelled: '已取消',
};

export const getBookingStatusChipClass = (status: BookingStatus): string => {
  switch (status) {
    case 'pending_payment':
      return 'bg-yellow-100 text-yellow-800';
    case 'pending_confirmation':
      return 'bg-blue-100 text-blue-800';
    case 'confirmed':
      return 'bg-green-100 text-green-800';
    case 'completed':
      return 'bg-gray-200 text-gray-800'; // Adjusted for better contrast from design system
    case 'cancelled':
      return 'bg-red-100 text-red-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

export const translateBookingStatus = (status: BookingStatus): string => {
  return bookingStatusTextMap[status] || status;
};