import { createBrowserRouter, RouterProvider, Navigate, Outlet } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';
import { useAuthStore } from './store/authStore';

// import LandingPage from './pages/LandingPage'; // Removed, used in RootRedirect
import Home from './pages/Home';
import { Login } from './components/auth/Login';
import Register from './pages/Register';
import PortfolioGalleryPage from './pages/PortfolioGalleryPage';
import LiffEntry from './pages/liff/LiffEntry';

// Page Components
import BookingPage from './pages/BookingPage';
import BookingPaymentPage from './pages/booking/BookingPaymentPage'; // New Import
import StoreInfoPage from './pages/StoreInfoPage';
import UserMemberPage from './pages/UserMemberPage';
import MemberHistoryPage from './pages/member/MemberHistoryPage';
import MemberOrderDetailPage from './pages/member/MemberOrderDetailPage'; // New Import
import ReschedulePage from './pages/member/ReschedulePage';
import MemberRewardsPage from './pages/member/MemberRewardsPage';
import MemberPassPage from './pages/member/MemberPassPage';
import MemberCouponsPage from './pages/member/MemberCouponsPage';
import PurchasePassPage from './pages/member/PurchasePassPage';
import AdminDashboard from './pages/AdminDashboard';
import ServiceManagement from './pages/ServiceManagement';
import CustomerListPage from './pages/CustomerListPage';
import CustomerDetailPage from './pages/CustomerDetailPage';
import HoursSettingsPage from './pages/HoursSettingsPage';
import OrderManagementPage from './pages/OrderManagementPage';
import PassOrderManagementPage from './pages/admin/PassOrderManagementPage';
import OrderEditPage from './pages/OrderEditPage';
import OrderFeedbackPage from './pages/OrderFeedbackPage'; // New Import
import FeedbackPage from './pages/FeedbackPage';
import CalendarPage from './pages/CalendarPage';
import SettingsPage from './pages/SettingsPage';
import StaffManagementPage from './pages/StaffManagementPage';
import PromotionsPage from './pages/PromotionsPage';
import ImageSettingsPage from './pages/admin/ImageSettingsPage'; // New Import

import PortfolioManagementPage from './pages/PortfolioManagementPage';
// Layout Components
import LoadingSpinner from './components/common/LoadingSpinner';
import AdminLayout from './components/admin/AdminLayout';
import UserLayout from './layouts/UserLayout';
import { ToastProvider } from './context/ToastContext';

// Route Components
import ProtectedRoute from './components/ProtectedRoute';
import AdminRoute from './components/AdminRoute';
import PwaUpdatePrompt from './components/PwaUpdatePrompt';

import RootRedirect from './components/auth/RootRedirect';
import ScrollToTop from './components/common/ScrollToTop';
import { useNotification } from './hooks/useNotification'; // New Import

function RootLayout() {
  const { isCheckingRedirect } = useAuth();

  const { authIsLoading } = useAuthStore();
  
  useNotification(); // Initialize FCM listener

  if (authIsLoading || isCheckingRedirect) {
    return <LoadingSpinner size='lg' text='正在載入中...' fullScreen />;
  }

  return (
    <ToastProvider>
      <PwaUpdatePrompt />
      <ScrollToTop />
      <Outlet /> {/* This Outlet will render the current route's element */}
    </ToastProvider>
  );
}

const RedirectIfLoggedIn = ({ children }: { children: React.ReactNode }) => {
  const { currentUser, userProfile } = useAuthStore();
  
  if (currentUser) {
    const isAdminOrStaff = ['admin', 'manager', 'designer'].includes(userProfile?.role || '');
    return <Navigate to={isAdminOrStaff ? '/admin' : '/dashboard'} replace />;
  }
  return children;
};

const routes = [
  {
    path: '/',
    element: <RootLayout />,
    children: [
      {
        element: <UserLayout />,
        children: [
          { path: '/', element: <RootRedirect /> }, // Changed
          { path: 'portfolio', element: <PortfolioGalleryPage /> },
          {
            element: <ProtectedRoute />,
            children: [
              { path: 'dashboard', element: <Home /> },
              { path: 'booking', element: <BookingPage /> },
              { path: 'booking/pay/:bookingId', element: <BookingPaymentPage /> }, // New Route
              { path: 'store', element: <StoreInfoPage /> }, // Added Store Route
              { 
                path: 'member', 
                children: [
                  { index: true, element: <UserMemberPage /> },
                  { path: 'history', element: <MemberHistoryPage /> },
                  { path: 'reschedule/:bookingId', element: <ReschedulePage /> },
                  { path: 'rewards', element: <MemberRewardsPage /> },
                  { path: 'pass', element: <MemberPassPage /> },
                  { path: 'coupons', element: <MemberCouponsPage /> },
                  { path: 'coupons', element: <MemberCouponsPage /> },
                ]
              },
              { path: 'member/purchase/:passId', element: <PurchasePassPage /> },
            ],
          },
          { path: 'liff', element: <LiffEntry /> },
          { path: 'orders/:bookingId', element: <MemberOrderDetailPage /> }, // New Order Detail Route
          { path: 'orders/:orderId/feedback', element: <OrderFeedbackPage /> }, // Feedback Route
        ],
      },
      {
        path: 'login',
        element: <Login />,
      },
      {
        path: 'register',
        element: (
          <RedirectIfLoggedIn>
            <Register />
          </RedirectIfLoggedIn>
        ),
      },
      {
        path: 'admin',
        element: <AdminRoute />,
        children: [
          {
            element: <AdminLayout />,
            children: [
              { index: true, element: <AdminDashboard />, handle: { title: '總覽' } },
              { path: 'services', element: <ServiceManagement />, handle: { title: '服務管理' } },
              { path: 'customers', element: <CustomerListPage />, handle: { title: '客戶管理' } },
              { path: 'customers/:userId', element: <CustomerDetailPage />, handle: { title: '客戶詳情' } },
              { path: 'hours', element: <HoursSettingsPage />, handle: { title: '營業時間設定' } },
              { path: 'orders', element: <OrderManagementPage />, handle: { title: '訂單管理' } },
              { path: 'orders-pass', element: <PassOrderManagementPage />, handle: { title: '季卡訂單管理' } },
              { path: 'orders/:orderId/edit', element: <OrderEditPage /> },
              { path: 'feedback', element: <FeedbackPage />, handle: { title: '問題回報' } }, // New Route
              { path: 'calendar', element: <CalendarPage />, handle: { title: '行事曆' } },
              { path: 'settings', element: <SettingsPage />, handle: { title: '一般設定' } },
              { path: 'staff', element: <StaffManagementPage />, handle: { title: '設計師管理' } },
              { path: 'settings/images', element: <ImageSettingsPage />, handle: { title: '首頁圖片' } }, // New Route
              { path: 'portfolio', element: <PortfolioManagementPage />, handle: { title: '作品集管理' } },
              { path: 'promotions', element: <PromotionsPage />, handle: { title: '優惠活動' } },
            ],
          },
        ],
      },
    ],
  },
];

const router = createBrowserRouter(routes);

function App() {
  return (
    <RouterProvider router={router} />
  );
}

export default App;