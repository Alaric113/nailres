import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';

/**
 * A protected route component that only allows access to users with the 'admin' role.
 * If the user is not an admin, they are redirected to the home page.
 * It also handles the loading state, showing a message while auth state is being determined.
 */
const AdminRoute = () => {
  const { userProfile, isLoading } = useAuthStore();

  if (isLoading) {
    return <div>正在載入...</div>;
  }

  // Check if user is logged in and has the 'admin' role
  if (userProfile?.role === 'admin') {
    return <Outlet />; // Render the nested routes (e.g., AdminDashboard)
  }

  // Redirect to home page if not an admin
  return <Navigate to="/" replace />;
};

export default AdminRoute;