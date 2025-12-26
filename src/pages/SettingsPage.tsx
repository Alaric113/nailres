import React, { useState } from 'react';

import SummaryCard from '../components/admin/SummaryCard';
import { useSearchParams } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import ImageManagementModal from '../components/admin/ImageManagementModal';
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
  ClipboardDocumentCheckIcon
} from '@heroicons/react/24/outline';

// Import Settings Components
import AccountSettings from '../components/admin/settings/AccountSettings';
import NotificationSettings from '../components/admin/settings/NotificationSettings';
import BookingSettings from '../components/admin/settings/BookingSettings';
import SeasonPassSettings from '../components/admin/settings/SeasonPassSettings';

// --- Main Settings Dashboard ---

const SettingsPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const currentView = searchParams.get('view') || 'dashboard';
  const { userProfile } = useAuthStore();
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);

  // Define cards available to all staff, then filter based on role
  const allSettingsCards = [
    { 
      title: "帳號綁定", 
      icon: ShieldCheckIcon, 
      color: "bg-teal-600", 
      subtext: "綁定 Google 登入 (管理員專用)", 
      onClick: () => setSearchParams({ view: 'account' }),
      roles: ['admin', 'manager', 'designer']
    },
    { 
      title: "通知設定", 
      icon: BellAlertIcon, 
      color: "bg-yellow-500", 
      subtext: "設定 LINE 通知接收人員", 
      onClick: () => setSearchParams({ view: 'notifications' }),
      roles: ['admin', 'manager', 'designer']
    },
    { 
      title: "首頁圖片", 
      icon: HomeIcon, 
      color: "bg-orange-500", 
      subtext: "設定首頁輪播與封面圖片",
      onClick: () => setIsImageModalOpen(true),
      roles: ['admin', 'manager']
    },
    { 
      title: "會員方案", 
      icon: TicketIcon, 
      color: "bg-rose-500", 
      subtext: "設定季卡/年卡方案與價格", 
      onClick: () => setSearchParams({ view: 'season-pass' }),
      roles: ['admin', 'manager']
    },
    { 
      title: "營業時間", 
      icon: ClockIcon, 
      color: "bg-purple-500", 
      linkTo: "/admin/hours", 
      subtext: "管理排班與營業時間",
      roles: ['admin', 'manager', 'designer']
    },
    // ... (other existing cards)
    { 
      title: "用戶管理", 
      icon: UserGroupIcon, 
      color: "bg-indigo-500", 
      linkTo: "/admin/customers", 
      subtext: "查看與管理所有會員資料",
      roles: ['admin', 'manager'] // Restricted to Admin/Manager
    },
    { 
      title: "設計師管理", 
      icon: UserCircleIcon, 
      color: "bg-teal-500", 
      linkTo: "/admin/staff", 
      subtext: "管理設計師檔案與公開資訊",
      roles: ['admin', 'manager'] // Restricted to Admin/Manager
    },
    { 
      title: "服務項目", 
      icon: CubeIcon, 
      color: "bg-blue-500", 
      linkTo: "/admin/services", 
      subtext: "新增或修改服務項目與價格",
      roles: ['admin', 'manager', 'designer']
    },
    { 
      title: "作品集", 
      icon: PhotoIcon, 
      color: "bg-pink-500", 
      linkTo: "/admin/portfolio", 
      subtext: "管理作品集圖片與分類",
      roles: ['admin', 'manager', 'designer']
    },
    { 
      title: "優惠活動", 
      icon: TicketIcon, 
      color: "bg-green-500", 
      linkTo: "/admin/promotions", 
      subtext: "設定優惠券與促銷活動",
      roles: ['admin', 'manager', 'designer']
    },
    { 
      title: "預約設定", 
      icon: ClipboardDocumentCheckIcon, 
      color: "bg-purple-600", 
      subtext: "預約注意事項與條款", 
      onClick: () => setSearchParams({ view: 'booking' }),
      roles: ['admin', 'manager']
    },
  ];

  const filteredCards = allSettingsCards.filter(card => 
    card.roles.includes(userProfile?.role || '')
  );


  if (currentView === 'notifications') {
    return (
      <div className="p-4 sm:p-6 lg:p-8">
        <NotificationSettings />
      </div>
    );
  }

  if (currentView === 'account') {
    return (
      <div className="p-4 sm:p-6 lg:p-8">
        <AccountSettings />
      </div>
    );
  }

  if (currentView === 'booking') {
    return (
      <div className="p-4 sm:p-6 lg:p-8">
        <BookingSettings />
      </div>
    );
  }

  if (currentView === 'season-pass') {
    return (
      <div className="p-4 sm:p-6 lg:p-8">
        <SeasonPassSettings />
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
       {/* Cards Grid */}
       <div className="grid grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCards.map(card => (
            <SummaryCard 
              key={card.title}
              title={card.title}
              value=""
              icon={React.createElement(card.icon, { className: "h-6 w-6" })} // Dynamically render icon
              color={card.color}
              onClick={card.onClick}
              linkTo={card.linkTo}
              subtext={card.subtext}
            />
          ))}
       </div>

       {/* Image Management Modal */}
       {isImageModalOpen && (
        <ImageManagementModal onClose={() => setIsImageModalOpen(false)} />
       )}
    </div>
  );
};

export default SettingsPage;
