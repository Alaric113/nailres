import { Link } from 'react-router-dom';

import { Bars3Icon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';

interface NavbarProps {
  onMenuClick: () => void;
}

const Navbar: React.FC<NavbarProps> = ({ onMenuClick }) => {

  console.log('Navbar: Rendering...');

  return (

    <nav className="fixed top-0 left-0 right-0 h-[64px] flex items-center justify-between px-4 sm:px-6 lg:px-8 bg-secondary-light border-b border-secondary-dark z-50 transition-colors duration-300">

      {/* Left: Menu Button */}
      <div className="flex-1 flex justify-start">
        <button
          onClick={onMenuClick}
          className="hidden md:block p-2 rounded-md text-text-main hover:bg-secondary hover:text-primary-dark focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary-light transition-colors"
          aria-label="Open menu"
        >
          <Bars3Icon className="h-6 w-6" />
        </button>
      </div>

      {/* Center: Logo */}
      <div className="flex-1 flex justify-center">
        <Link to="/" className="text-2xl font-bold tracking-wide text-primary font-serif hover:text-primary-dark transition-colors">
          TREERING
        </Link>
      </div>

      {/* Right: Search Button */}
      <div className="flex-1 flex justify-end">
        <button
          // onClick={() => { /* 之後實作搜尋功能 */ }}
          className="hidden md:block p-2 rounded-md text-text-main hover:bg-secondary hover:text-primary-dark focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary-light transition-colors"
          aria-label="Search"
        >
          <MagnifyingGlassIcon className="h-6 w-6" />
        </button>
      </div>
    </nav>
  );
};

export default Navbar;