import React from 'react';
import { Link } from 'react-router-dom';
import { HomeIcon, MagnifyingGlassIcon, XMarkIcon } from '@heroicons/react/24/outline';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

interface MenuItem {
  label: string;
  icon?: React.ElementType; // For Heroicons
  link?: string;
  subItems?: MenuItem[];
  isCategory?: boolean; // To differentiate categories from regular links
}

const menuItems: MenuItem[] = [
  { label: '關鍵字搜尋', icon: MagnifyingGlassIcon, link: '#' },
  { label: '首頁', icon: HomeIcon, link: '/' },
  {
    label: '💫 NEW & POPULAR',
    isCategory: true,
    subItems: [
      { label: '新品上市', link: '#' },
      { label: '熱門預約款', link: '#' },
      { label: '約會必勝款', link: '#' },
    ],
  },
  {
    label: 'Treering服務項目',
    isCategory: true,
    subItems: [
      { label: '日式美睫Eyelash', link: '/booking?category=美睫' },
      { label: '韓式霧眉 Misty Brows', link: '/booking?category=霧眉' },
      { label: '質感美甲 Aesthetic Nails', link: '/booking?category=美甲' },
    ],
  },
  {
    label: 'PORTFOLIO 作品集',
    isCategory: true,
    subItems: [
      { label: 'Before & After', link: '#' },
      { label: '風格特輯Style Look', link: '#' },
      { label: '客人回饋 Real Reviews', link: '#' },
    ],
  },
  {
    label: 'ABOUT 關於我們',
    isCategory: true,
    subItems: [
      { label: '品牌故事', link: '#' },
      { label: '設計師介紹', link: '#' },
      { label: '工作室環境', link: '#' },
    ],
  },
  {
    label: 'INFO 預約資訊',
    isCategory: true,
    subItems: [
      { label: '預約須知', link: '#' },
      { label: '價目表', link: '#' },
      { label: '常見問題 Q&A', link: '#' },
    ],
  },
  {
    label: '🔔NEWS 活動與公告',
    isCategory: true,
    subItems: [
      { label: '限時優惠', link: '#' },
      { label: '來店禮活動', link: '#' },
      { label: '抽獎／節慶企劃', link: '#' },
    ],
  },
  {
    label: 'CONTACT 聯絡我們',
    isCategory: true,
    subItems: [
      { label: '預約連結（Line / IG ）', link: '#' },
      { label: '工作室地點與交通', link: '#' },
    ],
  },
];

const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity duration-300"
          onClick={onClose}
        ></div>
      )}

      {/* Sidebar */}
      <div
        className={`fixed top-0 left-0 h-full w-64 bg-white shadow-lg z-50 transform transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="p-4 border-b flex justify-between items-center">
          <h2 className="text-xl font-bold text-gray-800">選單</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-md text-gray-700 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-pink-500"
            aria-label="Close menu"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>
        <nav className="p-4 overflow-y-auto h-[calc(100%-64px)]"> {/* Adjust height for header */}
          <ul className="space-y-2">
            {menuItems.map((item, index) => (
              <li key={index}>
                {item.isCategory ? (
                  <>
                    <h3 className="text-sm font-semibold text-gray-500 uppercase mt-4 mb-2">{item.label}</h3>
                    <ul className="ml-4 space-y-1">
                      {item.subItems?.map((subItem, subIndex) => (
                        <li key={subIndex}>
                          <Link
                            to={subItem.link || '#'}
                            onClick={onClose}
                            className="block px-3 py-2 rounded-md text-gray-700 hover:bg-pink-50 hover:text-pink-600 transition-colors"
                          >
                            {subItem.label}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </>
                ) : (
                  <Link
                    to={item.link || '#'}
                    onClick={onClose}
                    className="flex items-center px-3 py-2 rounded-md text-gray-800 hover:bg-pink-50 hover:text-pink-600 transition-colors"
                  >
                    {item.icon && <item.icon className="h-5 w-5 mr-3" />}
                    {item.label}
                  </Link>
                )}
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </>
  );
};

export default Sidebar;