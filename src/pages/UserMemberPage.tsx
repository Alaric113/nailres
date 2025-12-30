import { useNavigate } from 'react-router-dom';
import { 
  ArrowRightOnRectangleIcon, 
  WrenchScrewdriverIcon,
  ArchiveBoxIcon, 
  TicketIcon,
} from '@heroicons/react/24/outline';
import { useAuthStore } from '../store/authStore';
import StackedCardDeck from '../components/dashboard/StackedCardDeck';
import LoyaltyCard from '../components/dashboard/LoyaltyCard';
import SeasonPassCard from '../components/dashboard/SeasonPassCard';
import { useEffect } from 'react';

const UserMemberPage = () => {
  const { logout, userProfile } = useAuthStore();
  const navigate = useNavigate();
  const activePasses = userProfile?.activePasses || [];

  // Lock body scroll for app-like experience
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const menuItems = [
    { 
      title: '我的預約', 
      subtitle: '查看過往服務紀錄',
      icon: ArchiveBoxIcon, 
      path: '/member/history',
      color: 'bg-[#FAF9F6] text-black/70'
    },
    { 
      title: '優惠與兌換', 
      subtitle: '查看優惠與點數',
      icon: TicketIcon, 
      path: '/member/coupons',
      color: 'bg-[#FAF9F6] text-black/70'
    },
    { 
      title: '季卡方案', 
      subtitle: '購買超值會員方案',
      icon: TicketIcon, 
      path: '/member/pass',
      color: 'bg-[#FAF9F6] text-black/70'
    },
  ];

  // Prepare card list
  const cards = [
      <LoyaltyCard key="loyalty" />,
      ...activePasses.map(pass => (
          <SeasonPassCard key={pass.passId} pass={pass} />
      ))
  ];

  return (
    <div className="h-full bg-[#FAF9F6] flex flex-col">
      {/* 1. Top Header Area with Actions */}
      <div className="px-6 pt-6 pb-4 flex justify-between items-center shrink-0">
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

      <div className="flex-1 flex flex-col px-4 sm:px-6 lg:px-8 space-y-6 overflow-hidden">
        {/* 2. Loyalty Card Section */}
        <section className="relative z-10 shrink-0"> {/* Ensure z-index context for cards */}
          <StackedCardDeck>
              {cards}
          </StackedCardDeck>
        </section>

        {/* 3. Function Menu */}
        <section className="space-y-3 shrink-0">
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
