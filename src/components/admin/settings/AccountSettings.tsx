import React, { useState } from 'react';
import { useAuthStore } from '../../../store/authStore';
import { linkWithPopup } from 'firebase/auth';
import { googleProvider } from '../../../lib/firebase';
import { ShieldCheckIcon } from '@heroicons/react/24/outline'; // Adjust import path if needed

const AccountSettings: React.FC = () => {
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

export default AccountSettings;
