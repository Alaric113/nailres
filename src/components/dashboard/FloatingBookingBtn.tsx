import { Link } from 'react-router-dom';
import { PlusIcon } from '@heroicons/react/24/outline';

const FloatingBookingBtn = () => {
  return (
    <Link
      to="/booking"
      className="hidden md:flex fixed bottom-6 right-6 z-50 group items-center gap-2 bg-[#9F9586] text-white px-5 py-4 rounded-full shadow-xl hover:shadow-2xl hover:scale-105 hover:bg-[#8a8173] transition-all duration-300"
      aria-label="新增預約"
    >
      <PlusIcon className="w-6 h-6" />
      <span className="font-medium tracking-wide text-base">立即預約</span>
      
      {/* Ripple/Glow effect on hover */}
      <div className="absolute inset-0 rounded-full ring-2 ring-white/20 group-hover:ring-4 group-hover:ring-white/30 transition-all duration-500"></div>
    </Link>
  );
};

export default FloatingBookingBtn;
