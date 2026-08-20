import { Link, useLocation } from 'react-router-dom';
import { CalendarDays, CreditCard } from 'lucide-react';

const OrderTypeTabs = () => {
  const location = useLocation();
  const path = location.pathname;

  const tabs = [
    { name: '預約訂單', href: '/admin/orders', active: path === '/admin/orders', icon: CalendarDays },
    { name: '季卡訂單', href: '/admin/orders-pass', active: path === '/admin/orders-pass', icon: CreditCard },
  ];

  return (
    <div className="inline-flex bg-[#EFECE5]/80 p-1.5 rounded-2xl gap-1 shadow-subtle w-full sm:w-auto">
      {tabs.map((tab) => (
        <Link
          key={tab.name}
          to={tab.href}
          className={`
            flex-1 sm:flex-initial px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold text-center transition-all duration-200 flex items-center justify-center gap-2
            ${
              tab.active
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-900 hover:bg-white/50'
            }
          `}
        >
          <tab.icon className={`w-4 h-4 ${tab.active ? 'text-[#9F9586]' : 'text-gray-400'}`} />
          <span>{tab.name}</span>
        </Link>
      ))}
    </div>
  );
};

export default OrderTypeTabs;
