import { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';
import { useAuthStore } from './store/authStore';

import Navbar from './components/Navbar';
import Sidebar from './components/common/Sidebar';
import MainLayout from './components/MainLayout';
import AnnouncementBanner from './components/common/AnnouncementBanner';

// Public Page Components
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
import PortfolioManagementPage from './pages/PortfolioManagementPage';
import LoadingSpinner from './components/common/LoadingSpinner';

// Route Components
import ProtectedRoute from './components/ProtectedRoute';
import AdminRoute from './components/AdminRoute';
import PwaUpdatePrompt from './components/PwaUpdatePrompt';

function AppContent() {
  const { isCheckingRedirect } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const location = useLocation(); // Use useLocation hook

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const { currentUser, userProfile, authIsLoading } = useAuthStore();

  if (authIsLoading || isCheckingRedirect) {
    console.log('[App Checkpoint 1] App is in loading state (authIsLoading: true).');
    return <LoadingSpinner size='lg' text='正在載入中...' fullScreen />;
  }

  // Determine if the announcement banner should be shown
  const showAnnouncementBanner = location.pathname !== '/booking' && !currentUser;

  return (
    <>
      <PwaUpdatePrompt />
      <Routes>
        {/* Public layout with Navbar */}
        <Route
          element={
            <>
              <Navbar onMenuClick={toggleSidebar} />
              {showAnnouncementBanner && <AnnouncementBanner />}
              <Sidebar isOpen={isSidebarOpen} onClose={toggleSidebar} />
              {/* Outlet for public pages like Home */}
              <Outlet /> 
            </>
          }
        >
          <Route path="/" element={<Home />} />
          <Route path="/portfolio" element={<PortfolioGalleryPage />} />
        </Route>

        {/* Auth routes without Navbar */}
        <Route
          path="/login"
          element={!currentUser ? <Login /> : <Navigate to={userProfile?.role === 'admin' ? '/admin' : '/dashboard'} replace />}
        />
        <Route
          path="/register"
          element={!currentUser ? <Register /> : <Navigate to={userProfile?.role === 'admin' ? '/admin' : '/dashboard'} replace />}
        />

        {/* Main layout for protected routes */}
        <Route
          element={
            <>
              <Navbar onMenuClick={toggleSidebar} />
              {showAnnouncementBanner && <AnnouncementBanner />}
              <Sidebar isOpen={isSidebarOpen} onClose={toggleSidebar} />
              <MainLayout showAnnouncementBanner={showAnnouncementBanner}>
                <Outlet /> {/* Nested routes will render here */}
              </MainLayout>
            </>
          }
        >
          {/* Protected Routes for regular users */}
          <Route element={<ProtectedRoute />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/booking" element={<BookingPage />} />
            <Route path="/member" element={<UserMemberPage />} />
          </Route>

          {/* Protected Routes for admins */}
          <Route element={<AdminRoute />}>
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/admin/services" element={<ServiceManagement />} />
            <Route path="/admin/customers" element={<CustomerListPage />} />
            <Route path="/admin/hours" element={<HoursSettingsPage />} />
            <Route path="/admin/orders" element={<OrderManagementPage />} />
            <Route path="/admin/calendar" element={<CalendarPage />} />
            <Route path="/admin/settings" element={<SettingsPage />} />
            <Route path="/admin/portfolio" element={<PortfolioManagementPage />} />
          </Route>
        </Route>

        {/* Routes without the main layout, like PromotionsPage */}
        <Route element={<AdminRoute />}>
          <Route path="/admin/promotions" element={<PromotionsPage />} />
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