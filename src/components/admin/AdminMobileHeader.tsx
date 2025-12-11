import React from 'react';

interface AdminMobileHeaderProps {
  pageTitle: string;
}

const AdminMobileHeader: React.FC<AdminMobileHeaderProps> = ({ pageTitle }) => {
  return (
    <div className="sticky top-0 z-10 flex h-16 items-center border-b border-gray-200 bg-white px-4 shadow-sm sm:px-6 lg:hidden justify-center">
      {/* Page Title for Mobile - Centered */}
      <div className="text-base font-semibold leading-6 text-gray-900">
        {pageTitle}
      </div>
    </div>
  );
};

export default AdminMobileHeader;