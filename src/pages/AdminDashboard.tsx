import { Link } from 'react-router-dom';
import { useMemo, useState } from 'react';
import { isWithinInterval, startOfDay, endOfDay, addDays } from 'date-fns';
import { useAllBookings } from '../hooks/useAllBookings';
import { useBusinessHoursSummary } from '../hooks/useBusinessHoursSummary';
import { useAllUsers } from '../hooks/useAllUsers';
import { useServices } from '../hooks/useServices';
import LoadingSpinner from '../components/common/LoadingSpinner';
import SummaryCard from '../components/admin/SummaryCard';
import ImageManagementModal from '../components/admin/ImageManagementModal';
import { 
  CalendarDaysIcon, 
  UserGroupIcon, 
  CubeIcon, 
  CurrencyDollarIcon, 
  CheckCircleIcon, 
  CheckBadgeIcon, 
  ArchiveBoxIcon, 
  CalendarIcon, 
  PhotoIcon, 
  Cog6ToothIcon,
  ArrowRightIcon,
  ChartBarIcon,
  TicketIcon
} from '@heroicons/react/24/outline';

const AdminDashboard = () => {
  const { bookings, loading, error } = useAllBookings(null);
  const { closedDays } = useBusinessHoursSummary();
  const { users } = useAllUsers();
  const { services } = useServices();
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);

  const summaryData = useMemo(() => {
    const now = new Date();
    const sevenDaysFromNow = addDays(now, 7);
    const sevenDaysAgo = addDays(now, -7);

    return {
      holidaysNext7Days: closedDays.filter(day => 
        isWithinInterval(day, { start: startOfDay(now), end: endOfDay(sevenDaysFromNow) })
      ).length,
      newUsersLast7Days: users.filter(user => {
        const createdAtDate = user.createdAt && 'toDate' in user.createdAt ? user.createdAt.toDate() : null;
        if (!createdAtDate) return false;
        return isWithinInterval(createdAtDate, { start: sevenDaysAgo, end: now });
      }).length,
      activeServices: services.filter(service => service.available).length,
      pendingConfirmation: bookings.filter(b => b.status === 'pending_confirmation').length,
      pendingPaymentCount: bookings.filter(b => b.status === 'pending_payment').length,
      confirmedCount: bookings.filter(b => b.status === 'confirmed').length,
      completedCount: bookings.filter(b => b.status === 'completed').length,
    };
  }, [bookings, closedDays, users, services]);

  if (loading && bookings.length === 0) {
    return (
      <div className="flex flex-col justify-center items-center h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <LoadingSpinner />
        <p className="mt-4 text-gray-600 font-medium">載入管理後台...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full">
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
              <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">載入失敗</h3>
            <p className="text-sm text-gray-600">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-gradient-to-br from-gray-50 to-gray-100 overflow-hidden">
      {/* Header - 固定高度 */}
      <header className="bg-white shadow-sm border-b border-gray-200 flex-shrink-0">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl shadow-md">
                <ChartBarIcon className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
                  管理員後台
                </h1>
                <p className="text-xs sm:text-sm text-gray-500">快速存取所有管理功能</p>
              </div>
            </div>
            <Link 
              to="/dashboard" 
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors"
            >
              <ArrowRightIcon className="h-4 w-4 rotate-180" />
              返回使用者頁面
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content - 彈性填滿剩餘空間 */}
      <main className="flex-1 container mx-auto px-4 py-4 overflow-y-auto">
        {/* Grid Layout - 2x5 網格 */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
          {/* 所有行程 */}
          <SummaryCard
            title="所有行程"
            value=""
            unit=""
            linkTo="/admin/calendar"
            icon={<CalendarIcon className="h-5 w-5 sm:h-6 sm:w-6" />}
            color="bg-purple-500"
          />

          {/* 營業時間 */}
          <SummaryCard
            title="營業時間"
            value=""
            unit=""
            linkTo="/admin/hours"
            icon={<CalendarDaysIcon className="h-5 w-5 sm:h-6 sm:w-6" />}
            color="bg-red-500"
          />

          {/* 首頁圖片 */}
          <SummaryCard
            title="首頁圖片"
            value=""
            unit=""
            onClick={() => setIsImageModalOpen(true)}
            icon={<PhotoIcon className="h-5 w-5 sm:h-6 sm:w-6" />}
            color="bg-orange-500"
          />

          {/* 客戶管理 */}
          <SummaryCard
            title="客戶管理"
            value={users.length}
            unit="位"
            linkTo="/admin/customers"
            icon={<UserGroupIcon className="h-5 w-5 sm:h-6 sm:w-6" />}
            color="bg-teal-500"
            subtext=''
          />

          {/* 待確認訂單 */}
          <SummaryCard
            title="待確認訂單"
            value={summaryData.pendingConfirmation}
            unit="筆"
            linkTo="/admin/orders?status=pending_confirmation"
            icon={<CheckCircleIcon className="h-5 w-5 sm:h-6 sm:w-6" />}
            color="bg-blue-500"
            urgent={summaryData.pendingConfirmation > 0}
          />

          {/* 待付款訂單 */}
          <SummaryCard
            title="待付款訂單"
            value={summaryData.pendingPaymentCount}
            unit="筆"
            linkTo="/admin/orders?status=pending_payment"
            icon={<CurrencyDollarIcon className="h-5 w-5 sm:h-6 sm:w-6" />}
            color="bg-yellow-500"
            urgent={summaryData.pendingPaymentCount > 0}
          />

          {/* 已確認訂單 */}
          <SummaryCard
            title="已確認訂單"
            value={summaryData.confirmedCount}
            unit="筆"
            linkTo="/admin/orders?status=confirmed"
            icon={<CheckBadgeIcon className="h-5 w-5 sm:h-6 sm:w-6" />}
            color="bg-green-500"
          />

          {/* 已完成訂單 */}
          <SummaryCard
            title="已完成訂單"
            value={summaryData.completedCount}
            unit="筆"
            linkTo="/admin/orders?status=completed"
            icon={<ArchiveBoxIcon className="h-5 w-5 sm:h-6 sm:w-6" />}
            color="bg-gray-500"
          />

          {/* 上架中服務 */}
          <SummaryCard
            title="上架中服務"
            value={summaryData.activeServices}
            unit="項"
            linkTo="/admin/services"
            icon={<CubeIcon className="h-5 w-5 sm:h-6 sm:w-6" />}
            color="bg-indigo-500"
          />

          {/* 設定 */}
          <SummaryCard
            title="設定"
            value=""
            unit=""
            linkTo="/admin/settings"
            icon={<Cog6ToothIcon className="h-5 w-5 sm:h-6 sm:w-6" />}
            color="bg-gray-600"
          />

          {/* 優惠與集點 */}
          <SummaryCard
            title="優惠與集點"
            value=""
            unit=""
            linkTo="/admin/promotions"
            icon={<TicketIcon className="h-5 w-5 sm:h-6 sm-w-6" />}
            color="bg-amber-500"
          />
        </div>
      </main>

      {/* Image Management Modal */}
      {isImageModalOpen && (
        <ImageManagementModal onClose={() => setIsImageModalOpen(false)} />
      )}
    </div>
  );
};

export default AdminDashboard;