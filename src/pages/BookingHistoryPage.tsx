import { useState } from 'react';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useBookings } from '../hooks/useBookings';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { format } from 'date-fns';
import { zhTW } from 'date-fns/locale';

const BookingHistoryPage = () => {
  const { bookings, isLoading, error } = useBookings();
  const [isCancelling, setIsCancelling] = useState<string | null>(null);

  const handleCancelBooking = async (bookingId: string) => {
    if (!window.confirm('您確定要取消這次的預約嗎？')) {
      return;
    }
    setIsCancelling(bookingId);
    try {
      const bookingRef = doc(db, 'bookings', bookingId);
      await updateDoc(bookingRef, {
        status: 'cancelled',
      });
      // 因為 useBookings 使用 onSnapshot，UI 會自動更新
    } catch (err) {
      console.error('Error cancelling booking:', err);
      alert('取消預約失敗，請稍後再試。');
    } finally {
      setIsCancelling(null);
    }
  };

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return <div className="p-8 text-center text-red-500">{error}</div>;
  }

  return (
    <div className="max-w-4xl p-8 mx-auto">
      <h1 className="text-3xl font-bold text-gray-800">我的預約</h1>
      <div className="mt-8 space-y-6">
        {bookings.length > 0 ? (
          bookings.map((booking) => {
            const isFutureBooking = booking.dateTime.getTime() > new Date().getTime();
            const canCancel = isFutureBooking && booking.status === 'confirmed';

            const getStatusChipClass = (status: string) => {
              switch (status) {
                case 'confirmed': return 'bg-green-100 text-green-800';
                case 'completed': return 'bg-blue-100 text-blue-800';
                case 'cancelled': return 'bg-red-100 text-red-800';
                default: return 'bg-gray-100 text-gray-800';
              }
            };

            const translateStatus = (status: string) => {
              switch (status) {
                case 'confirmed': return '已確認';
                case 'completed': return '已完成';
                case 'cancelled': return '已取消';
                default: return status;
              }
            };

            return (
              <div key={booking.id} className="p-6 bg-white rounded-lg shadow-lg border border-gray-200">
                <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                  <div>
                    <h2 className="text-xl font-semibold text-pink-600">
                      {booking.serviceName}
                    </h2>
                    <p className="mt-1 text-gray-600">
                      {format(booking.dateTime, 'yyyy年MM月dd日 EEEE HH:mm', { locale: zhTW })}
                    </p>
                  </div>
                  <div className="flex flex-col items-stretch gap-3 sm:items-end sm:flex-row sm:gap-4">
                    <div className="flex items-center gap-4">
                      <p className="text-lg font-bold text-gray-800">${booking.amount}</p>
                      <span className={`px-3 py-1 text-sm font-semibold rounded-full ${getStatusChipClass(booking.status)}`}>
                        {translateStatus(booking.status)}
                      </span>
                    </div>
                    {canCancel && (
                      <button
                        onClick={() => handleCancelBooking(booking.id)}
                        disabled={isCancelling === booking.id}
                        className="px-4 py-2 text-sm font-medium text-white bg-red-500 rounded-md shadow-sm hover:bg-red-600 disabled:bg-red-300 disabled:cursor-not-allowed transition-colors"
                      >
                        {isCancelling === booking.id ? '取消中...' : '取消預約'}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="text-center text-gray-500 bg-white p-8 rounded-lg shadow">
            <p>您目前沒有任何預約。</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default BookingHistoryPage;