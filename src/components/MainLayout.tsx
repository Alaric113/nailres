import React from 'react';
import BottomNav from './common/BottomNav';

interface MainLayoutProps {
  children: React.ReactNode;
  showAnnouncementBanner?: boolean;
  isLiff?: boolean;
}

const MainLayout: React.FC<MainLayoutProps> = ({ children, showAnnouncementBanner = false, isLiff = false }) => {
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

  return (
    <>
      <main className={`${topPadding} pb-[80px] md:pb-0`}>
        {children}
      </main>
      <BottomNav />
    </>
  );
};

export default MainLayout;
