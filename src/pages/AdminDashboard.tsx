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
      <div className="flex flex-col justify-center items-center h-screen bg-secondary-light">
        <LoadingSpinner />
        <p className="mt-4 text-text-main font-medium">載入管理後台...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-secondary-light flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-lg border border-secondary-dark p-8 max-w-md w-full">
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
              <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h3 className="text-lg font-serif font-bold text-text-main mb-2">載入失敗</h3>
            <p className="text-sm text-text-light">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-secondary-light overflow-hidden">
      {/* Header - 固定高度 */}
      <header className="bg-white/80 backdrop-blur-md border-b border-secondary-dark flex-shrink-0 z-10">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-xl">
                <ChartBarIcon className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-serif font-bold text-text-main tracking-wide">
                  管理員後台
                </h1>
                <p className="text-xs sm:text-sm text-text-light">快速存取所有管理功能</p>
              </div>
            </div>
            <Link 
              to="/dashboard" 
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-primary hover:text-primary-dark hover:bg-secondary-light rounded-lg transition-colors"
            >
              <ArrowRightIcon className="h-4 w-4 rotate-180" />
              返回使用者頁面
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content - 彈性填滿剩餘空間 */}
      <main className="flex-1 container mx-auto px-4 py-6 overflow-y-auto">
        {/* Flex Layout */}
        <div className="flex flex-wrap gap-4">
          {/* 所有行程 */}
          <div className="w-full sm:w-[calc(50%-0.5rem)] lg:w-[calc(33.333%-0.75rem)] xl:w-[calc(25%-0.75rem)]">
            <SummaryCard
              title="所有行程"
              value=""
              unit=""
              linkTo="/admin/calendar"
              icon={<CalendarIcon className="h-5 w-5 sm:h-6 sm:w-6" />}
              color="bg-primary"
            />
          </div>

          {/* 營業時間 */}
          <div className="w-full sm:w-[calc(50%-0.5rem)] lg:w-[calc(33.333%-0.75rem)] xl:w-[calc(25%-0.75rem)]">
            <SummaryCard
              title="營業時間"
              value=""
              unit=""
              linkTo="/admin/hours"
              icon={<CalendarDaysIcon className="h-5 w-5 sm:h-6 sm:w-6" />}
              color="bg-accent"
            />
          </div>

          {/* 首頁圖片 */}
          <div className="w-full sm:w-[calc(50%-0.5rem)] lg:w-[calc(33.333%-0.75rem)] xl:w-[calc(25%-0.75rem)]">
            <SummaryCard
              title="首頁圖片"
              value=" "
              unit=" "
              onClick={() => setIsImageModalOpen(true)}
              icon={<PhotoIcon className="h-5 w-5 sm:h-6 sm:w-6" />}
              color="bg-primary-light"
            />
          </div>

          {/* 作品集管理 */}
          <div className="w-full sm:w-[calc(50%-0.5rem)] lg:w-[calc(33.333%-0.75rem)] xl:w-[calc(25%-0.75rem)]">
            <SummaryCard
              title="作品集管理"
              value=""
              unit=""
              linkTo="/admin/portfolio"
              icon={<PhotoIcon className="h-5 w-5 sm:h-6 sm:w-6" />}
              color="bg-primary-dark"
            />
          </div>

          {/* 客戶管理 */}
          <div className="w-full sm:w-[calc(50%-0.5rem)] lg:w-[calc(33.333%-0.75rem)] xl:w-[calc(25%-0.75rem)]">
            <SummaryCard
              title="客戶管理"
              value={users.length}
              unit="位"
              linkTo="/admin/customers"
              icon={<UserGroupIcon className="h-5 w-5 sm:h-6 sm:w-6" />}
              color="bg-primary"
              subtext=''
            />
          </div>

          {/* 待確認訂單 */}
          <div className="w-full sm:w-[calc(50%-0.5rem)] lg:w-[calc(33.333%-0.75rem)] xl:w-[calc(25%-0.75rem)]">
            <SummaryCard
              title="待確認訂單"
              value={summaryData.pendingConfirmation}
              unit="筆"
              linkTo="/admin/orders?status=pending_confirmation"
              icon={<CheckCircleIcon className="h-5 w-5 sm:h-6 sm:w-6" />}
              color="bg-accent"
              urgent={summaryData.pendingConfirmation > 0}
            />
          </div>

          {/* 待付款訂單 */}
          <div className="w-full sm:w-[calc(50%-0.5rem)] lg:w-[calc(33.333%-0.75rem)] xl:w-[calc(25%-0.75rem)]">
            <SummaryCard
              title="待付款訂單"
              value={summaryData.pendingPaymentCount}
              unit="筆"
              linkTo="/admin/orders?status=pending_payment"
              icon={<CurrencyDollarIcon className="h-5 w-5 sm:h-6 sm:w-6" />}
              color="bg-primary-light"
              urgent={summaryData.pendingPaymentCount > 0}
            />
          </div>

          {/* 已確認訂單 */}
          <div className="w-full sm:w-[calc(50%-0.5rem)] lg:w-[calc(33.333%-0.75rem)] xl:w-[calc(25%-0.75rem)]">
            <SummaryCard
              title="已確認訂單"
              value={summaryData.confirmedCount}
              unit="筆"
              linkTo="/admin/orders?status=confirmed"
              icon={<CheckBadgeIcon className="h-5 w-5 sm:h-6 sm:w-6" />}
              color="bg-primary"
            />
          </div>

          {/* 已完成訂單 */}
          <div className="w-full sm:w-[calc(50%-0.5rem)] lg:w-[calc(33.333%-0.75rem)] xl:w-[calc(25%-0.75rem)]">
            <SummaryCard
              title="已完成訂單"
              value={summaryData.completedCount}
              unit="筆"
              linkTo="/admin/orders?status=completed"
              icon={<ArchiveBoxIcon className="h-5 w-5 sm:h-6 sm:w-6" />}
              color="bg-secondary-dark"
            />
          </div>

          {/* 上架中服務 */}
          <div className="w-full sm:w-[calc(50%-0.5rem)] lg:w-[calc(33.333%-0.75rem)] xl:w-[calc(25%-0.75rem)]">
            <SummaryCard
              title="上架中服務"
              value={summaryData.activeServices}
              unit="項"
              linkTo="/admin/services"
              icon={<CubeIcon className="h-5 w-5 sm:h-6 sm:w-6" />}
              color="bg-primary"
            />
          </div>

          {/* 優惠與集點 */}
          <div className="w-full sm:w-[calc(50%-0.5rem)] lg:w-[calc(33.333%-0.75rem)] xl:w-[calc(25%-0.75rem)]">
            <SummaryCard
              title="優惠與集點"
              value=""
              unit=""
              linkTo="/admin/promotions"
              icon={<TicketIcon className="h-5 w-5 sm:h-6 sm:w-6" />}
              color="bg-accent"
            />
          </div>

          {/* 設定 */}
          <div className="w-full sm:w-[calc(50%-0.5rem)] lg:w-[calc(33.333%-0.75rem)] xl:w-[calc(25%-0.75rem)]">
            <SummaryCard
              title="設定"
              value=""
              unit=""
              linkTo="/admin/settings"
              icon={<Cog6ToothIcon className="h-5 w-5 sm:h-6 sm:w-6" />}
              color="bg-text-light"
            />
          </div>

          
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