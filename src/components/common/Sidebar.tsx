import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  XMarkIcon, 
  ArrowRightOnRectangleIcon, 
  Cog6ToothIcon, 
  ChevronDownIcon, 
  UserCircleIcon,
  HomeIcon,
  CalendarDaysIcon,
  PhotoIcon,
  UserGroupIcon,
  BuildingStorefrontIcon
} from '@heroicons/react/24/outline';
import { useAuthStore } from '../../store/authStore';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

interface MenuItem {
  label: string;
  icon?: React.ElementType;
  link?: string;
  subItems?: MenuItem[];
  isCategory?: boolean;
}

const menuItems: MenuItem[] = [
  {
    label: '首頁',
    link: '/dashboard',
    isCategory: false,
    icon: HomeIcon,
  },
  {
    label: '立即預約',
    isCategory: true,
    icon: CalendarDaysIcon,
    subItems: [
      { label: '所有服務', link: '/booking' },
      { label: '質感美甲 Nails', link: '/booking?category=美甲' },
      { label: '日式美睫 Eyelash', link: '/booking?category=美睫' },
      { label: '韓式紋繡 Brows', link: '/booking?category=紋繡' },
    ],
  },
  {
    label: '作品集 Portfolio',
    link: '/portfolio',
    isCategory: false,
    icon: PhotoIcon,
  },
  {
    label: '會員中心',
    isCategory: true,
    icon: UserGroupIcon,
    subItems: [
      { label: '會員首頁', link: '/member' },
      { label: '預約紀錄', link: '/member/history' },
      { label: '我的優惠券', link: '/member/coupons' },
      { label: '集點卡', link: '/member/rewards' },
    ],
  },
  {
    label: '店家資訊',
    link: '/store',
    isCategory: false,
    icon: BuildingStorefrontIcon,
  },
];

const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const { currentUser, userProfile, logout } = useAuthStore();
  const [expandedCategories, setExpandedCategories] = useState<Set<number>>(new Set([1, 3])); // Default expanded 'Book Now' and 'Member Center'

  const toggleCategory = (index: number) => {
    setExpandedCategories(prev => {
      const newSet = new Set(prev);
      if (newSet.has(index)) {
        newSet.delete(index);
      } else {
        newSet.add(index);
      }
      return newSet;
    });
  };

  const handleLogout = async () => {
    onClose();
    await logout();
  };

  // Safe checks for user data
  const displayName = userProfile?.profile?.displayName || currentUser?.displayName || '會員';
  const avatarUrl = userProfile?.profile?.avatarUrl || currentUser?.photoURL;

  return (
    <>
      {/* Overlay with smooth fade */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-[9999] transition-opacity duration-300 tap-highlight-none"
          onClick={onClose}
          aria-hidden="true"
        ></div>
      )}

      {/* Sidebar */}
      <div
        className={`fixed top-0 left-0 h-full w-[85vw] md:w-80 lg:w-[360px] bg-secondary-light shadow-strong z-[10000] transform transition-transform duration-300 ease-smooth flex flex-col ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        role="dialog"
        aria-label="導航選單"
      >
        {/* Header with user info */}
        <div className="flex-shrink-0 bg-secondary border-b border-secondary-dark">
          <div className="p-4">
            <div className="flex justify-between items-start mb-3">
              <h2 className="text-xl font-serif font-bold text-text-main">選單</h2>
              <button
                onClick={onClose}
                className="touch-target p-2 rounded-full text-text-light hover:bg-secondary-dark hover:text-primary-dark focus-ring transition-all tap-highlight-none active:scale-95"
                aria-label="關閉選單"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>
            
            {/* User greeting */}
            {currentUser && (
              <div className="flex items-center space-x-3 p-3 bg-secondary-light rounded-xl shadow-subtle border border-secondary-dark">
                {avatarUrl ? (
                  <img 
                    src={avatarUrl} 
                    alt={displayName} 
                    className='h-10 w-10 rounded-xl object-cover' 
                  />
                ) : (
                  <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                    <UserCircleIcon className="h-6 w-6 text-primary" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-text-main truncate">
                    {displayName}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Navigation */}
        <nav className="overflow-y-auto flex-grow custom-scrollbar bg-secondary-light">
          <ul className="p-4 space-y-1">
            {menuItems.map((item, index) => (
              <li key={index}>
                {item.isCategory ? (
                  <div>
                    <button
                      onClick={() => toggleCategory(index)}
                      className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-serif font-semibold text-text-main hover:bg-secondary transition-all group tap-highlight-none active:scale-[0.98]"
                      aria-expanded={expandedCategories.has(index)}
                    >
                      <span className="flex items-center tracking-wide">
                        {item.icon && (
                          <item.icon className="h-5 w-5 mr-3 text-text-light group-hover:text-primary transition-colors" />
                        )}
                        {item.label}
                      </span>
                      <ChevronDownIcon 
                        className={`h-4 w-4 text-text-light transition-transform duration-200 ${
                          expandedCategories.has(index) ? 'transform rotate-180' : ''
                        }`}
                      />
                    </button>
                    
                    {/* Collapsible submenu with improved animation */}
                    <div
                      className={`overflow-hidden transition-all duration-300 ease-smooth ${
                        expandedCategories.has(index) 
                          ? 'max-h-96 opacity-100 mt-1' 
                          : 'max-h-0 opacity-0'
                      }`}
                    >
                      <ul className="ml-3 space-y-0.5 border-l-2 border-primary/30">
                        {item.subItems?.map((subItem, subIndex) => (
                          <li key={subIndex}>
                            <Link
                              to={subItem.link || '#'}
                              onClick={onClose}
                              className="block pl-4 pr-3 py-2 rounded-r-lg text-sm text-text-light hover:bg-secondary hover:text-primary-dark hover:border-l-2 hover:border-primary transition-all tap-highlight-none active:bg-secondary-dark"
                            >
                              {subItem.label}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                ) : (
                  <Link
                    to={item.link || '#'}
                    onClick={onClose}
                    className="flex items-center px-3 py-2.5 rounded-lg text-text-main hover:bg-secondary hover:text-primary-dark transition-all group tap-highlight-none active:bg-secondary-dark"
                  >
                    {item.icon && (
                      <item.icon className="h-5 w-5 mr-3 text-text-light group-hover:text-primary transition-colors" />
                    )}
                    <span className="font-medium">{item.label}</span>
                  </Link>
                )}
              </li>
            ))}
          </ul>
        </nav>

        {/* Footer actions */}
        {currentUser && (
          <div className="flex-shrink-0 p-4 border-t border-secondary-dark bg-secondary">
            <div className="space-y-2">
              {userProfile?.role === 'admin' && (
                <Link
                  to="/admin"
                  onClick={onClose}
                  className="flex items-center justify-center px-4 py-2.5 rounded-xl text-white bg-primary hover:bg-primary-dark shadow-soft hover:shadow-medium transition-all tap-highlight-none active:scale-95"
                >
                  <Cog6ToothIcon className="h-5 w-5 mr-2" />
                  <span className="font-medium">管理後臺</span>
                </Link>
              )}
              <button
                onClick={handleLogout}
                className="w-full flex items-center justify-center px-4 py-2.5 rounded-xl text-text-main bg-white border border-secondary-dark hover:bg-secondary-light transition-all tap-highlight-none active:scale-95"
              >
                <ArrowRightOnRectangleIcon className="h-5 w-5 mr-2" />
                <span className="font-medium">登出</span>
              </button>
            </div>
          </div>
        )}

        {/* Guest CTA */}
        {!currentUser && (
          <div className="flex-shrink-0 p-4 border-t border-secondary-dark bg-secondary">
            <div className="text-center mb-3">
              <p className="text-sm text-text-main mb-1 font-serif">還不是會員嗎？</p>
              <p className="text-xs text-text-light">立即註冊享受專屬優惠</p>
            </div>
            <div className="space-y-2">
              <Link
                to="/login"
                onClick={onClose}
                className="block w-full px-4 py-2.5 rounded-xl text-center text-white bg-primary hover:bg-primary-dark shadow-soft hover:shadow-medium transition-all font-medium tracking-wide tap-highlight-none active:scale-95"
              >
                登入
              </Link>
              <Link
                to="/register"
                onClick={onClose}
                className="block w-full px-4 py-2.5 rounded-xl text-center text-primary-dark bg-white border border-primary hover:bg-secondary-light transition-all font-medium tap-highlight-none active:scale-95"
              >
                註冊新帳號
              </Link>
            </div>
          </div>
        )}
      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #EFECE5; /* secondary-light */
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #DCD8CF; /* secondary-dark */
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #B7AD9E; /* primary-light */
        }
      `}</style>
    </>
  );
};

export default Sidebar;