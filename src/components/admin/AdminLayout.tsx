import React, { Fragment, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Dialog, Transition } from '@headlessui/react';
import { 
  Bars3Icon, 
  XMarkIcon,
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

interface AdminLayoutProps {
  children: React.ReactNode;
}

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

const AdminLayout: React.FC<AdminLayoutProps> = ({ children }) => {
  console.log('AdminLayout: Rendering...');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  return (
    <div className="flex h-screen bg-[#FAF9F6]">
      {/* Off-canvas menu for mobile */}
      <Transition.Root show={sidebarOpen} as={Fragment}>
        <Dialog as="div" className="relative z-40 lg:hidden" onClose={setSidebarOpen}>
          <Transition.Child
            as={Fragment}
            enter="transition-opacity ease-linear duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="transition-opacity ease-linear duration-300"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-gray-600 bg-opacity-75" />
          </Transition.Child>

          <div className="fixed inset-0 z-40 flex">
            <Transition.Child
              as={Fragment}
              enter="transition ease-in-out duration-300 transform"
              enterFrom="-translate-x-full"
              enterTo="translate-x-0"
              leave="transition ease-in-out duration-300 transform"
              leaveFrom="translate-x-0"
              leaveTo="-translate-x-full"
            >
              <Dialog.Panel className="relative flex w-full max-w-xs flex-1 flex-col bg-white focus:outline-none">
                <Transition.Child
                  as={Fragment}
                  enter="ease-in-out duration-300"
                  enterFrom="opacity-0"
                  enterTo="opacity-100"
                  leave="ease-in-out duration-300"
                  leaveFrom="opacity-100"
                  leaveTo="opacity-0"
                >
                  <div className="absolute top-0 right-0 -mr-12 pt-2">
                    <button
                      type="button"
                      className="ml-1 flex h-10 w-10 items-center justify-center rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
                      onClick={() => setSidebarOpen(false)}
                    >
                      <span className="sr-only">Close sidebar</span>
                      <XMarkIcon className="h-6 w-6 text-white" aria-hidden="true" />
                    </button>
                  </div>
                </Transition.Child>
                <div className="h-0 flex-1 overflow-y-auto pt-5 pb-4">
                  <div className="flex flex-shrink-0 items-center px-4">
                    <ChartBarIcon className="h-8 w-8 text-[#9F9586]" />
                    <span className="ml-3 text-xl font-serif font-bold text-gray-900">管理員後台</span>
                  </div>
                  <nav className="mt-5 px-2">
                    <div className="space-y-1">
                      {navigation.map((item) => (
                        <Link
                          key={item.name}
                          to={item.href}
                          className={`
                            ${location.pathname === item.href
                              ? 'bg-[#EFECE5] text-[#9F9586]'
                              : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}
                            group flex items-center px-2 py-2 text-base font-medium rounded-md
                          `}
                          onClick={() => setSidebarOpen(false)}
                        >
                          <item.icon
                            className={`
                              ${location.pathname === item.href
                                ? 'text-[#9F9586]'
                                : 'text-gray-400 group-hover:text-gray-500'}
                              mr-4 flex-shrink-0 h-6 w-6
                            `}
                            aria-hidden="true"
                          />
                          {item.name}
                        </Link>
                      ))}
                    </div>
                  </nav>
                </div>
              </Dialog.Panel>
            </Transition.Child>
            <div className="w-14 flex-shrink-0" aria-hidden="true">
              {/* Force sidebar to shrink to fit close button */}
            </div>
          </div>
        </Dialog>
      </Transition.Root>

      {/* Static sidebar for desktop */}
      <div className="hidden lg:flex lg:flex-shrink-0">
        <div className="flex w-64 flex-col">
          {/* Sidebar component, swap this element with another sidebar if you like */}
          <div className="flex flex-1 flex-col overflow-y-auto border-r border-gray-200 bg-white pt-5 pb-4">
            <div className="flex flex-shrink-0 items-center px-4">
              <ChartBarIcon className="h-8 w-8 text-[#9F9586]" />
              <span className="ml-3 text-xl font-serif font-bold text-gray-900">管理員後台</span>
            </div>
            <nav className="mt-5 flex-1 px-2 bg-white">
              <div className="space-y-1">
                {navigation.map((item) => (
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
        {/* Main Header */}
        <div className="sticky top-0 z-10 bg-white pl-1 pt-1 sm:pl-3 sm:pt-3 lg:hidden">
          <button
            type="button"
            className="-ml-0.5 flex h-12 w-12 items-center justify-center rounded-md text-gray-500 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-[#9F9586]"
            onClick={() => setSidebarOpen(true)}
          >
            <span className="sr-only">Open sidebar</span>
            <Bars3Icon className="h-6 w-6" aria-hidden="true" />
          </button>
        </div>

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto focus:outline-none">
          {children}
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;