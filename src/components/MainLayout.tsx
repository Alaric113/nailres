import React from 'react';
import BottomNav from './common/BottomNav';

interface MainLayoutProps {
  children: React.ReactNode;
  showAnnouncementBanner?: boolean;
}

const MainLayout: React.FC<MainLayoutProps> = ({ children, showAnnouncementBanner = false }) => {
  // Navbar is 64px. Banner is 48px.
  const topPadding = showAnnouncementBanner ? 'pt-[112px]' : 'pt-[64px]';

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
