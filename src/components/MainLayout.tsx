import React from 'react';

interface MainLayoutProps {
  children: React.ReactNode;
}

const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  // pt-[112px] = Navbar(64px) + Banner(48px)
  return <main className="pt-[112px]">{children}</main>;
};

export default MainLayout;