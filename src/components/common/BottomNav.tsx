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
import { useAuthStore } from '../../store/authStore';

const BottomNav = () => {
  const location = useLocation();
  const { currentUser } = useAuthStore();

  if (!currentUser) return null;

  const navItems = [
    { name: '預約', path: '/booking', icon: CalendarDaysIcon, activeIcon: CalendarDaysIconSolid },
    { name: '首頁', path: '/dashboard', icon: HomeIcon, activeIcon: HomeIconSolid },
    { name: '會員', path: '/member', icon: UserIcon, activeIcon: UserIconSolid }, 
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 z-fixed bg-white/95 backdrop-blur-lg border-t border-gray-100 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] lg:hidden">
      <div className="flex justify-around items-center px-2 py-3">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          
          const Icon = isActive ? item.activeIcon : item.icon;

          return (
            <Link
              key={item.name}
              to={item.path}
              className="relative flex flex-col items-center justify-center w-full h-full space-y-1 touch-target tap-highlight-none"
            >
              {isActive && (
                <motion.div
                  layoutId="bottomNavActive"
                  className="absolute top-1 w-12 h-8 bg-primary/10 rounded-full"
                  initial={false}
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                />
              )}
              
              <motion.div 
                className="relative z-10 p-1"
                animate={{ scale: isActive ? 1.1 : 1 }}
                transition={{ duration: 0.2 }}
              >
                <Icon className={`w-6 h-6 transition-colors duration-200 ${isActive ? 'text-primary' : 'text-gray-400'}`} />
              </motion.div>
              
              <span className={`text-[10px] font-medium transition-colors duration-200 ${isActive ? 'text-primary' : 'text-gray-400'}`}>
                {item.name}
              </span>
            </Link>
          );
        })}
      </div>
      {/* Safe area spacer for iPhone Home Indicator */}
      <div className="pb-safe-area" />
    </div>
  );
};

export default BottomNav;
