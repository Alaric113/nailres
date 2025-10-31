import { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './hooks/useAuth'; // 確保 useAuth 在這裡被呼叫
import { useAuthStore } from './store/authStore';
import Navbar from './components/Navbar'; // 引入新的導覽列
import Sidebar from './components/common/Sidebar'; // 引入新的側邊選單
import MainLayout from './components/MainLayout'; // 引入新的佈局元件 (如果還需要的話)

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
  // This hook will run on app startup and handle auth state synchronization.
  const { isCheckingRedirect } = useAuth(); // 確保 useAuth 在這裡被呼叫
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const { currentUser, userProfile, authIsLoading } = useAuthStore();

  // While the initial auth state is being determined, OR we are processing a redirect,
  // show a global loading indicator. This is the key to preventing UI flashes and race conditions.
  if (authIsLoading || isCheckingRedirect) {
    console.log('[App Checkpoint 1] App is in loading state (authIsLoading: true).');
    return <LoadingSpinner size='lg' text='正在載入中...' fullScreen />;
  }

  return (
    // [App Checkpoint 2] App has finished loading (authIsLoading: false). Rendering routes.
    <Router>
      <Navbar onMenuClick={toggleSidebar} />
      <Sidebar isOpen={isSidebarOpen} onClose={toggleSidebar} />
      <PwaUpdatePrompt />
      <Routes> {/* 這裡的 MainLayout 可能需要根據新 Navbar/Sidebar 調整或移除 */}
        {/* Public Routes */}
        <Route path="/" element={<Home />} />

        {/* Redirect logged-in users from login/register to their dashboard */}
        <Route
          path="/login"
          element={
            !currentUser ? (
              <MainLayout>
                <Login />
              </MainLayout>
            ) : (
              <Navigate to={userProfile?.role === 'admin' ? '/admin' : '/dashboard'} replace />
            )
          }
        />
        <Route
          path="/register"
          element={
            !currentUser ? (
              <MainLayout>
                <Register />
              </MainLayout>
            ) : (
              <Navigate to={userProfile?.role === 'admin' ? '/admin' : '/dashboard'} replace />
            )
          }
        />

        {/* Protected Routes for regular users */}
        <Route element={<ProtectedRoute />}>
          <Route path="/dashboard" element={<MainLayout><Dashboard /></MainLayout>} />
          <Route path="/booking" element={<MainLayout><BookingPage /></MainLayout>} />
        </Route>

        {/* Protected Routes for admins */}
        <Route element={<AdminRoute />}>
          <Route path="/admin" element={<MainLayout><AdminDashboard /></MainLayout>} />
          <Route path="/admin/services" element={<MainLayout><ServiceManagement /></MainLayout>} />
          <Route path="/admin/customers" element={<MainLayout><CustomerListPage /></MainLayout>} />
          <Route path="/admin/hours" element={<MainLayout><HoursSettingsPage /></MainLayout>} />
          <Route path="/admin/orders" element={<MainLayout><OrderManagementPage /></MainLayout>} />
          <Route path="/admin/calendar" element={<MainLayout><CalendarPage /></MainLayout>} />
          <Route path="/admin/settings" element={<MainLayout><SettingsPage /></MainLayout>} />
          <Route path="/admin/promotions" element={<PromotionsPage />} />

        </Route>
      </Routes>
    </Router>
  );
}

export default App;