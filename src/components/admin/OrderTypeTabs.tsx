
import { Link, useLocation } from 'react-router-dom';

const OrderTypeTabs = () => {
  const location = useLocation();
  const path = location.pathname;

  const tabs = [
    { name: '預約訂單', href: '/admin/orders', active: path === '/admin/orders' },
    { name: '季卡訂單', href: '/admin/orders-pass', active: path === '/admin/orders-pass' },
  ];

  return (
    <div className="flex space-x-1 rounded-xl bg-gray-100 p-1 mb-3">
      {tabs.map((tab) => (
        <Link
          key={tab.name}
          to={tab.href}
          className={`
            w-full rounded-lg py-2.5 text-sm font-bold leading-5 text-center transition-all
            ${
              tab.active
                ? 'bg-white text-[#9F9586] shadow'
                : 'text-gray-500 hover:bg-white/[0.12] hover:text-gray-600'
            }
          `}
        >
          {tab.name}
        </Link>
      ))}
    </div>
  );
};

export default OrderTypeTabs;
