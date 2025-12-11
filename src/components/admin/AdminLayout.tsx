import React, { useMemo } from 'react';
import { Link, useLocation, Outlet, useMatches, useNavigate } from 'react-router-dom';
import {
  HomeIcon,
  CalendarDaysIcon,
  UserGroupIcon,
  CubeIcon,
  CurrencyDollarIcon,
  PhotoIcon,
  Cog6ToothIcon,
  ChartBarIcon,
  ClockIcon,
  TicketIcon
} from '@heroicons/react/24/outline';
import AdminMobileHeader from './AdminMobileHeader';
import AdminBottomNav from './AdminBottomNav';
import { useAuthStore } from '../../store/authStore';

interface AdminLayoutProps {}

const navigation = [
  { name: '總覽', href: '/admin', icon: HomeIcon },
  { name: '行事曆', href: '/admin/calendar', icon: CalendarDaysIcon },
  { name: '營業時間', href: '/admin/hours', icon: ClockIcon },
  { name: '訂單管理', href: '/admin/orders', icon: CurrencyDollarIcon },
  { name: '客戶管理', href: '/admin/customers', icon: UserGroupIcon },
  { name: '服務管理', href: '/admin/services', icon: CubeIcon },
  { name: '作品集管理', href: '/admin/portfolio', icon: PhotoIcon },
  { name: '優惠活動', href: '/admin/promotions', icon: TicketIcon },
  { name: '設定', href: '/admin/settings', icon: Cog6ToothIcon },
];

const AdminLayout: React.FC<AdminLayoutProps> = () => {
  const location = useLocation();
  const matches = useMatches();
  const navigate = useNavigate();
  const { userProfile } = useAuthStore();

  const filteredNavigation = useMemo(() => {
    if (userProfile?.role === 'admin') return navigation;
    if (userProfile?.role === 'designer') {
      // Hide Settings, Business Hours, Promotions for designers
      return navigation.filter(item => !['營業時間', '優惠活動', '設定'].includes(item.name));
    }
    return [];
  }, [userProfile]);

  const currentTitle = useMemo(() => {
    const lastMatch = matches[matches.length - 1];
    return (lastMatch?.handle as { title?: string })?.title || '管理後台';
  }, [matches]);

  // Logic to determine if we should show a back button
  const backAction = useMemo(() => {
    const path = location.pathname;
    const search = location.search;

    // List of paths that are considered "sub-settings" or deep pages reachable from Settings
    // For these, we want to go back to the main Settings dashboard
    const subSettingPaths = [
      '/admin/hours',
      '/admin/customers',
      '/admin/services',
      '/admin/portfolio',
      '/admin/promotions',
      '/admin/staff'
    ];

    if (subSettingPaths.includes(path)) {
      return () => navigate('/admin/settings');
    }

    // Special case for Settings sub-views (query params)
    if (path === '/admin/settings' && search.includes('view=')) {
      return () => navigate('/admin/settings'); // Clear query params
    }

    return undefined;
  }, [location.pathname, location.search, navigate]);

  return (
    <div className="flex h-screen bg-[#FAF9F6]">
      {/* Static sidebar for desktop */}
      <div className="hidden lg:flex lg:flex-shrink-0">
        <div className="flex w-64 flex-col">
          {/* Sidebar component */}
          <div className="flex flex-1 flex-col overflow-y-auto border-r border-gray-200 bg-white pt-5 pb-4">
            <div className="flex flex-shrink-0 items-center px-4">
              <ChartBarIcon className="h-8 w-8 text-[#9F9586]" />
              <span className="ml-3 text-xl font-serif font-bold text-gray-900">管理員後台</span>
            </div>
            <nav className="mt-5 flex-1 px-2 bg-white">
              <div className="space-y-1">
                {filteredNavigation.map((item) => (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={`
                      ${location.pathname === item.href
                        ? 'bg-[#EFECE5] text-[#9F9586]'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}
                      group flex items-center px-2 py-2 text-sm font-medium rounded-md
                    `}
                  >
                    <item.icon
                      className={`
                        ${location.pathname === item.href
                          ? 'text-[#9F9586]'
                          : 'text-gray-400 group-hover:text-gray-500'}
                        mr-3 flex-shrink-0 h-6 w-6
                      `}
                      aria-hidden="true"
                    />
                    {item.name}
                  </Link>
                ))}
              </div>
            </nav>
          </div>
        </div>
      </div>

      <div className="flex flex-1 flex-col">
        {/* Main Header (Mobile Only) */}
        <AdminMobileHeader pageTitle={currentTitle} onBack={backAction} />

        {/* Page Title Header (Desktop) */}
        <div className="hidden lg:block border-b border-gray-200 bg-white px-4 py-4 sm:px-6 lg:px-8">
          <h1 className="text-xl font-serif font-bold leading-7 text-gray-900">{currentTitle}</h1>
        </div>

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto focus:outline-none pb-[80px] lg:pb-0">
          <Outlet />
        </main>
        
        <AdminBottomNav />
      </div>
    </div>
  );
};

export default AdminLayout;
