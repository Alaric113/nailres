import React, { useState, useEffect } from 'react';
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  doc, 
  updateDoc 
} from 'firebase/firestore';
import { db } from '../../../lib/firebase';
import { useAuthStore } from '../../../store/authStore';
import { useNotification } from '../../../hooks/useNotification';
import type { EnrichedUser } from '../../../types/user';
import LoadingSpinner from '../../common/LoadingSpinner';
import { BellAlertIcon } from '@heroicons/react/24/outline'; // Adjusted import

const NotificationSettings: React.FC = () => {
    const { userProfile, currentUser } = useAuthStore();
    const { requestPermission, permission, fcmToken } = useNotification(); 
    const [activeTab, setActiveTab] = useState<'line' | 'pwa'>('line');
  
    // LINE Settings State
    const [notificationTargetUser, setNotificationTargetUser] = useState<EnrichedUser[]>([]);
    const [isLineLoading, setIsLineLoading] = useState(true);
    
    // PWA Settings State
    const [designers, setDesigners] = useState<{id: string, name: string}[]>([]);
    
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
    const [isTesting, setIsTesting] = useState(false);
    const [isSendingPwaTest, setIsSendingPwaTest] = useState(false);
  
    const isAdminOrManager = userProfile?.role === 'admin' || userProfile?.role === 'manager';
    
    // Fetch Users for LINE Settings
    useEffect(() => {
      const fetchUsers = async () => {
        setIsLineLoading(true);
        try {
          let q;
          if (currentUser && !isAdminOrManager) {
             // If not admin/manager (e.g. designer), only show themselves if they have permission
             q = query(collection(db, 'users'), where('__name__', '==', currentUser.uid));
          } else {
             q = query(collection(db, 'users'), where('role', 'in', ['admin', 'manager']));
          }
          
          const querySnapshot = await getDocs(q);
          const userList = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as EnrichedUser));
          setNotificationTargetUser(userList);
        } catch (error) {
          console.error("Error fetching notification target users:", error);
        } finally {
          setIsLineLoading(false);
        }
      };
  
      fetchUsers();
    }, [currentUser, isAdminOrManager]);
  
    // Fetch Designers for PWA Settings (Admin Only)
    useEffect(() => {
        if (activeTab === 'pwa' && isAdminOrManager) {
            const fetchDesigners = async () => {
                try {
                    const q = query(collection(db, 'designers')); // Assuming 'designers' collection exists
                    const snapshot = await getDocs(q);
                    const list = snapshot.docs.map(doc => ({
                        id: doc.id,
                        name: doc.data().name || 'Unknown Designer'
                    }));
                    setDesigners(list);
                } catch (e) {
                    console.error("Error fetching designers:", e);
                }
            };
            fetchDesigners();
        }
    }, [activeTab, isAdminOrManager]);
  
  
    const handleToggleLineNotification = async (userId: string, currentValue: boolean) => {
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
  
    const handleUpdatePwaMasterSwitch = async (checked: boolean) => {
        if (!currentUser) return;
        setMessage(null);
        try {
             const userRef = doc(db, 'users', currentUser.uid);
             await updateDoc(userRef, {
                 receivesPwaNotifications: checked
             });
             setMessage({ type: 'success', text: 'PWA 通知總開關已更新' });
             setTimeout(() => window.location.reload(), 500); 
        } catch (e) {
            console.error(e);
            setMessage({ type: 'error', text: '更新失敗' });
        }
    };
  
    const handleUpdatePwaSubscription = async (designerId: string, isSubscribed: boolean) => {
        if (!currentUser || !userProfile) return;
        const currentSubs = userProfile.pwaSubscriptions || [];
        let newSubs: string[];
  
        if (designerId === 'all') {
               if (isSubscribed) {
                   newSubs = ['all']; 
               } else {
                   newSubs = [];
               }
        } else {
            let temp = currentSubs.filter(s => s !== 'all');
            
            if (isSubscribed) {
                temp.push(designerId);
            } else {
                temp = temp.filter(id => id !== designerId);
            }
            newSubs = temp;
        }
  
        try {
            const userRef = doc(db, 'users', currentUser.uid);
            await updateDoc(userRef, {
                pwaSubscriptions: newSubs
            });
            setMessage({ type: 'success', text: '訂閱設定已更新' });
             setTimeout(() => window.location.reload(), 500);
        } catch (e) {
            console.error(e);
            setMessage({ type: 'error', text: '更新失敗' });
        }
    };
  
    const activePwaSubs = userProfile?.pwaSubscriptions || [];
    const pwaMasterEnabled = userProfile?.receivesPwaNotifications ?? false;
  
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
            const response = await fetch('/api/notify-booking', {
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
            
            setMessage({ type: 'success', text: 'PWA 推播已發送，請檢查您的裝置通知列。' });
        } catch (e: any) {
            console.error(e);
            setMessage({ type: 'error', text: `PWA 測試失敗: ${e.message}` });
        } finally {
            setIsSendingPwaTest(false);
        }
    };
  
    return (
      <div className="space-y-6">
         {/* Page Header */}
         <div className="mb-4">
              <h2 className="text-xl font-serif font-bold text-gray-900 flex items-center gap-2">
                  <BellAlertIcon className="w-6 h-6 text-yellow-500" /> 通知設定
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                  管理 LINE 通知與 PWA 裝置推播的接收規則。
              </p>
         </div>
  
         {/* Tabs */}
         <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8" aria-label="Tabs">
              <button
                onClick={() => setActiveTab('line')}
                className={`
                  whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors
                  ${activeTab === 'line'
                    ? 'border-[#06C755] text-[#06C755]'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}
                `}
              >
                <i className="fa-brands fa-line mr-2"></i> LINE 通知
              </button>
              <button
                onClick={() => setActiveTab('pwa')}
                className={`
                  whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors
                  ${activeTab === 'pwa'
                    ? 'border-[#9F9586] text-[#9F9586]'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}
                `}
              >
                <BellAlertIcon className="w-4 h-4 inline-block mr-2" />
                PWA 推播
              </button>
            </nav>
         </div>
  
         {message && (
            <div className={`p-4 rounded-lg text-sm flex items-center gap-2 ${message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
               {message.type === 'success' ? <i className="fa-solid fa-check-circle"></i> : <i className="fa-solid fa-circle-exclamation"></i>}
               {message.text}
            </div>
         )}
  
         {/* Tab Content */}
         <div className="bg-white rounded-xl shadow-sm border border-[#EFECE5] p-6 max-w-3xl mx-auto min-h-[400px]">
            
            {/* --- LINE TAB --- */}
            {activeTab === 'line' && (
                <div className="space-y-6 fade-in">
                    <div className="bg-[#FAF9F6] p-4 rounded-lg border border-[#EFECE5]">
                      <p className="text-gray-700 text-sm leading-relaxed">
                        勾選您希望接收 LINE 預約通知的帳號。<br/>
                        <span className="text-xs text-gray-500">注意：此設定僅影響 "新預約通知" 發送到 LINE 群組/個人 的路由。</span>
                      </p>
                    </div>
  
                     {isLineLoading ? (
                         <div className="flex justify-center p-8"><LoadingSpinner /></div>
                     ) : (
                         <ul className="divide-y divide-gray-100">
                             {notificationTargetUser.map(user => (
                               <li key={user.id} className="py-4 flex items-center justify-between hover:bg-gray-50 -mx-2 px-2 rounded-lg transition-colors">
                                 <div className="flex items-center">                    
                                   <img 
                                     className="h-10 w-10 rounded-full mr-3 object-cover border border-gray-200" 
                                     src={user.profile.avatarUrl || `https://ui-avatars.com/api/?name=${user.profile.displayName}&background=random`} 
                                     alt="" 
                                   />
                                   <div>
                                     <p className="text-sm font-medium text-gray-900">{user.profile.displayName}</p>
                                     <p className="text-xs text-gray-500">{user.role}</p>
                                   </div>
                                 </div>
                                 <label className="relative inline-flex items-center cursor-pointer">
                                   <input
                                     type="checkbox"
                                     className="sr-only peer"
                                     checked={!!user.receivesAdminNotifications}
                                     onChange={() => handleToggleLineNotification(user.id, !!user.receivesAdminNotifications)}
                                   />
                                   <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-[#06C755]/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#06C755]"></div>
                                 </label>
                               </li>
                             ))}
                         </ul>
                     )}
  
                     <div className="mt-8 pt-6 border-t border-gray-100">
                         <button
                           onClick={handleSendTestMessage}
                           disabled={isTesting}
                           className="w-full sm:w-auto inline-flex items-center justification-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-[#06C755] hover:bg-[#05b34c] disabled:opacity-50"
                         >
                           {isTesting ? '發送中...' : '發送 LINE 測試訊息'}
                         </button>
                     </div>
                </div>
            )}
  
            {/* --- PWA TAB --- */}
            {activeTab === 'pwa' && (
                <div className="space-y-8 fade-in">
                    
                    {/* 1. Status & Permission */}
                    <div className="bg-[#FAF9F6] p-4 rounded-lg border border-[#EFECE5]">
                          <div className="flex items-center justify-between mb-2">
                               <h4 className="font-bold text-gray-900 text-sm">裝置權限狀態</h4>
                               <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${permission === 'granted' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                   {permission === 'granted' ? '已授權' : permission === 'denied' ? '已封鎖' : '未啟用'}
                               </span>
                          </div>
                          <p className="text-xs text-gray-500 mb-4">
                              必須先授權此瀏覽器接收通知，下方的設定才會生效。
                          </p>
                          {permission !== 'granted' && permission !== 'denied' && (
                              <button onClick={requestPermission} className="text-xs bg-[#9F9586] text-white px-3 py-1.5 rounded hover:bg-[#8a8175]">
                                  啟用本機通知權限
                              </button>
                          )}
                          {fcmToken && (
                               <button onClick={handleSendPwaTest} disabled={isSendingPwaTest} className="mt-2 text-xs border border-gray-300 text-gray-600 px-3 py-1.5 rounded hover:bg-gray-50 ml-2">
                                   {isSendingPwaTest ? '...' : '發送本機測試'}
                               </button>
                          )}
                    </div>
  
                    {/* 2. Master Switch */}
                    <div className="flex items-center justify-between py-2">
                        <div>
                            <h3 className="font-medium text-gray-900">接收 PWA 推播通知</h3>
                            <p className="text-sm text-gray-500">總開關，關閉後將不會收到任何預約推播。</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                             <input
                               type="checkbox"
                               className="sr-only peer"
                               checked={pwaMasterEnabled}
                               onChange={(e) => handleUpdatePwaMasterSwitch(e.target.checked)}
                             />
                             <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#9F9586]"></div>
                        </label>
                    </div>
  
                    <hr className="border-gray-100"/>
  
                    {/* 3. Subscriptions (Admin Only) */}
                    {isAdminOrManager ? (
                        <div className={`transition-opacity duration-300 ${!pwaMasterEnabled ? 'opacity-50 pointer-events-none' : ''}`}>
                            <h3 className="font-medium text-gray-900 mb-4">訂閱指定設計師的預約</h3>
                            <div className="space-y-3">
                                {/* Option: ALL */}
                                <div className="flex items-center">
                                    <input 
                                       id="sub-all" 
                                       type="checkbox" 
                                       checked={activePwaSubs.includes('all')}
                                       onChange={(e) => handleUpdatePwaSubscription('all', e.target.checked)}
                                       className="h-4 w-4 text-[#9F9586] focus:ring-[#9F9586] border-gray-300 rounded"
                                    />
                                    <label htmlFor="sub-all" className="ml-3 block text-sm font-medium text-gray-700">
                                        接收所有設計師的通知 (全部)
                                    </label>
                                </div>
  
                                {/* Designer List */}
                                <div className="pl-7 grid grid-cols-1 sm:grid-cols-2 gap-2">
                                    {designers.map(d => {
                                        const isChecked = activePwaSubs.includes('all') || activePwaSubs.includes(d.id);
                                        const isDisabled = activePwaSubs.includes('all'); // Disabled if ALL is checked
  
                                        return (
                                            <div key={d.id} className="flex items-center">
                                                <input 
                                                   id={`sub-${d.id}`} 
                                                   type="checkbox"
                                                   checked={isChecked}
                                                   disabled={isDisabled}
                                                   onChange={(e) => handleUpdatePwaSubscription(d.id, e.target.checked)}
                                                   className="h-4 w-4 text-[#9F9586] focus:ring-[#9F9586] border-gray-300 rounded disabled:bg-gray-100"
                                                />
                                                <label htmlFor={`sub-${d.id}`} className={`ml-3 block text-sm text-gray-700 ${isDisabled ? 'opacity-60' : ''}`}>
                                                    {d.name}
                                                </label>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="bg-blue-50 p-4 rounded-lg">
                            <p className="text-sm text-blue-800">
                               身為設計師，開啟推播後，您將會收到來自您自己的預約通知。
                            </p>
                        </div>
                    )}
  
                </div>
            )}
  
         </div>
      </div>
    );
  };

  export default NotificationSettings;
