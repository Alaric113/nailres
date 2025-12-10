import React, { useState, useCallback } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Sidebar from '../components/common/Sidebar';
import MainLayout from '../components/MainLayout';
import AnnouncementBanner from '../components/common/AnnouncementBanner';
import { useAuthStore } from '../store/authStore';

const UserLayout: React.FC = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const location = useLocation();
  const { currentUser } = useAuthStore();

  const toggleSidebar = useCallback(() => {
    setIsSidebarOpen(prev => !prev);
  }, []);

  const showAnnouncementBanner = location.pathname !== '/booking' && !currentUser;

  return (
    <>
      <Navbar onMenuClick={toggleSidebar} />
      {showAnnouncementBanner && <AnnouncementBanner />}
      <Sidebar isOpen={isSidebarOpen} onClose={toggleSidebar} />
      <MainLayout showAnnouncementBanner={showAnnouncementBanner}>
        <Outlet /> {/* Nested routes will render here */}
      </MainLayout>
    </>
  );
};

export default UserLayout;