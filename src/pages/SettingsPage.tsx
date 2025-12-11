import React, { useState, useEffect } from 'react';
import { doc, updateDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';
import LoadingSpinner from '../components/common/LoadingSpinner';
import SummaryCard from '../components/admin/SummaryCard';
import type { EnrichedUser } from '../types/user';
import { useSearchParams } from 'react-router-dom';
import { 
  BellAlertIcon, 
  ClockIcon, 
  PhotoIcon, 
  CubeIcon, 
  TicketIcon,
  UserGroupIcon
} from '@heroicons/react/24/outline';

// --- Notification Settings Sub-View ---
// Note: onBack is handled by parent or layout if global header used, 
// but here we might still want local back or just rely on global.
// For now, I'll remove the local header since the user wants it in the "title line".
// But wait, the user said "add a back button to the header". 
// If I use the global header in AdminLayout, I don't need the local header here.
// However, AdminLayout renders the content. 
// I will KEEP the local header as a fallback or content title, 
// but simplify it if the global header takes over. 
// Actually, let's keep it simple: simpler content, global header handles navigation.

const NotificationSettingsView: React.FC = () => {
  const [admins, setAdmins] = useState<EnrichedUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isTesting, setIsTesting] = useState(false);

  useEffect(() => {
    const fetchAdmins = async () => {
      setIsLoading(true);
      try {
        const q = query(collection(db, 'users'), where('role', '==', 'admin'));
        const querySnapshot = await getDocs(q);
        const adminList = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as EnrichedUser));
        setAdmins(adminList);
      } catch (error) {
        console.error("Error fetching admins:", error);
        setMessage({ type: 'error', text: '讀取管理員列表失敗。' });
      } finally {
        setIsLoading(false);
      }
    };

    fetchAdmins();
  }, []);

  const handleToggleNotification = async (userId: string, currentValue: boolean) => {
    setAdmins(prevAdmins =>
      prevAdmins.map(admin =>
        admin.id === userId ? { ...admin, receivesAdminNotifications: !currentValue } : admin
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
      setAdmins(prevAdmins =>
        prevAdmins.map(admin =>
          admin.id === userId ? { ...admin, receivesAdminNotifications: currentValue } : admin
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
      {/* Local Header (Optional, maybe redundant if global header exists, but good for context) */}
      {/* I will remove the "Back" button from here since it will be in the main header */}
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
                勾選您希望接收 LINE 預約通知的管理員帳號。
              </p>
            </div>
            
            {message && (
              <div className={`p-3 rounded-lg text-sm ${message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                {message.text}
              </div>
            )}
            
            <ul className="divide-y divide-gray-100">
              {admins.map(admin => (
                <li key={admin.id} className="py-4 flex items-center justify-between hover:bg-gray-50 -mx-2 px-2 rounded-lg transition-colors">
                  <div className="flex items-center">                    
                    <img 
                      className="h-12 w-12 rounded-full mr-4 object-cover border-2 border-white shadow-sm" 
                      src={admin.profile.avatarUrl || `https://ui-avatars.com/api/?name=${admin.profile.displayName}&background=random`} 
                      alt="" 
                      crossOrigin="anonymous"
                      referrerPolicy="no-referrer"
                    />
                    <div>
                      <p className="text-base font-medium text-gray-900">{admin.profile.displayName}</p>
                      <p className="text-xs text-gray-500 mt-0.5">ID: {admin.id.slice(0, 8)}...</p>
                    </div>
                  </div>
                  <label htmlFor={`toggle-${admin.id}`} className="flex items-center cursor-pointer relative group">
                    <div className="relative">
                      <input
                        type="checkbox"
                        id={`toggle-${admin.id}`}
                        className="sr-only"
                        checked={!!admin.receivesAdminNotifications}
                        onChange={() => handleToggleNotification(admin.id, !!admin.receivesAdminNotifications)}
                      />
                      <div className={`block w-12 h-7 rounded-full transition-colors duration-300 ${admin.receivesAdminNotifications ? 'bg-[#9F9586]' : 'bg-gray-200'}`}></div>
                      <div className={`dot absolute left-1 top-1 bg-white w-5 h-5 rounded-full transition-transform duration-300 shadow-sm ${admin.receivesAdminNotifications ? 'translate-x-5' : ''}`}></div>
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

const SettingsPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const currentView = searchParams.get('view') || 'dashboard';

  if (currentView === 'notifications') {
    return (
      <div className="p-4 sm:p-6 lg:p-8">
        <NotificationSettingsView />
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
       {/* Cards Grid */}
       <div className="grid grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Notification Settings */}
          <SummaryCard 
            title="通知設定"
            value=""
            icon={<BellAlertIcon className="h-6 w-6" />}
            color="bg-yellow-500"
            onClick={() => setSearchParams({ view: 'notifications' })}
            subtext="設定 LINE 通知接收人員"
          />
          
          {/* Business Hours */}
           <SummaryCard 
            title="營業時間"
            value=""
            icon={<ClockIcon className="h-6 w-6" />}
            color="bg-purple-500"
            linkTo="/admin/hours"
            subtext="管理每週營業時間與公休日"
          />

          {/* User Management */}
          <SummaryCard 
            title="用戶管理"
            value=""
            icon={<UserGroupIcon className="h-6 w-6" />}
            color="bg-indigo-500"
            linkTo="/admin/customers"
            subtext="查看與管理所有會員資料"
          />

          {/* Services */}
           <SummaryCard 
            title="服務項目"
            value=""
            icon={<CubeIcon className="h-6 w-6" />}
            color="bg-blue-500"
            linkTo="/admin/services"
            subtext="新增或修改服務項目與價格"
          />

          {/* Portfolio */}
           <SummaryCard 
            title="作品集"
            value=""
            icon={<PhotoIcon className="h-6 w-6" />}
            color="bg-pink-500"
            linkTo="/admin/portfolio"
            subtext="管理作品集圖片與分類"
          />

          {/* Promotions */}
           <SummaryCard 
            title="優惠活動"
            value=""
            icon={<TicketIcon className="h-6 w-6" />}
            color="bg-green-500"
            linkTo="/admin/promotions"
            subtext="設定優惠券與促銷活動"
          />
       </div>
    </div>
  );
};

export default SettingsPage;