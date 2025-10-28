import { Link } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useBookings } from '../hooks/useBookings';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { format } from 'date-fns';
import { zhTW } from 'date-fns/locale';
import { getBookingStatusChipClass, bookingStatusTextMap } from '../utils/bookingUtils';
import { StarIcon } from '@heroicons/react/24/outline';
const Dashboard = () => {
  const { userProfile } = useAuthStore();
  const { bookings, isLoading, error, cancelBooking } = useBookings();

  const handleCancel = async (bookingId: string) => {
    if (window.confirm('您確定要取消這個預約嗎？')) {
      try {
        await cancelBooking(bookingId);
        alert('預約已成功取消。');
      } catch (err) {
        console.error('取消預約失敗:', err);
        alert('取消預約失敗，請稍後再試。');
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Page Header */}
      <header className="bg-white shadow-sm p-1  flex flex-row items-center">
        <img
          src={userProfile?.profile.avatarUrl || 'https://firebasestorage.googleapis.com/v0/b/nail-62ea4.firebasestorage.app/o/dashboard_banner.jpg?alt=media&token=5c3f3fcb-Bbb4-4f3d-8f3d-5f7e6c3e4e2e'}
          alt="Dashboard Banner"
          className="w-20 h-20 rounded-full object-cover ml-2"
        />
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <h1 className="text-3xl font-bold text-gray-900">
            Hi, {userProfile?.profile.displayName || '使用者'}
          </h1>
          <p className="mt-1 text-gray-600">歡迎回來！在這裡管理您的預約。</p>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto p-4 sm:p-6 lg:p-8">

        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          <div className="lg:col-span-1">
            <div className="space-y-6">
              {/* New Booking Button */}
              <div className="bg-white rounded-lg shadow-md p-6">
                <Link
                  to="/booking"
                  className="w-full inline-block text-center bg-pink-500 text-white font-bold rounded-md py-3 px-4 shadow-md hover:bg-pink-600 transition-colors"
                >
                  + 新增預約
                </Link>
              </div>

              {/* Loyalty Points Card */}
              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex items-center mb-4">
                  <StarIcon className="h-6 w-6 text-yellow-500 mr-3" />
                  <h2 className="text-xl font-bold text-gray-800">我的點數</h2>
                </div>
                <p className="text-4xl font-bold text-gray-900 text-center">{userProfile?.loyaltyPoints || 0} <span className="text-lg font-medium text-gray-500">點</span></p>
                <p className="text-xs text-gray-500 text-center mt-2">消費滿額即可累積點數，兌換專屬好禮！</p>
              </div>
            </div>
          </div>
          {/* Left Column: My Bookings */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-bold text-gray-800 mb-4">我的預約紀錄</h2>
              {isLoading && <div className="flex justify-center py-8"><LoadingSpinner /></div>}
              {error && <p className="text-red-500">{error}</p>}
              {!isLoading && bookings.length === 0 && (
                <p className="text-gray-500">您目前沒有任何預約。</p>
              )}
              <div className="space-y-4">
                {bookings.map((booking) => (
                  <div key={booking.id} className="border border-gray-200 rounded-lg p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                      <p className="font-semibold text-gray-800">{booking.serviceName}</p>
                      <p className="text-sm text-gray-600">
                        {format(booking.dateTime, 'yyyy年MM月dd日 (EEEE) pp', { locale: zhTW })}
                      </p>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getBookingStatusChipClass(booking.status)}`}>
                        {bookingStatusTextMap[booking.status] || '未知狀態'}
                      </span>
                      {/* Allow cancellation if the booking is not completed or already cancelled */}
                      {!['completed', 'cancelled'].includes(booking.status) && (
                        <button
                          onClick={() => handleCancel(booking.id)}
                          className="text-sm text-red-600 hover:underline"
                        >
                          取消
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column: Actions */}
          
        </div>
      </main>
    </div>
  );
};

export default Dashboard;