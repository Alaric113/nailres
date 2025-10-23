import{ useState, useMemo } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { format } from 'date-fns';
import { zhTW } from 'date-fns/locale';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAllBookings } from '../hooks/useAllBookings';
import type { EnrichedBooking } from '../hooks/useAllBookings';
import type { BookingStatus } from '../types/booking';
import LoadingSpinner from '../components/common/LoadingSpinner';

const statusTextMap: Record<string, string> = {
  pending_payment: '待付款的訂單',
  pending_confirmation: '待確認的訂單',
  confirmed: '已確認的訂單',
  completed: '已完成的訂單',
  cancelled: '已取消的訂單',
};

const OrderManagementPage = () => {
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const statusFilter = queryParams.get('status') as BookingStatus | null;

  const { bookings, loading, error } = useAllBookings(null); // Fetch all bookings

  const filteredBookings = useMemo(() => {
    if (!statusFilter) return [];
    return bookings
      .filter(b => b.status === statusFilter)
      .sort((a, b) => {
        // Show most recent completed bookings first
        if (statusFilter === 'completed') {
          return b.dateTime.getTime() - a.dateTime.getTime();
        }
        // Show oldest pending bookings first for other statuses
        return a.dateTime.getTime() - b.dateTime.getTime();
      });
  }, [bookings, statusFilter]);

  const handleUpdateStatus = async (bookingId: string, newStatus: BookingStatus) => {
    setUpdatingId(bookingId);
    try {
      const bookingRef = doc(db, 'bookings', bookingId);
      await updateDoc(bookingRef, { status: newStatus });
    } catch (error) {
      console.error("Failed to update booking status:", error);
      alert('更新訂單狀態失敗！');
    } finally {
      setUpdatingId(null);
    }
  };

  const renderButtons = (booking: EnrichedBooking) => {
    const isUpdating = updatingId === booking.id;
    switch (booking.status) {
      case 'pending_confirmation':
        return (<><button onClick={() => handleUpdateStatus(booking.id, 'confirmed')} disabled={isUpdating} className="px-2 py-1 text-xs font-semibold text-white bg-green-500 rounded hover:bg-green-600 disabled:bg-gray-300">{isUpdating ? '...' : '確認'}</button><button onClick={() => handleUpdateStatus(booking.id, 'cancelled')} disabled={isUpdating} className="px-2 py-1 text-xs font-semibold text-white bg-red-500 rounded hover:bg-red-600 disabled:bg-gray-300">{isUpdating ? '...' : '取消'}</button></>);
      case 'pending_payment':
        return <button onClick={() => handleUpdateStatus(booking.id, 'pending_confirmation')} disabled={isUpdating} className="px-2 py-1 text-xs font-semibold text-white bg-blue-500 rounded hover:bg-blue-600 disabled:bg-gray-300">{isUpdating ? '...' : '標記已付'}</button>;
      case 'confirmed':
        return <button onClick={() => handleUpdateStatus(booking.id, 'completed')} disabled={isUpdating} className="px-2 py-1 text-xs font-semibold text-white bg-purple-500 rounded hover:bg-purple-600 disabled:bg-gray-300">{isUpdating ? '...' : '標記完成'}</button>;
      default:
        return null;
    }
  };

  const pageTitle = statusFilter ? statusTextMap[statusFilter] : '訂單資訊';

  if (loading) return <div className="flex justify-center items-center h-screen"><LoadingSpinner /></div>;
  if (error) return <div className="text-red-500 text-center mt-10">讀取訂單時發生錯誤: {error}</div>;

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow-sm"><div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center"><h1 className="text-xl sm:text-2xl font-bold text-gray-800">{pageTitle}</h1><Link to="/admin" className="text-sm font-medium text-indigo-600 hover:underline">&larr; 返回管理員頁面</Link></div></header>
      <main className="container mx-auto p-4 sm:p-6 lg:p-8">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="space-y-4 max-h-[75vh] overflow-y-auto">
            {filteredBookings.length > 0 ? filteredBookings.map(b => (
              <div key={b.id} className="p-3 bg-gray-50 rounded-md flex flex-col sm:flex-row justify-between sm:items-center gap-2">
                <div>
                  <p className="font-semibold text-sm">{b.userName} - {b.serviceName}</p>
                  <p className="text-xs text-gray-500">{format(b.dateTime, 'yyyy/MM/dd HH:mm', { locale: zhTW })}</p>
                </div>
                <div className="flex gap-2 self-end sm:self-center">{renderButtons(b)}</div>
              </div>
            )) : <p className="text-sm text-gray-400 text-center py-4">沒有符合條件的訂單</p>}
          </div>
        </div>
      </main>
    </div>
  );
};

export default OrderManagementPage;

