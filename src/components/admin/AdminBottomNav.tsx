import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  HomeIcon,
  CalendarDaysIcon,
  CurrencyDollarIcon,
  Bars3Icon
} from '@heroicons/react/24/outline';
import {
  HomeIcon as HomeIconSolid,
  CalendarDaysIcon as CalendarDaysIconSolid,
  CurrencyDollarIcon as CurrencyDollarIconSolid,
  Bars3Icon as Bars3IconSolid
} from '@heroicons/react/24/solid';

interface AdminBottomNavProps {
  onMenuClick: () => void;
}

const AdminBottomNav: React.FC<AdminBottomNavProps> = ({ onMenuClick }) => {
  const location = useLocation();

  const navItems = [
    { 
      name: '總覽', 
      path: '/admin', 
      icon: HomeIcon, 
      activeIcon: HomeIconSolid,
      action: null 
    },
    { 
      name: '行事曆', 
      path: '/admin/calendar', 
      icon: CalendarDaysIcon, 
      activeIcon: CalendarDaysIconSolid,
      action: null
    },
    { 
      name: '訂單', 
      path: '/admin/orders', 
      icon: CurrencyDollarIcon, 
      activeIcon: CurrencyDollarIconSolid,
      action: null
    },
    { 
      name: '選單', 
      path: '#', 
      icon: Bars3Icon, 
      activeIcon: Bars3IconSolid,
      action: onMenuClick 
    },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-lg border-t border-gray-100 pb-safe-area shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] lg:hidden">
      <div className="flex justify-around items-center px-2 py-3">
        {navItems.map((item) => {
          // Check if active. For "Menu", it's never "active" route-wise, or handled differently.
          // For now, let's say Menu is never active or highlight if sidebar is open (but we don't have that state here easily without props).
          // Simpler: Just check path match.
          const isActive = item.path !== '#' && (
             location.pathname === item.path || 
             (item.path !== '/admin' && location.pathname.startsWith(item.path))
          );
          
          const Icon = isActive ? item.activeIcon : item.icon;

          return (
            <button
              key={item.name}
              onClick={(e) => {
                if (item.action) {
                  e.preventDefault();
                  item.action();
                }
              }}
              className="relative flex flex-col items-center justify-center w-full h-full space-y-1 bg-transparent border-none cursor-pointer"
            >
              {item.path !== '#' ? (
                  <Link 
                    to={item.path} 
                    className="absolute inset-0" 
                    aria-label={item.name}
                  />
              ) : null}

              {isActive && (
                <motion.div
                  layoutId="adminBottomNavActive"
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
            </button>
          );
        })}
      </div>
      {/* Safe area spacer for iPhone Home Indicator */}
      <div className="h-[env(safe-area-inset-bottom)]" />
    </div>
  );
};

export default AdminBottomNav;
