import { useAllBookings } from './hooks/useAllBookings';

const AdminDashboard = () => {
  const { bookings, loading, error } = useAllBookings();

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">管理員後台 - 所有預約</h1>

      {loading && <p>正在載入預約資料...</p>}
      {error && <p className="text-red-500">讀取資料時發生錯誤: {error.message}</p>}

      {!loading && !error && (
        <div className="bg-white shadow-md rounded-lg overflow-hidden">
          <table className="min-w-full leading-normal">
            <thead>
              <tr>
                <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  預約時間
                </th>
                <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  使用者 ID
                </th>
                <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  服務項目 ID
                </th>
                <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  狀態
                </th>
              </tr>
            </thead>
            <tbody>
              {bookings.map((booking) => (
                <tr key={booking.id}>
                  <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm">{booking.dateTime.toDate().toLocaleString()}</td>
                  <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm truncate">{booking.userId}</td>
                  <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm">{booking.serviceId}</td>
                  <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm">{booking.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;