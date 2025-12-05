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
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 transition-opacity duration-300"
          onClick={onClose}
          aria-hidden="true"
        ></div>
      )}

      {/* Sidebar */}
      <div
        className={`fixed top-0 left-0 h-full w-80 bg-secondary-light shadow-2xl z-50 transform transition-transform duration-300 ease-in-out flex flex-col ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        role="dialog"
        aria-label="Navigation menu"
      >
        {/* Header with user info */}
        <div className="flex-shrink-0 bg-secondary border-b border-secondary-dark">
          <div className="p-4">
            <div className="flex justify-between items-start mb-3">
              <h2 className="text-xl font-serif font-bold text-text-main">選單</h2>
              <button
                onClick={onClose}
                className="p-2 rounded-full text-text-light hover:bg-secondary-dark hover:text-primary-dark focus:outline-none focus:ring-2 focus:ring-primary transition-all"
                aria-label="關閉選單"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>
            
            {/* User greeting */}
            {currentUser && userProfile && (
              <div className="flex items-center space-x-3 p-3 bg-secondary-light rounded-lg shadow-sm border border-secondary-dark">
                <img src={currentUser.photoURL||'https://firebasestorage.googleapis.com/v'} alt="" className='h-10 w-10 rounded-xl object-cover' />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-text-main truncate">
                    {currentUser.displayName|| '會員'}
                  </p>
                  
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Navigation */}
        <nav className="overflow-y-auto flex-grow custom-scrollbar bg-secondary-light">
          <ul className="p-4 space-y-1">
            {menuItems.map((item, index) => (
              <li key={index}>
                {item.isCategory ? (
                  <div>
                    <button
                      onClick={() => toggleCategory(index)}
                      className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-serif font-semibold text-text-main hover:bg-secondary transition-all group"
                      aria-expanded={expandedCategories.has(index)}
                    >
                      <span className="flex items-center tracking-wide">
                        {item.label}
                      </span>
                      <ChevronDownIcon 
                        className={`h-4 w-4 text-text-light transition-transform duration-200 ${
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
                      <ul className="ml-3 space-y-0.5 border-l border-primary/30">
                        {item.subItems?.map((subItem, subIndex) => (
                          <li key={subIndex}>
                            <Link
                              to={subItem.link || '#'}
                              onClick={onClose}
                              className="block pl-4 pr-3 py-2 rounded-r-lg text-sm text-text-light hover:bg-secondary hover:text-primary-dark hover:border-l-2 hover:border-primary transition-all"
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
                    className="flex items-center px-3 py-2.5 rounded-lg text-text-main hover:bg-secondary hover:text-primary-dark transition-all group"
                  >
                    {item.icon && (
                      <item.icon className="h-5 w-5 mr-3 text-text-light group-hover:text-primary transition-colors" />
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
          <div className="flex-shrink-0 p-4 border-t border-secondary-dark bg-secondary">
            <div className="space-y-2">
              {userProfile?.role === 'admin' && (
                <Link
                  to="/admin"
                  onClick={onClose}
                  className="flex items-center justify-center px-4 py-2.5 rounded-lg text-white bg-primary hover:bg-primary-dark shadow-sm hover:shadow-md transition-all"
                >
                  <Cog6ToothIcon className="h-5 w-5 mr-2" />
                  <span className="font-medium">管理後臺</span>
                </Link>
              )}
              <button
                onClick={handleLogout}
                className="w-full flex items-center justify-center px-4 py-2.5 rounded-lg text-text-main bg-white border border-secondary-dark hover:bg-secondary-light transition-all"
              >
                <ArrowRightOnRectangleIcon className="h-5 w-5 mr-2" />
                <span className="font-medium">登出</span>
              </button>
            </div>
          </div>
        )}

        {/* Guest CTA */}
        {!currentUser && (
          <div className="flex-shrink-0 p-4 border-t border-secondary-dark bg-secondary">
            <div className="text-center mb-3">
              <p className="text-sm text-text-main mb-1 font-serif">還不是會員嗎？</p>
              <p className="text-xs text-text-light">立即註冊享受專屬優惠</p>
            </div>
            <div className="space-y-2">
              <Link
                to="/login"
                onClick={onClose}
                className="block w-full px-4 py-2.5 rounded-lg text-center text-white bg-primary hover:bg-primary-dark shadow-sm hover:shadow-md transition-all font-medium tracking-wide"
              >
                登入
              </Link>
              <Link
                to="/register"
                onClick={onClose}
                className="block w-full px-4 py-2.5 rounded-lg text-center text-primary-dark bg-white border border-primary hover:bg-secondary-light transition-all font-medium"
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
          background: #EFECE5; /* secondary-light */
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #DCD8CF; /* secondary-dark */
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #B7AD9E; /* primary-light */
        }
      `}</style>
    </>
  );
};

export default Sidebar;