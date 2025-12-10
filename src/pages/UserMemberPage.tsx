import MemberTabs from '../components/member/MemberTabs';
import LoyaltyCard from '../components/dashboard/LoyaltyCard';
import { useAuthStore } from '../store/authStore';
import { ArrowRightOnRectangleIcon, WrenchScrewdriverIcon } from '@heroicons/react/24/outline';
import { useNavigate } from 'react-router-dom';

const UserMemberPage = () => {
  const { logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="min-h-[calc(100vh-64px)] bg-[#FAF9F6] pb-24">
      {/* 1. Top Header Area with Actions */}
      <div className="px-6 pt-6 pb-4 flex justify-between items-center">
        <h1 className="text-2xl font-serif font-bold text-gray-900">會員中心</h1>
        <div className="flex gap-3">
            <button 
              onClick={() => navigate('/admin')}
              className="p-2 rounded-full bg-white border border-[#EFECE5] text-gray-600 hover:bg-[#9F9586] hover:text-white transition-colors"
              aria-label="Admin Dashboard"
            >
              <WrenchScrewdriverIcon className="w-5 h-5" />
            </button>
            <button 
              onClick={handleLogout}
              className="p-2 rounded-full bg-white border border-[#EFECE5] text-gray-600 hover:bg-red-50 hover:text-red-500 hover:border-red-200 transition-colors"
              aria-label="Logout"
            >
              <ArrowRightOnRectangleIcon className="w-5 h-5" />
            </button>
        </div>
      </div>

      <div className="px-4 sm:px-6 lg:px-8 space-y-6">
        {/* 2. Loyalty Card Section */}
        <section>
          <LoyaltyCard />
        </section>

        {/* 3. Main Content Tabs (History, Rewards, Pass) */}
        <section className="flex-1 min-h-0">
           <MemberTabs />
        </section>
      </div>
    </div>
  );
};

export default UserMemberPage;
