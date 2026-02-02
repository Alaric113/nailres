import React, { useState } from 'react';
import { useAuthStore } from '../../store/authStore';
import { linkWithPopup, unlink } from 'firebase/auth';
import { googleProvider } from '../../lib/firebase';
import { ChevronLeftIcon } from '@heroicons/react/24/outline';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../../context/ToastContext';

const MemberSettingsPage: React.FC = () => {
    const { currentUser } = useAuthStore();
    const navigate = useNavigate();
    const { showToast } = useToast();
    const [isProcessing, setIsProcessing] = useState(false);

    const isGoogleLinked = currentUser?.providerData.some(p => p.providerId === 'google.com');
    const isLineLinked = currentUser?.providerData.some(p => p.providerId === 'oidc.line');

    const handleLinkGoogle = async () => {
        if (!currentUser) return;
        setIsProcessing(true);
        try {
            // Attempt to link Google account
            await linkWithPopup(currentUser, googleProvider);
            showToast('Google 帳號綁定成功！', 'success');
        } catch (error: any) {
            console.error(error);
            if (error.code === 'auth/credential-already-in-use') {
                showToast('此 Google 帳號已被其他使用者綁定，請換一個帳號。', 'error');
            } else if (error.code === 'auth/popup-blocked') {
                showToast('彈出視窗被阻擋，請允許後再試。', 'error');
            } else {
                showToast(`綁定失敗: ${error.message}`, 'error');
            }
        } finally {
            setIsProcessing(false);
        }
    };

    const handleUnlinkGoogle = async () => {
        if (!currentUser || !isLineLinked) {
            showToast('為了安全，必須保留至少一種登入方式 (LINE)。', 'error');
            return;
        }
        
        if (!window.confirm('確定要解除 Google 帳號綁定嗎？解除後您將無法使用 Google 登入。')) return;

        setIsProcessing(true);
        try {
            await unlink(currentUser, 'google.com');
            showToast('Google 帳號已解除綁定。', 'success');
        } catch (error: any) {
            console.error(error);
            showToast(`解除失敗: ${error.message}`, 'error');
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#FAF9F6] flex flex-col">
            {/* Header */}
            <div className="px-6 pt-6 pb-4 flex items-center gap-4 shrink-0">
                <button 
                    onClick={() => navigate('/member')}
                    className="p-2 rounded-full bg-white border border-[#EFECE5] text-gray-600 hover:bg-gray-50"
                >
                    <ChevronLeftIcon className="w-5 h-5" />
                </button>
                <h1 className="text-xl font-serif font-bold text-gray-900">帳號設定</h1>
            </div>

            <div className="flex-1 px-6 py-4 space-y-6">
                <section>
                    <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-3 px-1">帳號綁定</h2>
                    <div className="bg-white rounded-2xl border border-[#EFECE5] overflow-hidden">
                        {/* LINE Status (Read-only as it's the primary method) */}
                        <div className="p-4 flex items-center justify-between border-b border-gray-50">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-[#06C755]/10 flex items-center justify-center">
                                    <img src="https://upload.wikimedia.org/wikipedia/commons/4/41/LINE_logo.svg" alt="LINE" className="w-6 h-6" />
                                </div>
                                <div>
                                    <p className="font-bold text-gray-900">LINE 帳號</p>
                                    <p className="text-xs text-green-600 font-medium">已連結 (主要登入方式)</p>
                                </div>
                            </div>
                        </div>

                        {/* Google Status */}
                        <div className="p-4 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center">
                                    <img src="https://www.svgrepo.com/show/475656/google-color.svg" alt="Google" className="w-6 h-6" />
                                </div>
                                <div>
                                    <p className="font-bold text-gray-900">Google 帳號</p>
                                    <p className="text-xs text-gray-500">
                                        {isGoogleLinked ? '已連結' : '尚未連結'}
                                    </p>
                                </div>
                            </div>
                            
                            {isGoogleLinked ? (
                                <button
                                    onClick={handleUnlinkGoogle}
                                    disabled={isProcessing}
                                    className="px-3 py-1.5 text-xs font-bold text-red-500 bg-red-50 rounded-lg hover:bg-red-100 transition-colors disabled:opacity-50"
                                >
                                    解除綁定
                                </button>
                            ) : (
                                <button
                                    onClick={handleLinkGoogle}
                                    disabled={isProcessing}
                                    className="px-3 py-1.5 text-xs font-bold text-white bg-blue-600 rounded-lg hover:bg-blue-700 shadow-sm transition-colors disabled:opacity-50"
                                >
                                    {isProcessing ? '處理中...' : '立即綁定'}
                                </button>
                            )}
                        </div>
                    </div>
                    <p className="mt-3 px-2 text-[11px] text-gray-400 leading-relaxed">
                        綁定 Google 帳號後，若 LINE 無法登入時，您仍可透過 Google 登入您的會員帳號。
                    </p>
                </section>

                <section className="pt-4 border-t border-[#EFECE5]">
                     <div className="bg-white rounded-2xl border border-[#EFECE5] p-4">
                         <h3 className="text-sm font-bold text-gray-900 mb-2">安全說明</h3>
                         <ul className="text-xs text-gray-500 space-y-2 list-disc list-inside">
                             <li>建議綁定 Google 帳號以防 LINE 帳號失效導致無法登入。</li>
                             <li>一個 Google 帳號僅能綁定一個會員。</li>
                             <li>若需要更換綁定，請先解除目前的綁定後再重新連結。</li>
                         </ul>
                     </div>
                </section>
            </div>
        </div>
    );
};

export default MemberSettingsPage;
