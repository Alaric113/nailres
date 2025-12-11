import { createBrowserRouter, RouterProvider, Navigate, Outlet } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';
import { useAuthStore } from './store/authStore';

import Home from './pages/Home';
import Login from './components/auth/Login';
import Register from './pages/Register';
import PortfolioGalleryPage from './pages/PortfolioGalleryPage';

// Page Components
import Dashboard from './pages/Dashboard';
import BookingPage from './pages/BookingPage';
import UserMemberPage from './pages/UserMemberPage';
import AdminDashboard from './pages/AdminDashboard';
import ServiceManagement from './pages/ServiceManagement';
import CustomerListPage from './pages/CustomerListPage';
import HoursSettingsPage from './pages/HoursSettingsPage';
import OrderManagementPage from './pages/OrderManagementPage';
import CalendarPage from './pages/CalendarPage';
import SettingsPage from './pages/SettingsPage';
import StaffManagementPage from './pages/StaffManagementPage';
import PromotionsPage from './pages/PromotionsPage';

import PortfolioManagementPage from './pages/PortfolioManagementPage';
// Layout Components
import LoadingSpinner from './components/common/LoadingSpinner';
import AdminLayout from './components/admin/AdminLayout';
import UserLayout from './layouts/UserLayout';
import { ToastProvider } from './context/ToastContext'; // NEW IMPORT

// Route Components
import ProtectedRoute from './components/ProtectedRoute';
import AdminRoute from './components/AdminRoute';
import PwaUpdatePrompt from './components/PwaUpdatePrompt';

function RootLayout() {
  const { isCheckingRedirect } = useAuth();
  const { authIsLoading } = useAuthStore(); // Removed currentUser, userProfile

  if (authIsLoading || isCheckingRedirect) {
    return <LoadingSpinner size='lg' text='正在載入中...' fullScreen />;
  }

  return (
    <ToastProvider>
      <PwaUpdatePrompt />
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
          { path: '/', element: <Home /> },
          { path: 'portfolio', element: <PortfolioGalleryPage /> },
          {
            element: <ProtectedRoute />,
            children: [
              { path: 'dashboard', element: <Dashboard /> },
              { path: 'booking', element: <BookingPage /> },
              { path: 'member', element: <UserMemberPage /> },
            ],
          },
        ],
      },
      {
        path: 'login',
        element: (
          <RedirectIfLoggedIn>
            <Login />
          </RedirectIfLoggedIn>
        ),
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
              { path: 'hours', element: <HoursSettingsPage />, handle: { title: '營業時間設定' } },
              { path: 'orders', element: <OrderManagementPage />, handle: { title: '訂單管理' } },
              { path: 'calendar', element: <CalendarPage />, handle: { title: '行事曆' } },
              { path: 'settings', element: <SettingsPage />, handle: { title: '一般設定' } },
              { path: 'staff', element: <StaffManagementPage />, handle: { title: '設計師管理' } },
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