import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuthStore } from '../../store/authStore';
import {
  HomeIcon,
  CalendarDaysIcon,
  CurrencyDollarIcon,
  Cog6ToothIcon,
  ArrowUturnLeftIcon
} from '@heroicons/react/24/outline';
import {
  HomeIcon as HomeIconSolid,
  CalendarDaysIcon as CalendarDaysIconSolid,
  CurrencyDollarIcon as CurrencyDollarIconSolid,
  Cog6ToothIcon as Cog6ToothIconSolid,
  ArrowUturnLeftIcon as ArrowUturnLeftIconSolid
} from '@heroicons/react/24/solid';

interface AdminBottomNavProps {
  onMenuClick?: () => void;
}

const AdminBottomNav: React.FC<AdminBottomNavProps> = () => {
  const location = useLocation();
  const { userProfile } = useAuthStore();

  const allNavItems = [
    { 
      name: '前台', 
      path: '/dashboard', 
      icon: ArrowUturnLeftIcon, 
      activeIcon: ArrowUturnLeftIconSolid,
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
      name: '首頁', 
      path: '/admin', 
      icon: HomeIcon, 
      activeIcon: HomeIconSolid,
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
      name: '設定', 
      path: '/admin/settings', 
      icon: Cog6ToothIcon, 
      activeIcon: Cog6ToothIconSolid,
      action: null 
    },
  ];

  const navItems = allNavItems.filter(_ => {
    // Admin and Manager see everything
    if (userProfile?.role === 'admin' || userProfile?.role === 'manager') return true;

    // Designer role restrictions
    if (userProfile?.role === 'designer') {
      // Designers should see: 前台, 行事曆, 首頁, 訂單, 設定
      // SettingsPage handles its own filtering, so we allow access.
      return true;
    }
    return false; // For other roles, hide all admin nav.
  });

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-lg border-t border-gray-100 pb-safe-area shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] lg:hidden">
      <div className="flex justify-around items-center px-2 py-3">
        {navItems.map((item) => {
          let isActive = false;
          if (item.path === '/') {
             isActive = location.pathname === '/';
          } else if (item.path === '/admin') {
             isActive = location.pathname === '/admin';
          } else {
             isActive = location.pathname.startsWith(item.path);
          }
          
          const Icon = isActive ? item.activeIcon : item.icon;

          // Long press logic for Settings
          const isSettings = item.name === '設定';
          const handleTouchStart = (e: React.TouchEvent | React.MouseEvent) => {
             if (!isSettings) return;
             // e.preventDefault(); // Don't prevent default immediately allows click
             const timer = setTimeout(() => {
                 if (window.confirm('是否要在背景強制重新整理網頁？')) {
                     window.location.reload();
                 }
             }, 1000); // 1 second long press
             (window as any)._longPressTimer = timer;
          };

          const handleTouchEnd = () => {
              if (!isSettings) return;
              if ((window as any)._longPressTimer) {
                  clearTimeout((window as any)._longPressTimer);
                  (window as any)._longPressTimer = null;
              }
          };

          return (
            <Link
              key={item.name}
              to={item.path}
              className="relative flex flex-col items-center justify-center w-full h-full space-y-1 select-none"
              onTouchStart={handleTouchStart}
              onTouchEnd={handleTouchEnd}
              onMouseDown={handleTouchStart}
              onMouseUp={handleTouchEnd}
              onMouseLeave={handleTouchEnd}
            >
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
            </Link>
          );
        })}
      </div>
      {/* Safe area spacer for iPhone Home Indicator */}
      <div className="h-[env(safe-area-inset-bottom)]" />
    </div>
  );
};

export default AdminBottomNav;
