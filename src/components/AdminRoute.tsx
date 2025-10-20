import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

/**
 * A protected route component that only allows access to users with the 'admin' role.
 * If the user is not an admin, they are redirected to the home page.
 * It also handles the loading state, showing a message while auth state is being determined.
 */
const AdminRoute = () => {
  const { userProfile, authIsLoading } = useAuthStore();
  
  if (authIsLoading) {
    console.log('[AdminRoute] Auth is loading. Waiting...');
    return <div>正在載入...</div>;
  }

  // Check if user is logged in and has the 'admin' role
  if (userProfile?.role === 'admin') {
    console.log('[AdminRoute] User is an admin. Rendering admin content.');
    return <Outlet />; // Render the nested routes (e.g., AdminDashboard)
  }

  // Redirect to home page if not an admin
  console.log(`[AdminRoute] User is not an admin (role: ${userProfile?.role}). Redirecting to /.`);
  return <Navigate to="/" replace />;
};

export default AdminRoute;