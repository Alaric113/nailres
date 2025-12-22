import React, { useState, useEffect } from 'react';
import { doc, updateDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';
import LoadingSpinner from '../components/common/LoadingSpinner';
import SummaryCard from '../components/admin/SummaryCard';
import type { EnrichedUser } from '../types/user';
import { useSearchParams } from 'react-router-dom';
import { useAuthStore } from '../store/authStore'; // Import useAuthStore
import { useNotification } from '../hooks/useNotification';
import { 
  BellAlertIcon, 
  ClockIcon, 
  PhotoIcon, 
  CubeIcon, 
  TicketIcon,
  UserGroupIcon,
  UserCircleIcon,
  ShieldCheckIcon
} from '@heroicons/react/24/outline';

// Import auth linking
import { linkWithPopup } from 'firebase/auth';
import { googleProvider } from '../lib/firebase';

// --- Account Settings Sub-View ---
const AccountSettingsView: React.FC = () => {
    const { currentUser } = useAuthStore();
    const [isLinking, setIsLinking] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    const isGoogleLinked = currentUser?.providerData.some(p => p.providerId === 'google.com');

    const handleLinkGoogle = async () => {
        if (!currentUser) return;
        setIsLinking(true);
        setMessage(null);
        try {
            await linkWithPopup(currentUser, googleProvider);
            setMessage({ type: 'success', text: 'Google 帳號已成功連結！您現在可以使用 Google 登入。' });
        } catch (error: any) {
            console.error(error);
            if (error.code === 'auth/credential-already-in-use') {
                setMessage({ type: 'error', text: '此 Google 帳號已被其他使用者綁定。' });
            } else {
                setMessage({ type: 'error', text: `連結失敗: ${error.message}` });
            }
        } finally {
            setIsLinking(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="mb-6">
                 <h2 className="text-xl font-serif font-bold text-gray-900 flex items-center gap-2">
                     <ShieldCheckIcon className="w-6 h-6 text-teal-600" /> 帳號綁定設定
                 </h2>
                 <p className="text-sm text-gray-500 mt-1 ml-8">
                     綁定 Google 帳號後，即可以 Google 快速登入 PWA 管理後台。
                 </p>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-[#EFECE5] p-6 max-w-2xl">
                 <div className="space-y-6">
                     {/* Status */}
                     <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                         <div className="flex items-center gap-3">
                             <img src="https://www.svgrepo.com/show/475656/google-color.svg" alt="Google" className="w-8 h-8" />
                             <div>
                                 <p className="font-medium text-gray-900">Google 帳號</p>
                                 <p className="text-xs text-gray-500">
                                     {isGoogleLinked ? '已綁定' : '尚未綁定'}
                                 </p>
                             </div>
                         </div>
                         <div>
                             {isGoogleLinked ? (
                                 <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                     已連結
                                 </span>
                             ) : (
                                 <button
                                     onClick={handleLinkGoogle}
                                     disabled={isLinking}
                                     className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 transition-colors"
                                 >
                                     {isLinking ? '處理中...' : '立即連結'}
                                 </button>
                             )}
                         </div>
                     </div>
                     
                     {message && (
                        <div className={`p-3 rounded-lg text-sm ${message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                            {message.text}
                        </div>
                     )}

                     <div className="text-xs text-gray-500 bg-blue-50 p-4 rounded-lg">
                         <h4 className="font-bold text-blue-700 mb-1">使用說明</h4>
                         <p>1. 這是為了讓管理員在 iOS PWA 或其他不便使用 LINE 登入的環境下，能有替代的登入方式。</p>
                         <p>2. 請勿將此功能開放給一般訪客帳號，以免造成權限混亂。</p>
                     </div>
                 </div>
            </div>
        </div>
    );
};


// --- Notification Settings Sub-View ---
const NotificationSettingsView: React.FC = () => {
  const { userProfile, currentUser } = useAuthStore();
  const { requestPermission, permission, fcmToken } = useNotification(); // Use the hook
  const isDesignerRole = userProfile?.role === 'designer';

  const [notificationTargetUser, setNotificationTargetUser] = useState<EnrichedUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isTesting, setIsTesting] = useState(false);
  
  // PWA Test State
  const [isSendingPwaTest, setIsSendingPwaTest] = useState(false);

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

      setMessage({ type: 'success', text: 'LINE 測試訊息已成功發送！' });
    } catch (error: any) {
      setMessage({ type: 'error', text: `發送 LINE 測試訊息失敗: ${error.message}` });
    } finally {
      setIsTesting(false);
    }
  };

  const handleSendPwaTest = async () => {
      if (!fcmToken) {
          setMessage({ type: 'error', text: '尚未取得推播權限或 Token，請先啟用通知。' });
          return;
      }
      setIsSendingPwaTest(true);
      setMessage(null);
      try {
          const response = await fetch('/api/notify-booking', { // Use notify-booking for FCM
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ 
                  type: 'test_notification',
                  targetToken: fcmToken 
              }),
          });
          
          if (!response.ok) {
              const errorData = await response.json();
              throw new Error(errorData.error || errorData.message || '發送失敗');
          }
          
          setMessage({ type: 'success', text: 'PWA 推播已發送，請檢查您的裝置通知列 (iOS 需滑下通知中心)。' });
      } catch (e: any) {
          console.error(e);
          setMessage({ type: 'error', text: `PWA 測試失敗: ${e.message}` });
      } finally {
          setIsSendingPwaTest(false);
      }
  };

  return (
    <div className="space-y-8">
      
      {/* 1. LINE Notification Settings */}
      <div>
           <div className="mb-4">
             <h2 className="text-xl font-serif font-bold text-gray-900 flex items-center gap-2">
                 <i className="fa-brands fa-line text-[#06C755]"></i> LINE 通知設定
             </h2>
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
                   <div className={`p-3 rounded-lg text-sm flex items-center gap-2 ${message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                      {message.type === 'success' ? <i className="fa-solid fa-check-circle"></i> : <i className="fa-solid fa-circle-exclamation"></i>}
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
               <h3 className="text-lg font-serif font-medium text-gray-900 mb-2">LINE 功能測試</h3>
               <p className="text-sm text-gray-500 mb-4">發送 LINE 測試訊息到上述已勾選的管理者。</p>
               <button
                 onClick={handleSendTestMessage}
                 disabled={isTesting}
                 className="inline-flex items-center px-6 py-2.5 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-[#06C755] hover:bg-[#05b34c] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#06C755] disabled:bg-gray-300 transition-all"
               >
                 {isTesting ? '正在發送...' : '發送 LINE 測試訊息'}
               </button>
             </div>
           </div>
      </div>

      {/* 2. PWA Push Notification Settings */}
      <div>
           <div className="mb-4">
             <h2 className="text-xl font-serif font-bold text-gray-900 flex items-center gap-2">
                 <BellAlertIcon className="w-6 h-6 text-yellow-500" /> PWA 推播通知設定
             </h2>
           </div>
           
           <div className="bg-white rounded-xl shadow-sm border border-[#EFECE5] p-6 max-w-3xl mx-auto">
                <div className="space-y-6">
                    <div className="bg-[#FAF9F6] p-4 rounded-lg border border-[#EFECE5]">
                        <p className="text-gray-700 text-sm leading-relaxed">
                            推播通知適用於安裝了 PWA 的裝置 (支援 iOS/Android/Desktop)。
                            <br />
                            <span className="font-bold text-[#9F9586]">目前狀態: </span>
                            <span className={`font-bold ${permission === 'granted' ? 'text-green-600' : 'text-red-500'}`}>
                                {permission === 'granted' 
                                    ? `已授權 (Token: ${fcmToken ? '已取得' : '獲取中...'})`
                                    : permission === 'denied' ? '已封鎖 (請至瀏覽器設定開啟)' : '未詢問'}
                            </span>
                        </p>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-4">
                         {/* Enable Button */}
                         {permission !== 'granted' && permission !== 'denied' && (
                             <button
                                onClick={requestPermission}
                                className="inline-flex items-center justify-center px-6 py-2.5 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-[#9F9586] hover:bg-[#8a8175] transition-all"
                             >
                                <BellAlertIcon className="w-5 h-5 mr-2" />
                                啟用推播通知
                             </button>
                         )}
                         
                         {/* Test Button */}
                         <button
                            onClick={handleSendPwaTest}
                            disabled={!fcmToken || isSendingPwaTest}
                            className="inline-flex items-center justify-center px-6 py-2.5 border border-gray-300 text-sm font-medium rounded-lg shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#9F9586] disabled:bg-gray-100 disabled:text-gray-400 transition-all"
                         >
                            {isSendingPwaTest ? '發送中...' : '發送本機測試訊息'}
                         </button>
                    </div>
                </div>
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

  if (currentView === 'account') {
    return (
      <div className="p-4 sm:p-6 lg:p-8">
        <AccountSettingsView />
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