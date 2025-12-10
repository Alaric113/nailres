import PortfolioManagementPage from './pages/PortfolioManagementPage';
import LoadingSpinner from './components/common/LoadingSpinner';
import AdminLayout from './components/admin/AdminLayout';
import UserLayout from './layouts/UserLayout';

import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom';
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
import PromotionsPage from './pages/PromotionsPage';

// Route Components
import ProtectedRoute from './components/ProtectedRoute';
import AdminRoute from './components/AdminRoute';
import PwaUpdatePrompt from './components/PwaUpdatePrompt';

function AppContent() {
  const { isCheckingRedirect } = useAuth();
  const { currentUser, userProfile, authIsLoading } = useAuthStore();

  if (authIsLoading || isCheckingRedirect) {
    console.log('[App Checkpoint 1] App is in loading state (authIsLoading: true).');
    return <LoadingSpinner size='lg' text='正在載入中...' fullScreen />;
  }

  return (
    <>
      <PwaUpdatePrompt />
      <Routes>
        {/* Public and User Protected routes use UserLayout */}
        <Route element={<UserLayout />}>
          {/* Public Routes */}
          <Route path="/" element={<Home />} />
          <Route path="/portfolio" element={<PortfolioGalleryPage />} />

          {/* Protected Routes for regular users */}
          <Route element={<ProtectedRoute />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/booking" element={<BookingPage />} />
            <Route path="/member" element={<UserMemberPage />} />
          </Route>
        </Route>

        {/* Auth routes without UserLayout or AdminLayout */}
        <Route
          path="/login"
          element={!currentUser ? <Login /> : <Navigate to={userProfile?.role === 'admin' ? '/admin' : '/dashboard'} replace />}
        />
        <Route
          path="/register"
          element={!currentUser ? <Register /> : <Navigate to={userProfile?.role === 'admin' ? '/admin' : '/dashboard'} replace />}
        />

        {/* Admin Layout for all admin protected routes */}
        <Route element={<AdminRoute />}>
          <Route
            element={
              <AdminLayout>
                <Outlet />
              </AdminLayout>
            }
          >
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/admin/services" element={<ServiceManagement />} />
            <Route path="/admin/customers" element={<CustomerListPage />} />
            <Route path="/admin/hours" element={<HoursSettingsPage />} />
            <Route path="/admin/orders" element={<OrderManagementPage />} />
            <Route path="/admin/calendar" element={<CalendarPage />} />
            <Route path="/admin/settings" element={<SettingsPage />} />
            <Route path="/admin/portfolio" element={<PortfolioManagementPage />} />
            <Route path="/admin/promotions" element={<PromotionsPage />} />
          </Route>
        </Route>
      </Routes>
    </>
  );
}

function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

export default App;