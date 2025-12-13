import React, { useState, useEffect } from 'react';
import { doc, updateDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';
import LoadingSpinner from '../components/common/LoadingSpinner';
import SummaryCard from '../components/admin/SummaryCard';
import type { EnrichedUser } from '../types/user';
import { useSearchParams } from 'react-router-dom';
import { useAuthStore } from '../store/authStore'; // Import useAuthStore
import { 
  BellAlertIcon, 
  ClockIcon, 
  PhotoIcon, 
  CubeIcon, 
  TicketIcon,
  UserGroupIcon,
  UserCircleIcon
} from '@heroicons/react/24/outline';

// --- Notification Settings Sub-View ---
const NotificationSettingsView: React.FC = () => {
  const { userProfile, currentUser } = useAuthStore();
  const isDesignerRole = userProfile?.role === 'designer';

  const [notificationTargetUser, setNotificationTargetUser] = useState<EnrichedUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isTesting, setIsTesting] = useState(false);

  useEffect(() => {
    const fetchUsers = async () => {
      setIsLoading(true);
      try {
        let q;
        if (isDesignerRole && currentUser) {
          // Designer only sees their own setting
          q = query(collection(db, 'users'), where('__name__', '==', currentUser.uid));
        } else {
          // Admin/Manager sees all (admin/manager role)
          q = query(collection(db, 'users'), where('role', 'in', ['admin', 'manager']));
        }
        
        const querySnapshot = await getDocs(q);
        const userList = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as EnrichedUser));
        setNotificationTargetUser(userList);
      } catch (error) {
        console.error("Error fetching notification target users:", error);
        setMessage({ type: 'error', text: '讀取設定失敗。' });
      } finally {
        setIsLoading(false);
      }
    };

    fetchUsers();
  }, [isDesignerRole, currentUser]);

  const handleToggleNotification = async (userId: string, currentValue: boolean) => {
    setNotificationTargetUser(prevUsers =>
      prevUsers.map(u =>
        u.id === userId ? { ...u, receivesAdminNotifications: !currentValue } : u
      )
    );
    setMessage(null);

    try {
      const userDocRef = doc(db, 'users', userId);
      await updateDoc(userDocRef, {
        receivesAdminNotifications: !currentValue
      });
    } catch (error) {
      console.error("Error updating notification setting:", error);
      setMessage({ type: 'error', text: '更新失敗，請稍後再試。' });
      setNotificationTargetUser(prevUsers =>
        prevUsers.map(u =>
          u.id === userId ? { ...u, receivesAdminNotifications: currentValue } : u
        )
      );
    }
  };

  const handleSendTestMessage = async () => {
    setIsTesting(true);
    setMessage(null);
    try {
      const response = await fetch('/api/send-line-message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'test_notification' }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || '發送失敗');
      }

      setMessage({ type: 'success', text: '測試訊息已成功發送！' });
    } catch (error: any) {
      setMessage({ type: 'error', text: `發送測試訊息失敗: ${error.message}` });
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="mb-6">
        <h2 className="text-xl font-serif font-bold text-gray-900">LINE 通知設定</h2>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-[#EFECE5] p-6 max-w-3xl mx-auto">
        {isLoading ? (
          <div className="flex justify-center items-center p-12">
            <LoadingSpinner />
          </div>
        ) : (
          <div className="space-y-6">
            <div className="bg-[#FAF9F6] p-4 rounded-lg border border-[#EFECE5]">
              <p className="text-gray-700 text-sm leading-relaxed">
                勾選您希望接收 LINE 預約通知的帳號。
              </p>
            </div>
            
            {message && (
              <div className={`p-3 rounded-lg text-sm ${message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                {message.text}
              </div>
            )}
            
            <ul className="divide-y divide-gray-100">
              {notificationTargetUser.map(user => (
                <li key={user.id} className="py-4 flex items-center justify-between hover:bg-gray-50 -mx-2 px-2 rounded-lg transition-colors">
                  <div className="flex items-center">                    
                    <img 
                      className="h-12 w-12 rounded-full mr-4 object-cover border-2 border-white shadow-sm" 
                      src={user.profile.avatarUrl || `https://ui-avatars.com/api/?name=${user.profile.displayName}&background=random`} 
                      alt="" 
                      crossOrigin="anonymous"
                      referrerPolicy="no-referrer"
                    />
                    <div>
                      <p className="text-base font-medium text-gray-900">{user.profile.displayName}</p>
                      <p className="text-xs text-gray-500 mt-0.5">ID: {user.id.slice(0, 8)}...</p>
                    </div>
                  </div>
                  <label htmlFor={`toggle-${user.id}`} className="flex items-center cursor-pointer relative group">
                    <div className="relative">
                      <input
                        type="checkbox"
                        id={`toggle-${user.id}`}
                        className="sr-only"
                        checked={!!user.receivesAdminNotifications}
                        onChange={() => handleToggleNotification(user.id, !!user.receivesAdminNotifications)}
                      />
                      <div className={`block w-12 h-7 rounded-full transition-colors duration-300 ${user.receivesAdminNotifications ? 'bg-[#9F9586]' : 'bg-gray-200'}`}></div>
                      <div className={`dot absolute left-1 top-1 bg-white w-5 h-5 rounded-full transition-transform duration-300 shadow-sm ${user.receivesAdminNotifications ? 'translate-x-5' : ''}`}></div>
                    </div>
                  </label>
                </li>
              ))}
            </ul>
          </div>
        )}
        <div className="mt-8 pt-6 border-t border-gray-100">
          <h3 className="text-lg font-serif font-medium text-gray-900 mb-2">功能測試</h3>
          <p className="text-sm text-gray-500 mb-4">發送測試訊息。</p>
          <button
            onClick={handleSendTestMessage}
            disabled={isTesting}
            className="inline-flex items-center px-6 py-2.5 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-[#9F9586] hover:bg-[#8a8175] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#9F9586] disabled:bg-gray-300 transition-all"
          >
            {isTesting ? '正在發送...' : '發送測試訊息'}
          </button>
        </div>
      </div>
    </div>
  );
};

// --- Main Settings Dashboard ---

import SeasonPassSettings from '../components/admin/settings/SeasonPassSettings';

// ... (existing imports)

// --- Main Settings Dashboard ---

const SettingsPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const currentView = searchParams.get('view') || 'dashboard';
  const { userProfile } = useAuthStore();

  // Define cards available to all staff, then filter based on role
  const allSettingsCards = [
    { 
      title: "通知設定", 
      icon: BellAlertIcon, 
      color: "bg-yellow-500", 
      subtext: "設定 LINE 通知接收人員", 
      onClick: () => setSearchParams({ view: 'notifications' }),
      roles: ['admin', 'manager', 'designer']
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
  ];

  const filteredCards = allSettingsCards.filter(card => 
    card.roles.includes(userProfile?.role || '')
  );


  if (currentView === 'notifications') {
    return (
      <div className="p-4 sm:p-6 lg:p-8">
        <NotificationSettingsView />
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
    </div>
  );
};

export default SettingsPage;