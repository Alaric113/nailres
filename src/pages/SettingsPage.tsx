import React from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
// import ImageManagementModal from '../components/admin/ImageManagementModal'; // Removed
import { 
  BellAlertIcon, 
  ClockIcon, 
  PhotoIcon, 
  CubeIcon, 
  TicketIcon,
  UserGroupIcon,
  UserCircleIcon,
  ShieldCheckIcon,
  HomeIcon,
  ClipboardDocumentCheckIcon,
  ChevronRightIcon
} from '@heroicons/react/24/outline';

// Import Settings Components
import AccountSettings from '../components/admin/settings/AccountSettings';
import NotificationSettings from '../components/admin/settings/NotificationSettings';
import BookingSettings from '../components/admin/settings/BookingSettings';
import SeasonPassSettings from '../components/admin/settings/SeasonPassSettings';
import ReviewSettings from '../components/admin/settings/ReviewSettings';

// --- Main Settings Dashboard ---

const SettingsPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const currentView = searchParams.get('view') || 'dashboard';
  const { userProfile } = useAuthStore();
  // const [isImageModalOpen, setIsImageModalOpen] = useState(false); // Removed

  // Group Definitions
  const settingGroups = [
    {
      title: '店務管理',
      items: [
        { 
          title: "營業時間", 
          icon: ClockIcon, 
          color: "bg-purple-50 text-purple-600", 
          linkTo: "/admin/hours", 
          subtext: "排班與營業時間",
          roles: ['admin', 'manager', 'designer']
        },
        { 
          title: "用戶管理", 
          icon: UserGroupIcon, 
          color: "bg-indigo-50 text-indigo-600", 
          linkTo: "/admin/customers", 
          subtext: "會員資料查詢",
          roles: ['admin', 'manager'] 
        },
        { 
          title: "設計師管理", 
          icon: UserCircleIcon, 
          color: "bg-teal-50 text-teal-600", 
          linkTo: "/admin/staff", 
          subtext: "設計師檔案設定",
          roles: ['admin', 'manager'] 
        },
      ]
    },
    {
        title: '營運銷售',
        items: [
            { 
              title: "服務項目", 
              icon: CubeIcon, 
              color: "bg-blue-50 text-blue-600", 
              linkTo: "/admin/services", 
              subtext: "服務與價格設定",
              roles: ['admin', 'manager', 'designer']
            },
           { 
              title: "會員方案", 
              icon: TicketIcon, 
              color: "bg-rose-50 text-rose-600", 
              subtext: "季卡/年卡方案", 
              onClick: () => setSearchParams({ view: 'season-pass' }),
              roles: ['admin', 'manager']
            },
            { 
              title: "優惠活動", 
              icon: TicketIcon, 
              color: "bg-green-50 text-green-600", 
              linkTo: "/admin/promotions", 
              subtext: "優惠券與促銷",
              roles: ['admin', 'manager', 'designer']
            },
        ]
    },
    {
        title: '內容與網站',
        items: [
            { 
              title: "首頁圖片", 
              icon: HomeIcon, 
              color: "bg-orange-50 text-orange-600", 
              subtext: "輪播與封面",
              linkTo: "/admin/settings/images",
              roles: ['admin', 'manager']
            },
            { 
              title: "作品集", 
              icon: PhotoIcon, 
              color: "bg-pink-50 text-pink-600", 
              linkTo: "/admin/portfolio", 
              subtext: "作品照片管理",
              roles: ['admin', 'manager', 'designer']
            },
            { 
              title: "預約設定", 
              icon: ClipboardDocumentCheckIcon, 
              color: "bg-purple-50 text-purple-600", 
              subtext: "預約須知與條款", 
              onClick: () => setSearchParams({ view: 'booking' }),
              roles: ['admin', 'manager']
            },
            { 
              title: "客戶評論", 
              icon: UserGroupIcon, // Or ChatBubbleLeftRightIcon if available, but UserGroup is imported. Let's use UserGroup for now or import new one.
              color: "bg-teal-50 text-teal-600", 
              subtext: "評論管理與顯示設定", 
              onClick: () => setSearchParams({ view: 'reviews' }),
              roles: ['admin', 'manager']
            },
        ]
    },
    {
        title: '系統設定',
        items: [
            { 
              title: "帳號綁定", 
              icon: ShieldCheckIcon, 
              color: "bg-gray-50 text-gray-600", 
              subtext: "Google 登入設定", 
              onClick: () => setSearchParams({ view: 'account' }),
              roles: ['admin', 'manager', 'designer']
            },
            { 
              title: "通知設定", 
              icon: BellAlertIcon, 
              color: "bg-yellow-50 text-yellow-600", 
              subtext: "LINE 與推播設定", 
              onClick: () => setSearchParams({ view: 'notifications' }),
              roles: ['admin', 'manager', 'designer']
            },
        ]
    }
  ];

  if (currentView === 'notifications') return <div className="p-4 sm:p-6 lg:p-8"><NotificationSettings /></div>;
  if (currentView === 'account') return <div className="p-4 sm:p-6 lg:p-8"><AccountSettings /></div>;
  if (currentView === 'booking') return <div className="p-4 sm:p-6 lg:p-8"><BookingSettings /></div>;
  if (currentView === 'season-pass') return <div className="p-4 sm:p-6 lg:p-8"><SeasonPassSettings /></div>;
  if (currentView === 'reviews') return <div className="p-4 sm:p-6 lg:p-8"><ReviewSettings /></div>;

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
       <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {settingGroups.map((group) => {
              const visibleItems = group.items.filter(item => item.roles.includes(userProfile?.role || ''));
              if (visibleItems.length === 0) return null;

              return (
                  <div key={group.title} className="bg-white rounded-2xl shadow-sm border border-[#EFECE5] overflow-hidden flex flex-col">
                      <div className="px-5 py-3 border-b border-gray-100 bg-gray-50/50">
                          <h3 className="text-xs font-bold text-gray-500 tracking-wider uppercase">{group.title}</h3>
                      </div>
                      <div className="divide-y divide-gray-100">
                          {visibleItems.map(item => {
                              const ItemContent = (
                                  <>
                                    <div className={`w-9 h-9 rounded-lg ${item.color} flex items-center justify-center flex-shrink-0 mr-4 transition-transform group-hover:scale-110`}>
                                        {React.createElement(item.icon, { className: "w-5 h-5" })}
                                    </div>
                                    <div className="flex-1 min-w-0 text-left">
                                        <h4 className="text-sm font-semibold text-gray-900 truncate">{item.title}</h4>
                                        <p className="text-xs text-gray-500 truncate mt-0.5">{item.subtext}</p>
                                    </div>
                                    <ChevronRightIcon className="w-5 h-5 text-gray-300 ml-3 flex-shrink-0 group-hover:text-gray-500 transition-colors" />
                                  </>
                              );

                              const containerClass = "flex items-center px-5 py-4 hover:bg-gray-50 transition-colors cursor-pointer w-full group";

                              if (item.onClick) {
                                  return (
                                      <button key={item.title} onClick={item.onClick} className={containerClass}>
                                          {ItemContent}
                                      </button>
                                  );
                              }
                              return (
                                  <Link key={item.title} to={item.linkTo || '#'} className={containerClass}>
                                      {ItemContent}
                                  </Link>
                              );
                          })}
                      </div>
                  </div>
              );
          })}
       </div>
    </div>
  );
};

export default SettingsPage;
