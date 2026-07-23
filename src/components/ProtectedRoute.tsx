import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { isLiffBrowser } from '../lib/liff';

/**
 * A protected route component that only allows access to authenticated users.
 * If the user is not logged in, they are redirected to the login page.
 * Special handling for LIFF browsers: redirect to /liff for LINE auth.
 */
const ProtectedRoute = () => {
  const { currentUser, authIsLoading } = useAuthStore();
  const location = useLocation();

  if (authIsLoading) {
    // Auth is still loading - show a minimal skeleton instead of blocking
    console.log('[ProtectedRoute] Auth is loading. Showing skeleton...');
    return (
      <div className="min-h-screen bg-[#FAF9F6] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-[#9F9586] border-t-transparent rounded-full animate-spin"></div>
          <p className="text-[#9F9586] font-medium text-sm">驗證中...</p>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    console.log('[ProtectedRoute] User is not logged in.');
    
    // If in LIFF browser, redirect to LiffEntry for LINE auth (skip /login entirely)
    if (isLiffBrowser()) {
      const currentPath = location.pathname + location.search;
      const redirectParam = encodeURIComponent(currentPath);
      return <Navigate to={`/liff?redirect=${redirectParam}`} replace />;
    }
    
    return <Navigate to="/login" replace />;
  }

  console.log('[ProtectedRoute] User is logged in. Rendering protected content.');
  return <Outlet />;
};

export default ProtectedRoute;