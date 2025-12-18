import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import LandingPage from '../../pages/LandingPage';

const RootRedirect = () => {
  const { currentUser, userProfile } = useAuthStore();

  if (!currentUser) {
    return <LandingPage />;
  }

  const role = userProfile?.role || '';
  const isAdminOrStaff = ['admin', 'manager', 'designer'].includes(role);

  if (isAdminOrStaff) {
    return <Navigate to="/admin" replace />;
  }

  return <Navigate to="/dashboard" replace />;
};

export default RootRedirect;
