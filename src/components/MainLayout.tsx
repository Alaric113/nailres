import React from 'react';
import BottomNav from './common/BottomNav';
import { useAuthStore } from '../store/authStore';

interface MainLayoutProps {
  children: React.ReactNode;
  showAnnouncementBanner?: boolean;
  isLiff?: boolean;
}

const MainLayout: React.FC<MainLayoutProps> = ({ children, showAnnouncementBanner = false, isLiff = false }) => {
  const { currentUser } = useAuthStore();

  // Navbar is 64px. Banner is 48px.
  // If LIFF, Navbar is hidden (0px).
  // If Banner shown, add 48px.
  
  let paddingTopClass = 'pt-[64px]'; // Default
  if (isLiff) {
      paddingTopClass = 'pt-0';
  }
  
  if (showAnnouncementBanner) {
      // If Banner is shown...
      // Normal: 64 + 48 = 112
      // LIFF: 0 + 48 = 48
      paddingTopClass = isLiff ? 'pt-[48px]' : 'pt-[112px]';
  }

  const topPadding = paddingTopClass;

  // Bottom padding only needed if user is logged in (BottomNav is visible)
  // On desktop (md:), pb-0 is always applied
  const bottomPaddingClass = currentUser ? 'pb-[80px]' : '';

  return (
    <>
      <main className={`${topPadding} ${bottomPaddingClass} md:pb-0`}>
        {children}
      </main>
      <BottomNav />
    </>
  );
};

export default MainLayout;
