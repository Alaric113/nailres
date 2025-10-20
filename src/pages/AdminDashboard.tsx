import { useState } from 'react';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Link } from 'react-router-dom';
import { useAllBookings } from '../hooks/useAllBookings';
import type { EnrichedBooking } from '../types/booking';
import LoadingSpinner from '../components/common/LoadingSpinner';

const AdminDashboard = () => {
  const { bookings, loading, error } = useAllBookings();
  const [editingStatus, setEditingStatus] = useState<{ [key: string]: string }>({});
  const [isUpdating, setIsUpdating] = useState<string | null>(null);

  const getStatusChipClass = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'bg-green-100 text-green-800';
      case 'completed':
        return 'bg-blue-100 text-blue-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
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

  const handleStatusChange = (bookingId: string, newStatus: string) => {
    setEditingStatus(prev => ({ ...prev, [bookingId]: newStatus }));
  };

  const handleUpdateBooking = async (bookingId: string) => {
    const newStatus = editingStatus[bookingId];
    if (!newStatus) return;

    setIsUpdating(bookingId);
    try {
      const bookingRef = doc(db, 'bookings', bookingId);
      await updateDoc(bookingRef, {
        status: newStatus,
      });
      // Clear the editing state for this booking after successful update
      setEditingStatus(prev => {
        const newState = { ...prev };
        delete newState[bookingId];
        return newState;
      });
    } catch (err) {
      console.error("Error updating booking status: ", err);
      alert("更新失敗，請稍後再試。");
    } finally {
      setIsUpdating(null);
    }
  };

  if (loading && bookings.length === 0) {
    return <div className="flex justify-center items-center h-screen"><LoadingSpinner /></div>;
  }

  if (error) {
    return <div className="text-red-500 text-center mt-10">Error loading bookings: {error.message}</div>;
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow-sm">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-800">
            管理員後台
          </h1>
          <div className="flex items-center gap-4">
            <Link to="/admin/services" className="px-4 py-2 bg-blue-500 text-white font-semibold rounded-md shadow-sm hover:bg-blue-600 transition-colors">
              服務管理
            </Link>
            <Link to="/dashboard" className="text-sm font-medium text-indigo-600 hover:underline">
              返回使用者儀表板 &rarr;
            </Link>
          </div>
        </div>
      </header>
      <main className="container mx-auto p-4 sm:p-6 lg:p-8">
        <h2 className="text-2xl font-bold mb-6 text-gray-800">所有預約</h2>
        <div className="bg-white shadow-md rounded-lg overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">顧客</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">服務項目</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">預約時間</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">狀態</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">操作</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {bookings.map((booking: EnrichedBooking) => (
                <tr key={booking.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{booking.userName}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{booking.serviceName}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(booking.dateTime.seconds * 1000).toLocaleString('zh-TW')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 flex items-center gap-2">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusChipClass(booking.status)}`}>
                      {translateStatus(booking.status)}
                    </span>
                    <select
                      value={editingStatus[booking.id] || booking.status}
                      onChange={(e) => handleStatusChange(booking.id, e.target.value)}
                      className="block w-32 pl-3 pr-10 py-1 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                    >
                      <option value="confirmed">已確認</option>
                      <option value="completed">已完成</option>
                      <option value="cancelled">已取消</option>
                    </select>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button
                      onClick={() => handleUpdateBooking(booking.id)}
                      disabled={!editingStatus[booking.id] || isUpdating === booking.id || editingStatus[booking.id] === booking.status}
                      className="px-4 py-2 font-semibold text-white bg-pink-500 rounded-md hover:bg-pink-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                    >
                      {isUpdating === booking.id ? '更新中...' : '儲存'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {bookings.length === 0 && !loading && (
            <p className="text-center py-8 text-gray-500">目前沒有任何預約記錄。</p>
          )}
        </div>
      </main>
    </div>
  );
};

export default AdminDashboard;