import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './hooks/useAuth'; // 確保 useAuth 在這裡被呼叫
import { useAuthStore } from './store/authStore';

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

// Route Components
import ProtectedRoute from './components/ProtectedRoute';
import AdminRoute from './components/AdminRoute';

function App() {
  // This hook will run on app startup and handle auth state synchronization.
  useAuth(); // 確保 useAuth 在這裡被呼叫
  const { currentUser, userProfile, authIsLoading } = useAuthStore();

  // While the initial auth state is being determined, show a global loading indicator.
  if (authIsLoading) {
    console.log('[App Checkpoint 1] App is in loading state (authIsLoading: true).');
    return <div className="flex items-center justify-center h-screen">正在載入應用程式...</div>;
  }

  return (
    // [App Checkpoint 2] App has finished loading (authIsLoading: false). Rendering routes.
    <Router>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Home />} />

        {/* Redirect logged-in users from login/register to their dashboard */}
        <Route path="/login" element={!currentUser ? <Login /> : <Navigate to={userProfile?.role === 'admin' ? '/admin' : '/dashboard'} replace />} />
        <Route path="/register" element={!currentUser ? <Register /> : <Navigate to={userProfile?.role === 'admin' ? '/admin' : '/dashboard'} replace />} />

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
      
        </Route>
      </Routes>
    </Router>
  );
}

export default App;