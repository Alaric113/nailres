import React from 'react';
import { Bars3Icon } from '@heroicons/react/24/outline';

interface AdminMobileHeaderProps {
  onMenuButtonClick: () => void;
  pageTitle: string; // Add pageTitle prop
}

const AdminMobileHeader: React.FC<AdminMobileHeaderProps> = ({ onMenuButtonClick, pageTitle }) => {
  return (
    <div className="sticky top-0 z-10 flex h-16 items-center gap-x-4 border-b border-gray-200 bg-white px-4 shadow-sm sm:gap-x-6 sm:px-6 lg:hidden">
      <button
        type="button"
        className="-m-2.5 p-2.5 text-gray-700 lg:hidden"
        onClick={onMenuButtonClick}
      >
        <span className="sr-only">開啟側邊欄</span>
        <Bars3Icon className="h-6 w-6" aria-hidden="true" />
      </button>

      {/* Page Title for Mobile */}
      <div className="flex-1 text-base font-semibold leading-6 text-gray-900">
        {pageTitle}
      </div>
    </div>
  );
};

export default AdminMobileHeader;
