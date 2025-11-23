import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { XMarkIcon, ArrowRightOnRectangleIcon, Cog6ToothIcon, ChevronDownIcon } from '@heroicons/react/24/outline';
import { useAuthStore } from '../../store/authStore';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

interface MenuItem {
  label: string;
  icon?: React.ElementType;
  link?: string;
  subItems?: MenuItem[];
  isCategory?: boolean;
}

const menuItems: MenuItem[] = [
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
      { label: '所有作品集', link: '/portfolio' },
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
  const { currentUser, userProfile, logout } = useAuthStore();
  const [expandedCategories, setExpandedCategories] = useState<Set<number>>(new Set([0, 1, 2])); // 預設展開前三個分類

  const toggleCategory = (index: number) => {
    setExpandedCategories(prev => {
      const newSet = new Set(prev);
      if (newSet.has(index)) {
        newSet.delete(index);
      } else {
        newSet.add(index);
      }
      return newSet;
    });
  };

  const handleLogout = async () => {
    onClose();
    await logout();
  };

  return (
    <>
      {/* Overlay with smooth fade */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity duration-300"
          onClick={onClose}
          aria-hidden="true"
        ></div>
      )}

      {/* Sidebar */}
      <div
        className={`fixed top-0 left-0 h-full w-80 bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-in-out flex flex-col ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        role="dialog"
        aria-label="Navigation menu"
      >
        {/* Header with user info */}
        <div className="flex-shrink-0 bg-gradient-to-r from-pink-50 to-purple-50">
          <div className="p-4 border-b border-pink-100">
            <div className="flex justify-between items-start mb-3">
              <h2 className="text-xl font-bold text-gray-800">選單</h2>
              <button
                onClick={onClose}
                className="p-2 rounded-full text-gray-600 hover:bg-white hover:text-pink-600 focus:outline-none focus:ring-2 focus:ring-pink-500 transition-all"
                aria-label="關閉選單"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>
            
            {/* User greeting */}
            {currentUser && userProfile && (
              <div className="flex items-center space-x-3 p-3 bg-white rounded-lg shadow-sm">
                <img src={currentUser.photoURL||'https://firebasestorage.googleapis.com/v'} alt="" className='h-10 w-10 rounded-xl' />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {currentUser.displayName|| '會員'}
                  </p>
                  
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Navigation */}
        <nav className="overflow-y-auto flex-grow custom-scrollbar">
          <ul className="p-4 space-y-1">
            {menuItems.map((item, index) => (
              <li key={index}>
                {item.isCategory ? (
                  <div>
                    <button
                      onClick={() => toggleCategory(index)}
                      className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-semibold text-gray-700 hover:bg-pink-50 transition-all group"
                      aria-expanded={expandedCategories.has(index)}
                    >
                      <span className="flex items-center">
                        {item.label}
                      </span>
                      <ChevronDownIcon 
                        className={`h-4 w-4 text-gray-400 transition-transform duration-200 ${
                          expandedCategories.has(index) ? 'transform rotate-180' : ''
                        }`}
                      />
                    </button>
                    
                    {/* Collapsible submenu */}
                    <div
                      className={`overflow-hidden transition-all duration-300 ease-in-out ${
                        expandedCategories.has(index) 
                          ? 'max-h-96 opacity-100 mt-1' 
                          : 'max-h-0 opacity-0'
                      }`}
                    >
                      <ul className="ml-3 space-y-0.5 border-l-2 border-pink-100">
                        {item.subItems?.map((subItem, subIndex) => (
                          <li key={subIndex}>
                            <Link
                              to={subItem.link || '#'}
                              onClick={onClose}
                              className="block pl-4 pr-3 py-2 rounded-r-lg text-sm text-gray-600 hover:bg-pink-50 hover:text-pink-600 hover:border-l-pink-500 transition-all"
                            >
                              {subItem.label}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                ) : (
                  <Link
                    to={item.link || '#'}
                    onClick={onClose}
                    className="flex items-center px-3 py-2.5 rounded-lg text-gray-800 hover:bg-pink-50 hover:text-pink-600 transition-all group"
                  >
                    {item.icon && (
                      <item.icon className="h-5 w-5 mr-3 text-gray-400 group-hover:text-pink-500 transition-colors" />
                    )}
                    <span className="font-medium">{item.label}</span>
                  </Link>
                )}
              </li>
            ))}
          </ul>
        </nav>

        {/* Footer actions */}
        {currentUser && (
          <div className="flex-shrink-0 p-4 border-t border-gray-200 bg-gray-50">
            <div className="space-y-2">
              {userProfile?.role === 'admin' && (
                <Link
                  to="/admin"
                  onClick={onClose}
                  className="flex items-center justify-center px-4 py-2.5 rounded-lg text-white bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 shadow-md hover:shadow-lg transition-all transform hover:scale-[1.02]"
                >
                  <Cog6ToothIcon className="h-5 w-5 mr-2" />
                  <span className="font-medium">管理後臺</span>
                </Link>
              )}
              <button
                onClick={handleLogout}
                className="w-full flex items-center justify-center px-4 py-2.5 rounded-lg text-gray-700 bg-white border border-gray-300 hover:bg-gray-100 hover:border-gray-400 transition-all transform hover:scale-[1.02]"
              >
                <ArrowRightOnRectangleIcon className="h-5 w-5 mr-2" />
                <span className="font-medium">登出</span>
              </button>
            </div>
          </div>
        )}

        {/* Guest CTA */}
        {!currentUser && (
          <div className="flex-shrink-0 p-4 border-t border-gray-200 bg-gradient-to-r from-pink-50 to-purple-50">
            <div className="text-center mb-3">
              <p className="text-sm text-gray-600 mb-1">還不是會員嗎？</p>
              <p className="text-xs text-gray-500">立即註冊享受專屬優惠</p>
            </div>
            <div className="space-y-2">
              <Link
                to="/login"
                onClick={onClose}
                className="block w-full px-4 py-2.5 rounded-lg text-center text-white bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 shadow-md hover:shadow-lg transition-all transform hover:scale-[1.02] font-medium"
              >
                登入
              </Link>
              <Link
                to="/register"
                onClick={onClose}
                className="block w-full px-4 py-2.5 rounded-lg text-center text-pink-600 bg-white border border-pink-300 hover:bg-pink-50 hover:border-pink-400 transition-all transform hover:scale-[1.02] font-medium"
              >
                註冊新帳號
              </Link>
            </div>
          </div>
        )}
      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #f9fafb;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #e5e7eb;
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #d1d5db;
        }
      `}</style>
    </>
  );
};

export default Sidebar;