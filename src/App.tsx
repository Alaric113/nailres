import { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';
import { useAuthStore } from './store/authStore';

import Navbar from './components/Navbar'; // 引入新的導覽列
import Sidebar from './components/common/Sidebar'; // 引入新的側邊選單
import MainLayout from './components/MainLayout'; // 引入新的佈局元件 (如果還需要的話)
import AnnouncementBanner from './components/common/AnnouncementBanner';

// Public Page Components
import Home from './pages/Home';
import Login from './components/auth/Login';
import Register from './pages/Register';

// Page Components
import Dashboard from './pages/Dashboard';
import BookingPage from './pages/BookingPage';
import AdminDashboard from './pages/AdminDashboard';
import ServiceManagement from './pages/ServiceManagement';
import CustomerListPage from './pages/CustomerListPage';
import HoursSettingsPage from './pages/HoursSettingsPage';
import OrderManagementPage from './pages/OrderManagementPage';
import CalendarPage from './pages/CalendarPage';
import SettingsPage from './pages/SettingsPage';
import PromotionsPage from './pages/PromotionsPage';
import LoadingSpinner from './components/common/LoadingSpinner';

// Route Components
import ProtectedRoute from './components/ProtectedRoute';
import AdminRoute from './components/AdminRoute';
import PwaUpdatePrompt from './components/PwaUpdatePrompt';

function App() {
  const { isCheckingRedirect } = useAuth(); // 確保 useAuth 在這裡被呼叫
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const { currentUser, userProfile, authIsLoading } = useAuthStore();


  if (authIsLoading || isCheckingRedirect) {
    console.log('[App Checkpoint 1] App is in loading state (authIsLoading: true).');
    return <LoadingSpinner size='lg' text='正在載入中...' fullScreen />;
  }

  return (
    // [App Checkpoint 2] App has finished loading (authIsLoading: false). Rendering routes.
    <Router>
      <PwaUpdatePrompt />
      <Routes>
        {/* Public layout with Navbar */}
        <Route
          element={
            <>
              <Navbar onMenuClick={toggleSidebar} />
              <AnnouncementBanner />
              <Sidebar isOpen={isSidebarOpen} onClose={toggleSidebar} />
              {/* Outlet for public pages like Home */}
              <Outlet /> 
            </>
          }
        >
          <Route path="/" element={<Home />} />
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
              <AnnouncementBanner />
              <Sidebar isOpen={isSidebarOpen} onClose={toggleSidebar} />
              <MainLayout>
                <Outlet /> {/* Nested routes will render here */}
              </MainLayout>
            </>
          }
        >
          {/* Protected Routes for regular users */}
          <Route element={<ProtectedRoute />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/booking" element={<BookingPage />} />
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
          </Route>
        </Route>

        {/* Routes without the main layout, like PromotionsPage */}
        <Route element={<AdminRoute />}>
          <Route path="/admin/promotions" element={<PromotionsPage />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;