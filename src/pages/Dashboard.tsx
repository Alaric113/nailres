import { Link } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useBookings } from '../hooks/useBookings';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { format } from 'date-fns';
import { zhTW } from 'date-fns/locale';
import { getBookingStatusChipClass, bookingStatusTextMap } from '../utils/bookingUtils';
import { 
  StarIcon, 
  PlusIcon, 
  CalendarDaysIcon,
  ClockIcon,
  ExclamationCircleIcon
} from '@heroicons/react/24/outline';
import { StarIcon as StarIconSolid } from '@heroicons/react/24/solid';

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


  

  const loyaltyPoints = userProfile?.loyaltyPoints || 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Page Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
          <div className="flex flex-row items-center sm:items-center gap-4">
            {/* Avatar */}
            <div className="relative flex-shrink-0">
              <img
                src={userProfile?.profile.avatarUrl || 'https://firebasestorage.googleapis.com/v0/b/nail-62ea4.firebasestorage.app/o/user-solid.svg?alt=media&token=e5336262-2473-4888-a741-055155153a63'}
                alt="User Avatar"
                crossOrigin="anonymous"
                referrerPolicy="no-referrer"
                className="w-16 h-16 sm:w-20 sm:h-20 rounded-full object-cover ring-4 ring-[#9f9586] shadow-lg"
              />
              
            </div>

            {/* Welcome Text */}
            <div className="flex-1">
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1">
                Hi, {userProfile?.profile.displayName || '使用者'}
              </h1>
              <p className="text-sm sm:text-base text-gray-600">
                歡迎回來！在這裡管理您的預約與會員資訊
              </p>
            </div>

            
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: Actions & Points */}
          <div className="lg:col-span-1 space-y-6">
            {/* New Booking Button */}
            <div className="bg-[#9f9586] rounded-2xl shadow-xl p-6 text-white overflow-hidden relative">
              <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-white opacity-10 rounded-full blur-2xl"></div>
              <div className="absolute bottom-0 left-0 -mb-4 -ml-4 w-32 h-32 bg-white opacity-10 rounded-full blur-2xl"></div>
              <div className="relative z-10">
                <h3 className="text-lg font-bold mb-2">準備好預約了嗎？</h3>
                
                <Link
                  to="/booking"
                  className="flex items-center justify-center gap-2 w-full bg-white text-[#9f9586] font-bold rounded-xl py-3 px-4 shadow-lg hover:shadow-2xl hover:scale-105 transition-all"
                >
                  <PlusIcon className="w-5 h-5" />
                  新增預約
                </Link>
              </div>
            </div>

            {/* Loyalty Points Card */}
            <div className="bg-[#9f9586] rounded-2xl shadow-md border-2 border-gray-100 overflow-hidden">
              <div className={` p-4 text-white flex flex-row justify-between`}>
                <div className="flex-row flex items-center mb-2">
                  
                  <StarIconSolid className="w-10 h-10 opacity-20" />
                  <p className="text-lg font-medium ">累積點數</p>
                </div>
                <div className="bg-[#9f9586] backdrop-blur-sm rounded-xl p-4">
                  
                  <p className="text-4xl font-bold">
                    {loyaltyPoints}
                    <span className="text-lg font-medium ml-2">點</span>
                  </p>
                </div>
              </div>
              <div className="p-4 bg-gradient-to-br from-gray-50 to-white">
                <div className="flex items-start gap-2">
                  <StarIcon className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-gray-600 leading-relaxed">
                    消費滿額 1000 即可累積點數，兌換專屬好禮！
                  </p>
                </div>
              </div>
            </div>

            
          </div>

          {/* Right Column: My Bookings */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-md border-2 border-gray-100 overflow-hidden">
              {/* Header */}
              <div className="bg-gradient-to-r from-gray-50 to-white border-b-2 border-gray-100 p-4 sm:p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-gradient-to-br from-pink-500 to-purple-600 rounded-xl">
                      <CalendarDaysIcon className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h2 className="text-lg sm:text-xl font-bold text-gray-900">
                        我的預約紀錄
                      </h2>
                      <p className="text-xs sm:text-sm text-gray-500">
                        共 {bookings.length} 筆預約
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Content */}
              <div className="p-4 sm:p-6">
                {isLoading && (
                  <div className="flex justify-center py-12">
                    <LoadingSpinner />
                  </div>
                )}

                {error && (
                  <div className="bg-red-50 border-l-4 border-red-500 rounded-lg p-4">
                    <div className="flex items-start">
                      <ExclamationCircleIcon className="w-5 h-5 text-red-400 mt-0.5 mr-3" />
                      <div>
                        <p className="text-sm font-medium text-red-800">載入失敗</p>
                        <p className="text-sm text-red-700 mt-1">{error}</p>
                      </div>
                    </div>
                  </div>
                )}

                {!isLoading && bookings.length === 0 && (
                  <div className="text-center py-12">
                    <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-gray-100 mb-4">
                      <CalendarDaysIcon className="h-8 w-8 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      還沒有預約紀錄
                    </h3>
                    <p className="text-sm text-gray-500 mb-6">
                      立即預約，開始您的美麗旅程
                    </p>
                    <Link
                      to="/booking"
                      className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-pink-500 to-purple-600 text-white font-semibold rounded-xl hover:from-pink-600 hover:to-purple-700 shadow-md hover:shadow-lg transition-all"
                    >
                      <PlusIcon className="w-5 h-5" />
                      立即預約
                    </Link>
                  </div>
                )}

                <div className="space-y-3">
                  {bookings.map((booking) => (
                    <div 
                      key={booking.id} 
                      className="group border-2 border-gray-100 hover:border-pink-200 rounded-xl p-4 transition-all hover:shadow-md bg-gradient-to-br from-white to-gray-50"
                    >
                      <div className="flex flex-col sm:flex-row justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-start gap-3 mb-3">
                            <div className="p-2 bg-gradient-to-br from-pink-100 to-purple-100 rounded-lg">
                              <CalendarDaysIcon className="w-5 h-5 text-pink-600" />
                            </div>
                            <div className="flex-1">
                              <p className="font-bold text-gray-900 text-base sm:text-lg mb-1">
                                {booking.serviceName}
                              </p>
                              <div className="flex flex-col gap-1">
                                <div className="flex items-center gap-2 text-sm text-gray-600">
                                  <CalendarDaysIcon className="w-4 h-4" />
                                  {format(booking.dateTime, 'yyyy年MM月dd日 (EEEE)', { locale: zhTW })}
                                </div>
                                <div className="flex items-center gap-2 text-sm text-gray-600">
                                  <ClockIcon className="w-4 h-4" />
                                  {format(booking.dateTime, 'pp', { locale: zhTW })}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="flex sm:flex-col items-center sm:items-end gap-3">
                          <span className={`px-3 py-1.5 text-xs font-bold rounded-full whitespace-nowrap ${getBookingStatusChipClass(booking.status)}`}>
                            {bookingStatusTextMap[booking.status] || '未知狀態'}
                          </span>
                          {!['completed', 'cancelled'].includes(booking.status) && (
                            <button
                              onClick={() => handleCancel(booking.id)}
                              className="text-sm font-medium text-red-600 hover:text-red-700 hover:underline transition-colors"
                            >
                              取消預約
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;