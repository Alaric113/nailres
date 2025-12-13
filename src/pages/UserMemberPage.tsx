import LoyaltyCard from '../components/dashboard/LoyaltyCard';
import { useAuthStore } from '../store/authStore';
import { 
  ArrowRightOnRectangleIcon, 
  WrenchScrewdriverIcon,
  ArchiveBoxIcon, 
  GiftIcon, 
  TicketIcon,
} from '@heroicons/react/24/outline';
import { useNavigate } from 'react-router-dom';

const UserMemberPage = () => {
  const { logout, userProfile } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const menuItems = [
    { 
      title: '歷史預約紀錄', 
      subtitle: '查看過往服務紀錄',
      icon: ArchiveBoxIcon, 
      path: '/member/history',
      color: 'bg-orange-50 text-orange-600'
    },
    { 
      title: '點數兌換專區', 
      subtitle: '使用點數兌換優惠',
      icon: GiftIcon, 
      path: '/member/rewards',
      color: 'bg-blue-50 text-blue-600'
    },
    { 
      title: '季卡/年卡方案', 
      subtitle: '購買超值會員方案',
      icon: TicketIcon, 
      path: '/member/pass',
      color: 'bg-green-50 text-green-600'
    },
  ];

  return (
    <div className="min-h-[calc(100vh-64px)] bg-[#FAF9F6] pb-24">
      {/* 1. Top Header Area with Actions */}
      <div className="px-6 pt-6 pb-4 flex justify-between items-center">
        <h1 className="text-2xl font-serif font-bold text-gray-900">會員中心</h1>
        <div className="flex gap-3">
            {['admin', 'manager', 'designer'].includes(userProfile?.role || '') && (
              <button 
                onClick={() => navigate('/admin')}
                className="p-2 rounded-full bg-white border border-[#EFECE5] text-gray-600 hover:bg-[#9F9586] hover:text-white transition-colors"
                aria-label="Admin Dashboard"
              >
                <WrenchScrewdriverIcon className="w-5 h-5" />
              </button>
            )}
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

        {/* 3. Function Menu */}
        <section className="space-y-3">
          <h2 className="text-lg font-bold text-gray-900 px-1">會員功能</h2>
          <div className="grid grid-cols-3 gap-3">
            {menuItems.map((item) => (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className="bg-white p-4 rounded-2xl border border-[#EFECE5] flex flex-col items-center justify-center gap-3 hover:shadow-md transition-all active:scale-[0.95] aspect-square"
              >
                <div className={`w-12 h-12 rounded-xl ${item.color} flex items-center justify-center`}>
                  <item.icon className="w-6 h-6" />
                </div>
                <div className="text-center">
                  <h3 className="font-bold text-gray-900 text-sm">{item.title}</h3>
                </div>
              </button>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
};

export default UserMemberPage;
