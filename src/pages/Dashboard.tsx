import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { useBookings } from '../hooks/useBookings';
import { auth } from '../lib/firebase';
import { signOut } from 'firebase/auth';
const Dashboard = () => {
  const { currentUser: user, userProfile } = useAuthStore();
  const { bookings, isLoading, error } = useBookings();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await signOut(auth);
      // The useAuth hook will handle state update and redirect
      navigate('/');
    } catch (error) {
      console.error("Error signing out: ", error);
    }
  };

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

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-800">
            歡迎回來, {userProfile?.profile.displayName || user?.email}!
          </h1>
          <div className="flex items-center gap-4">
            {userProfile?.role === 'admin' && (
              <Link
                to="/admin"
                className="px-4 py-2 bg-gray-700 text-white font-semibold rounded-md shadow-sm hover:bg-gray-800 transition-colors"
              >
                管理後台
              </Link>
            )}
            <button
              onClick={handleLogout}
              className="px-4 py-2 bg-red-500 text-white font-semibold rounded-md shadow-sm hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors"
            >
              登出
            </button>
          </div>
        </div>
      </header>

      <main className="container mx-auto p-4 sm:p-6 lg:p-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Quick Actions Column */}
          <div className="lg:col-span-1">
            <div className="bg-white p-6 rounded-lg shadow">
              <h2 className="text-xl font-semibold mb-4 text-gray-700">快速操作</h2>
              <Link
                to="/booking"
                className="w-full block text-center px-6 py-3 bg-pink-500 text-white font-semibold rounded-md shadow-lg hover:bg-pink-600 transition-all transform hover:scale-105"
              >
                + 建立新預約
              </Link>
            </div>
          </div>

          {/* My Bookings Column */}
          <div className="lg:col-span-2">
            <h2 className="text-2xl font-bold mb-4 text-gray-800">我的預約記錄</h2>
            {isLoading && <div className="flex justify-center p-8"><LoadingSpinner /></div>}
            {error && <p className="text-center text-red-500 bg-red-50 p-4 rounded-md">{error}</p>}
            {!isLoading && !error && bookings.length === 0 && (
              <div className="text-center text-gray-500 bg-white p-8 rounded-lg shadow">
                <p>您目前沒有任何預約。</p>
              </div>
            )}
            <div className="space-y-4">
              {bookings.map(booking => (
                <div key={booking.id} className="bg-white p-4 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
                    <div className="flex-grow">
                      <p className="font-bold text-lg text-gray-800">{booking.service?.name || '服務已刪除'}</p>
                      <p className="text-sm text-gray-600">{booking.dateTime.toLocaleString('zh-TW', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
                    </div>
                    <div className="mt-2 sm:mt-0 flex items-center gap-4">
                      <span className={`px-3 py-1 text-xs font-semibold rounded-full ${getStatusChipClass(booking.status)}`}>
                        {translateStatus(booking.status)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;