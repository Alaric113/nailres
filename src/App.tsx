import { createBrowserRouter, RouterProvider, Navigate, Outlet } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';
import { useAuthStore } from './store/authStore';
import { Suspense, lazy } from 'react';
// Lazy Load Pages
const Home = lazy(() => import('./pages/Home'));
const Login = lazy(() => import('./components/auth/Login').then(module => ({ default: module.Login })));
const Register = lazy(() => import('./pages/Register'));
const PortfolioGalleryPage = lazy(() => import('./pages/PortfolioGalleryPage'));
const LiffEntry = lazy(() => import('./pages/liff/LiffEntry'));

// Page Components
const BookingPage = lazy(() => import('./pages/BookingPage'));
const BookingPaymentPage = lazy(() => import('./pages/booking/BookingPaymentPage'));
const StoreInfoPage = lazy(() => import('./pages/StoreInfoPage'));
const UserMemberPage = lazy(() => import('./pages/UserMemberPage'));
const MemberHistoryPage = lazy(() => import('./pages/member/MemberHistoryPage'));
const MemberOrderDetailPage = lazy(() => import('./pages/member/MemberOrderDetailPage'));
const ReschedulePage = lazy(() => import('./pages/member/ReschedulePage'));
const MemberRewardsPage = lazy(() => import('./pages/member/MemberRewardsPage'));
const MemberPassPage = lazy(() => import('./pages/member/MemberPassPage'));
const MemberCouponsPage = lazy(() => import('./pages/member/MemberCouponsPage'));
const PurchasePassPage = lazy(() => import('./pages/member/PurchasePassPage'));

const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));
const ServiceManagement = lazy(() => import('./pages/ServiceManagement'));
const CustomerListPage = lazy(() => import('./pages/CustomerListPage'));
const CustomerDetailPage = lazy(() => import('./pages/CustomerDetailPage'));
const HoursSettingsPage = lazy(() => import('./pages/HoursSettingsPage'));
const OrderManagementPage = lazy(() => import('./pages/OrderManagementPage'));
const PassOrderManagementPage = lazy(() => import('./pages/admin/PassOrderManagementPage'));
const OrderEditPage = lazy(() => import('./pages/OrderEditPage'));
const OrderFeedbackPage = lazy(() => import('./pages/OrderFeedbackPage'));
const FeedbackPage = lazy(() => import('./pages/FeedbackPage'));
const CalendarPage = lazy(() => import('./pages/CalendarPage'));
const SettingsPage = lazy(() => import('./pages/SettingsPage'));
const StaffManagementPage = lazy(() => import('./pages/StaffManagementPage'));
const PromotionsPage = lazy(() => import('./pages/PromotionsPage'));
const ImageSettingsPage = lazy(() => import('./pages/admin/ImageSettingsPage'));
const PortfolioManagementPage = lazy(() => import('./pages/PortfolioManagementPage'));
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
      <Suspense fallback={<LoadingSpinner size='lg' fullScreen />}>
        <Outlet />
      </Suspense>
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