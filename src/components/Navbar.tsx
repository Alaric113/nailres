import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

import { Bars3Icon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';

interface NavbarProps {
  onMenuClick: () => void;
}

const Navbar: React.FC<NavbarProps> = ({ onMenuClick }) => {
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <nav
      className={`fixed top-0 left-0 right-0 h-16 md:h-[64px] flex items-center justify-between px-4 sm:px-6 lg:px-8 z-[9999] transition-all duration-300 ${isScrolled
        ? 'bg-secondary-light backdrop-blur-md shadow-soft border-b border-secondary-dark/50'
        : 'bg-secondary-light border-b border-secondary-dark'
        }`}
    >
      {/* Left: Menu Button */}
      <div className="flex-1 flex justify-start">
        <button
          onClick={onMenuClick}
          className="hidden md:block touch-target p-2 rounded-lg text-text-main hover:bg-secondary hover:text-primary-dark focus-ring transition-all tap-highlight-none"
          aria-label="開啟選單"
        >
          <Bars3Icon className="h-6 w-6" />
        </button>
      </div>

      {/* Center: Logo */}
      <div className="flex-1 flex justify-center">
        <Link
          to="/"
          className="text-xl sm:text-2xl font-bold tracking-wide text-primary font-serif hover:text-primary-dark focus-ring transition-all tap-highlight-none px-2 py-1 rounded-lg"
        >
          TREERING
        </Link>
      </div>

      {/* Right: Search Button */}
      <div className="flex-1 flex justify-end">
        <button
          // onClick={() => { /* 之後實作搜尋功能 */ }}
          className="hidden touch-target p-2 rounded-lg text-text-main hover:bg-secondary hover:text-primary-dark focus-ring transition-all tap-highlight-none"
          aria-label="搜尋"
        >
          <MagnifyingGlassIcon className="h-6 w-6 " />
        </button>
      </div>
    </nav>
  );
};

export default React.memo(Navbar);