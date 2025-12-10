import { useMemo, useState } from 'react';
import { isWithinInterval, startOfDay, endOfDay, addDays } from 'date-fns';
import { useAllBookings } from '../hooks/useAllBookings';
import { useBusinessHoursSummary } from '../hooks/useBusinessHoursSummary';
import { useAllUsers } from '../hooks/useAllUsers';
import { useServices } from '../hooks/useServices';
import LoadingSpinner from '../components/common/LoadingSpinner';
import SummaryCard from '../components/admin/SummaryCard';
import ImageManagementModal from '../components/admin/ImageManagementModal';
import AdminLayout from '../components/admin/AdminLayout'; // Import AdminLayout
import {
  BellAlertIcon, // For urgent tasks
  UsersIcon, // For new users
  CalendarDaysIcon, // For holidays
  ClipboardDocumentCheckIcon, // For active services
  CreditCardIcon // For pending payments
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
    <AdminLayout> {/* Wrap with AdminLayout */}
      <div className="py-6">
        <h1 className="text-3xl font-serif font-bold text-gray-900 mb-6">總覽</h1>
        
        {/* Urgent Tasks Section */}
        <div className="mb-8 p-6 bg-white rounded-2xl shadow-sm border border-[#EFECE5]">
          <h2 className="text-xl font-serif font-bold text-gray-900 mb-4 flex items-center gap-2">
            <BellAlertIcon className="w-6 h-6 text-accent" /> 待處理事項
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <SummaryCard
              title="待確認訂單"
              value={summaryData.pendingConfirmation}
              unit="筆"
              linkTo="/admin/orders?status=pending_confirmation"
              icon={<ClipboardDocumentCheckIcon className="h-5 w-5 sm:h-6 sm:w-6" />}
              color="bg-red-500" // More urgent color
              urgent={summaryData.pendingConfirmation > 0}
            />
            <SummaryCard
              title="待付款訂單"
              value={summaryData.pendingPaymentCount}
              unit="筆"
              linkTo="/admin/orders?status=pending_payment"
              icon={<CreditCardIcon className="h-5 w-5 sm:h-6 sm:w-6" />}
              color="bg-orange-500" // Urgent color
              urgent={summaryData.pendingPaymentCount > 0}
            />
          </div>
        </div>

        {/* Quick Stats Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <SummaryCard
            title="近7日新註冊用戶"
            value={summaryData.newUsersLast7Days}
            unit="位"
            linkTo="/admin/customers"
            icon={<UsersIcon className="h-5 w-5 sm:h-6 sm:w-6" />}
            color="bg-blue-500"
          />
          <SummaryCard
            title="近7日公休日"
            value={summaryData.holidaysNext7Days}
            unit="天"
            linkTo="/admin/hours"
            icon={<CalendarDaysIcon className="h-5 w-5 sm:h-6 sm:w-6" />}
            color="bg-purple-500"
          />
          <SummaryCard
            title="上架中服務"
            value={summaryData.activeServices}
            unit="項"
            linkTo="/admin/services"
            icon={<ClipboardDocumentCheckIcon className="h-5 w-5 sm:h-6 sm:w-6" />}
            color="bg-green-500"
          />
        </div>

        {/* Image Management Modal */}
        {isImageModalOpen && (
          <ImageManagementModal onClose={() => setIsImageModalOpen(false)} />
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminDashboard;