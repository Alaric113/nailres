import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';
import { useAuthStore } from './store/authStore';

// Pages & Components
import Login from './components/auth/Login';
import Register from './components/auth/Register';
import Dashboard from './pages/Dashboard';
import LoadingSpinner from './components/common/LoadingSpinner';
import BookingPage from './pages/BookingPage';
import BookingHistoryPage from './pages/BookingHistoryPage';

/**
 * A component to protect routes that require authentication.
 * If the user is not logged in, they are redirected to the login page.
 */
const ProtectedRoutes = () => {
  const user = useAuthStore((state) => state.user);
  return user ? <Outlet /> : <Navigate to="/login" replace />;
};

/**
 * A component for public routes like login/register.
 * If the user is already logged in, they are redirected to the dashboard.
 */
const PublicRoutes = () => {
  const user = useAuthStore((state) => state.user);
  return !user ? <Outlet /> : <Navigate to="/" replace />;
};

function App() {
  // This custom hook synchronizes Firebase auth state with our Zustand store.
  // It should be called once at the top level of the app.
  useAuth();

  const isLoading = useAuthStore((state) => state.isLoading);

  // While Firebase is initializing and checking the auth state, show a loading spinner.
  if (isLoading) {
    return <LoadingSpinner />;
  }

  return (
    <BrowserRouter>
      <Routes>
        {/* Public routes (Login, Register) */}
        <Route element={<PublicRoutes />}>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
        </Route>

        {/* Protected routes (Dashboard, etc.) */}
        <Route element={<ProtectedRoutes />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/booking" element={<BookingPage />} />
          <Route path="/history" element={<BookingHistoryPage />} />
        </Route>

        {/* Fallback route */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;