import React, { useState, useEffect } from 'react';
import { doc, updateDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Link } from 'react-router-dom';
import { ArrowUturnLeftIcon } from '@heroicons/react/24/solid';
import LoadingSpinner from '../components/common/LoadingSpinner';
import type { EnrichedUser } from '../types/user';

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
    <div className="container mx-auto p-4 sm:p-6 lg:p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">通知設定</h1>
        <Link to="/admin" className="flex items-center text-sm text-gray-600 hover:text-pink-500">
          <ArrowUturnLeftIcon className="h-4 w-4 mr-1" />
          返回儀表板
        </Link>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6 max-w-2xl mx-auto">
        {isLoading ? (
          <div className="flex justify-center items-center p-8">
            <LoadingSpinner />
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-gray-600">勾選您希望接收 LINE 預約通知的管理員帳號。請確保這些帳號已透過 LINE 登入以綁定其 User ID。</p>
            {message && <p className={`text-sm ${message.type === 'success' ? 'text-green-600' : 'text-red-600'}`}>{message.text}</p>}
            <ul className="divide-y divide-gray-200">
              {admins.map(admin => (
                <li key={admin.id} className="py-4 flex items-center justify-between">
                  <div className="flex items-center">
                    <img className="h-10 w-10 rounded-full mr-3 object-cover" src={admin.profile.avatarUrl || `https://ui-avatars.com/api/?name=${admin.profile.displayName}&background=random`} alt="" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">{admin.profile.displayName}</p>
                     
                    </div>
                  </div>
                  <label htmlFor={`toggle-${admin.id}`} className="flex items-center cursor-pointer">
                    <div className="relative">
                      <input
                        type="checkbox"
                        id={`toggle-${admin.id}`}
                        className="sr-only"
                        checked={!!admin.receivesAdminNotifications}
                        onChange={() => handleToggleNotification(admin.id, !!admin.receivesAdminNotifications)}
                      />
                      <div className={`block w-14 h-8 rounded-full ${admin.receivesAdminNotifications ? 'bg-pink-500' : 'bg-gray-300'}`}></div>
                      <div className={`dot absolute left-1 top-1 bg-white w-6 h-6 rounded-full transition-transform ${admin.receivesAdminNotifications ? 'translate-x-6' : ''}`}></div>
                    </div>
                  </label>
                </li>
              ))}
            </ul>
          </div>
        )}
        <div className="mt-6 pt-6 border-t border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">功能測試</h3>
          <p className="mt-1 text-sm text-gray-600">點擊下方按鈕，向所有已啟用通知的管理員發送一則測試訊息。</p>
          <button
            onClick={handleSendTestMessage}
            disabled={isTesting}
            className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-gray-400"
          >{isTesting ? '正在發送...' : '發送測試訊息'}</button>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
