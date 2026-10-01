import { Navigate, useLocation } from 'react-router-dom';
import { lazy } from 'react';
import { useAuthStore } from '../../store/authStore';
import LandingPage from '../../pages/LandingPage';
import { requiresLiffBootstrap } from '../../utils/liffRoute';

const LiffEntry = lazy(() => import('../../pages/liff/LiffEntry'));

const RootRedirect = () => {
  const { currentUser, userProfile } = useAuthStore();
  const location = useLocation();

  if (requiresLiffBootstrap(location.search, location.hash) || new URLSearchParams(location.search).has('redirect')) {
    return <LiffEntry />;
  }

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
