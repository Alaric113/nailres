import { Link } from 'react-router-dom';
import { useMemo } from 'react';
import { isWithinInterval, startOfDay, endOfDay, addDays } from 'date-fns';
import { useAllBookings } from '../hooks/useAllBookings';
import { useBusinessHoursSummary } from '../hooks/useBusinessHoursSummary';
import { useAllUsers } from '../hooks/useAllUsers';
import { useServices } from '../hooks/useServices';
import LoadingSpinner from '../components/common/LoadingSpinner';
import SummaryCard from '../components/admin/SummaryCard';
import { CalendarDaysIcon, UserGroupIcon, CubeIcon, CurrencyDollarIcon, CheckCircleIcon, CheckBadgeIcon, ArchiveBoxIcon, CalendarIcon } from '@heroicons/react/24/outline';

const AdminDashboard = () => {
  // Fetch all bookings for summary cards
  const { bookings, loading, error } = useAllBookings(null);
  const { closedDays } = useBusinessHoursSummary();
  const { users } = useAllUsers();
  const { services } = useServices();


  const summaryData = useMemo(() => {
    const now = new Date();
    const sevenDaysFromNow = addDays(now, 7);
    const sevenDaysAgo = addDays(now, -7);

    return {
      holidaysNext7Days: closedDays.filter(day => isWithinInterval(day, { start: startOfDay(now), end: endOfDay(sevenDaysFromNow) })).length,
      newUsersLast7Days: users.filter(user => {
        // Ensure createdAt exists and has a toDate method (i.e., it's a Timestamp, not a FieldValue)
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


  if (loading && bookings.length === 0) { // Show initial loading spinner
    return <div className="flex justify-center items-center h-screen"><LoadingSpinner /></div>;
  }

  if (error) {
    return <div className="text-red-500 text-center mt-10">Error loading bookings: {error}</div>;
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow-sm">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-row justify-between items-start sm:items-center mb-4">
            <h1 className="text-2xl font-bold text-gray-800">
              管理員後台
            </h1>
            <Link to="/dashboard" className="text-sm font-medium text-indigo-600 hover:underline mt-2 sm:mt-0">
              返回使用者儀表板 &rarr;
            </Link>
          </div>
          {/* Data Summary Section */}
          <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
            <SummaryCard
              title="所有行程"
              value=""
              unit=""
              linkTo="/admin/calendar"
              icon={<CalendarIcon className="h-6 w-6" />}
              color="bg-purple-500"
            />
            <SummaryCard
              title="營業時間"
              value=''
              unit=""
              linkTo="/admin/hours"
              icon={<CalendarDaysIcon className="h-6 w-6" />}
              color="bg-red-500"
            />
             <SummaryCard
              title="客戶管理"
              value={`${users.length}`}
              unit="位"
              linkTo="/admin/customers"
              icon={<UserGroupIcon className="h-6 w-6" />}
              color="bg-teal-500"
            />
            <SummaryCard
              title="待確認訂單"
              value={summaryData.pendingConfirmation}
              unit="筆"
              linkTo="/admin/orders?status=pending_confirmation"
              icon={<CheckCircleIcon className="h-6 w-6" />}
              color="bg-blue-500"
            />
            <SummaryCard
              title="待付款訂單"
              value={summaryData.pendingPaymentCount}
              unit="筆"
              linkTo="/admin/orders?status=pending_payment"
              icon={<CurrencyDollarIcon className="h-6 w-6" />}
              color="bg-yellow-500"
            />
            <SummaryCard
              title="已確認訂單"
              value={summaryData.confirmedCount}
              unit="筆"
              linkTo="/admin/orders?status=confirmed"
              icon={<CheckBadgeIcon className="h-6 w-6" />}
              color="bg-green-500"
            />
            <SummaryCard
              title="已完成訂單"
              value={summaryData.completedCount}
              unit="筆"
              linkTo="/admin/orders?status=completed"
              icon={<ArchiveBoxIcon className="h-6 w-6" />}
              color="bg-gray-500"
            />
            
            <SummaryCard
              title="上架中服務"
              value={summaryData.activeServices}
              unit="項"
              linkTo="/admin/services"
              icon={<CubeIcon className="h-6 w-6" />}
              color="bg-indigo-500"
            />
          </div>
        </div>
      </header>
      <main className="container mx-auto p-4 sm:p-6 lg:p-8">
        
      </main>
    </div>
  );
};

export default AdminDashboard;