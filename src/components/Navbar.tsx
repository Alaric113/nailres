import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

const Navbar = () => {
  const { currentUser, userProfile, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    // Navigate to home page after logout
    navigate('/');
  };

  return (
    <nav className="fixed top-0 left-0 right-0 h-[72px] flex items-center justify-between gap-4 px-4 sm:px-6 lg:px-8 bg-white/80 backdrop-saturate-150 backdrop-blur-lg border-b border-gray-200 z-50">
      <Link to="/" className="text-xl font-bold tracking-wide text-gray-800">
        TreeRing
      </Link>
      <div className="hidden md:flex items-center space-x-6">
        <a href="/#services" className="text-gray-600 hover:text-pink-500 transition-colors">
          服務項目
        </a>
        <a href="/#works" className="text-gray-600 hover:text-pink-500 transition-colors">
          作品集
        </a>
        <a href="/#contact" className="text-gray-600 hover:text-pink-500 transition-colors">
          聯絡我們
        </a>
      </div>
      <div className="flex items-center gap-2">
        {currentUser ? (
          <>
            {userProfile?.role === 'admin' && (
              <Link
                to="/admin"
                className=" sm:inline-block bg-gray-200 text-gray-700 font-bold rounded-full py-2 px-5 text-sm shadow-sm hover:bg-gray-300 transition-colors"
              >
                管理後台
              </Link>
            )}
            <button
              onClick={handleLogout}
              className="bg-gray-600 text-white font-bold rounded-full py-2 px-5 text-sm shadow-lg hover:bg-gray-700 transition-colors"
            >
              登出
            </button>
          </>
        ) : (
          <Link
            to="/login"
            className="bg-pink-500 text-white font-bold rounded-full py-2 px-5 text-sm shadow-lg hover:bg-pink-600 transition-transform transform hover:scale-105"
          >
            立即預約
          </Link>
        )}
      </div>
    </nav>
  );
};

export default Navbar;