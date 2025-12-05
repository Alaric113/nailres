import React, { useState, useEffect } from 'react';
import { doc, updateDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Link } from 'react-router-dom';
import LoadingSpinner from '../components/common/LoadingSpinner';
import type { EnrichedUser } from '../types/user';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';

const SettingsPage: React.FC = () => {
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
    // Optimistically update UI
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
      // Revert UI on error
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
    <div className="min-h-screen bg-secondary-light text-text-main">
      <header className="bg-white/80 backdrop-blur-md border-b border-secondary-dark sticky top-0 z-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <h1 className="text-xl sm:text-2xl font-serif font-bold text-text-main">
            通知設定
          </h1>
          <Link to="/admin" className="flex items-center text-sm font-medium text-primary hover:text-primary-dark transition-colors">
            <ArrowLeftIcon className="h-4 w-4 mr-1" />
            返回儀表板
          </Link>
        </div>
      </header>

      <main className="container mx-auto p-4 sm:p-6 lg:p-8">
        <div className="bg-white rounded-xl shadow-sm border border-secondary-dark/50 p-6 max-w-3xl mx-auto">
          {isLoading ? (
            <div className="flex justify-center items-center p-12">
              <LoadingSpinner />
            </div>
          ) : (
            <div className="space-y-6">
              <div className="bg-secondary-light/30 p-4 rounded-lg border border-secondary-dark/20">
                <p className="text-text-main text-sm leading-relaxed">
                  勾選您希望接收 LINE 預約通知的管理員帳號。請確保這些帳號已透過 LINE 登入以綁定其 User ID。
                </p>
              </div>
              
              {message && (
                <div className={`p-3 rounded-lg text-sm ${message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                  {message.text}
                </div>
              )}
              
              <ul className="divide-y divide-secondary-light">
                {admins.map(admin => (
                  <li key={admin.id} className="py-4 flex items-center justify-between hover:bg-secondary-light/10 -mx-2 px-2 rounded-lg transition-colors">
                    <div className="flex items-center">                    
                      <img 
                        className="h-12 w-12 rounded-full mr-4 object-cover border-2 border-white shadow-sm" 
                        src={admin.profile.avatarUrl || `https://ui-avatars.com/api/?name=${admin.profile.displayName}&background=random`} 
                        alt="" 
                        crossOrigin="anonymous"
                        referrerPolicy="no-referrer"
                      />
                      <div>
                        <p className="text-base font-medium text-text-main">{admin.profile.displayName}</p>
                        <p className="text-xs text-text-light mt-0.5">ID: {admin.id.slice(0, 8)}...</p>
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
                        <div className={`block w-12 h-7 rounded-full transition-colors duration-300 ${admin.receivesAdminNotifications ? 'bg-primary' : 'bg-gray-200'}`}></div>
                        <div className={`dot absolute left-1 top-1 bg-white w-5 h-5 rounded-full transition-transform duration-300 shadow-sm ${admin.receivesAdminNotifications ? 'translate-x-5' : ''}`}></div>
                      </div>
                    </label>
                  </li>
                ))}
              </ul>
            </div>
          )}
          <div className="mt-8 pt-6 border-t border-secondary-dark/20">
            <h3 className="text-lg font-serif font-medium text-text-main mb-2">功能測試</h3>
            <p className="text-sm text-text-light mb-4">點擊下方按鈕，向所有已啟用通知的管理員發送一則測試訊息。</p>
            <button
              onClick={handleSendTestMessage}
              disabled={isTesting}
              className="inline-flex items-center px-6 py-2.5 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-accent hover:bg-accent-hover focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-accent disabled:bg-gray-300 transition-all"
            >
              {isTesting ? '正在發送...' : '發送測試訊息'}
            </button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default SettingsPage;
