import React from 'react';
import { ChevronLeftIcon } from '@heroicons/react/24/outline';

interface AdminMobileHeaderProps {
  pageTitle: string;
  onBack?: () => void;
}

const AdminMobileHeader: React.FC<AdminMobileHeaderProps> = ({ pageTitle, onBack }) => {
  return (
    <div className="sticky top-0 z-10 flex h-16 items-center border-b border-gray-200 bg-white px-4 shadow-sm sm:px-6 lg:hidden relative">
      {/* Back Button (Absolute Left) */}
      {onBack && (
        <button 
          onClick={onBack}
          className="absolute left-4 p-2 -ml-2 text-gray-500 hover:text-gray-900"
          aria-label="Go back"
        >
          <ChevronLeftIcon className="h-6 w-6" />
        </button>
      )}

      {/* Page Title for Mobile - Centered */}
      <div className="flex-1 text-center text-base font-semibold leading-6 text-gray-900">
        {pageTitle}
      </div>
    </div>
  );
};

export default AdminMobileHeader;
