import { Link } from 'react-router-dom';

import { Bars3Icon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';

interface NavbarProps {
  onMenuClick: () => void;
}

const Navbar: React.FC<NavbarProps> = ({ onMenuClick }) => {
  

  return (
    <nav className="fixed top-0 left-0 right-0 h-[64px] flex items-center justify-between px-4 sm:px-6 lg:px-8 bg-white backdrop-saturate-150 backdrop-blur-lg border-b border-gray-200 z-50">
      {/* Left: Menu Button */}
      <div className="flex-1 flex justify-start">
        <button
          onClick={onMenuClick}
          className="p-2 rounded-md text-gray-700 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-pink-500"
          aria-label="Open menu"
        >
          <Bars3Icon className="h-6 w-6" />
        </button>
      </div>

      {/* Center: Logo */}
      <div className="flex-1 flex justify-center">
        <Link to="/" className="text-2xl font-extrabold tracking-wide text-gray-800"
        style={{ fontFamily: "'Noto Serif Display', serif", color: '#9F9586' }}>
          TREERING
        </Link>
      </div>

      {/* Right: Search Button */}
      <div className="flex-1 flex justify-end">
        <button
          // onClick={() => { /* 之後實作搜尋功能 */ }}
          className="p-2 rounded-md text-gray-700 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-pink-500"
          aria-label="Search"
        >
          <MagnifyingGlassIcon className="h-6 w-6" />
        </button>
      </div>
    </nav>
  );
};

export default Navbar;