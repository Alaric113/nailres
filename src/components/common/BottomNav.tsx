import { Link, useLocation } from 'react-router-dom';
import { 
  HomeIcon, 
  CalendarDaysIcon, 
  UserIcon 
} from '@heroicons/react/24/outline';
import { 
  HomeIcon as HomeIconSolid, 
  CalendarDaysIcon as CalendarDaysIconSolid, 
  UserIcon as UserIconSolid 
} from '@heroicons/react/24/solid';
import { motion } from 'framer-motion';

const BottomNav = () => {
  const location = useLocation();

  const navItems = [
    { name: '預約', path: '/booking', icon: CalendarDaysIcon, activeIcon: CalendarDaysIconSolid },
    { name: '首頁', path: '/dashboard', icon: HomeIcon, activeIcon: HomeIconSolid },
    { name: '會員', path: '/member', icon: UserIcon, activeIcon: UserIconSolid }, 
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-lg border-t border-gray-100 pb-safe-area shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] md:hidden">
      <div className="flex justify-around items-center px-2 py-3">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          
          const Icon = isActive ? item.activeIcon : item.icon;

          return (
            <Link
              key={item.name}
              to={item.path}
              className="relative flex flex-col items-center justify-center w-full h-full space-y-1"
            >
              {isActive && (
                <motion.div
                  layoutId="bottomNavActive"
                  className="absolute top-1 w-12 h-8 bg-[#9F9586]/10 rounded-full"
                  initial={false}
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                />
              )}
              
              <div className="relative z-10 p-1">
                <Icon className={`w-6 h-6 transition-colors duration-200 ${isActive ? 'text-[#9F9586]' : 'text-gray-400'}`} />
              </div>
              
              <span className={`text-[10px] font-medium transition-colors duration-200 ${isActive ? 'text-[#9F9586]' : 'text-gray-400'}`}>
                {item.name}
              </span>
            </Link>
          );
        })}
      </div>
      {/* Safe area spacer for iPhone Home Indicator */}
      <div className="h-[env(safe-area-inset-bottom)]" />
    </div>
  );
};

export default BottomNav;
