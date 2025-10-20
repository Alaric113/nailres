import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

/**
 * A protected route component that only allows access to authenticated users.
 * If the user is not logged in, they are redirected to the login page.
 * It also handles the loading state, showing a message while auth state is being determined.
 */
const ProtectedRoute = () => {
  const { currentUser, authIsLoading } = useAuthStore();

  if (authIsLoading) {
    console.log('[ProtectedRoute] Auth is loading. Waiting...');
    return <div>正在驗證使用者身份...</div>;
  }

  if (!currentUser) {
    console.log('[ProtectedRoute] User is not logged in. Redirecting to /login.');
    return <Navigate to="/login" replace />;
  }

  console.log('[ProtectedRoute] User is logged in. Rendering protected content.');
  return <Outlet />; // Render the nested routes (e.g., Dashboard, BookingPage)
};

export default ProtectedRoute;