import React from 'react';

interface MainLayoutProps {
  children: React.ReactNode;
}

const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  // This adds top padding equal to the navbar's height (72px)
  return <main className="pt-[72px]">{children}</main>;
};

export default MainLayout;