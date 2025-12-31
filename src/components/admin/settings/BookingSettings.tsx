import React, { useState, useEffect } from 'react';
import { ClipboardDocumentCheckIcon, BanknotesIcon, MegaphoneIcon } from '@heroicons/react/24/outline';
import { useGlobalSettings, type SeasonPassPromo } from '../../../hooks/useGlobalSettings';

const BookingSettings: React.FC = () => {
    const { settings, isLoading, updateGlobalSettings } = useGlobalSettings();
    const [activeTab, setActiveTab] = useState<'booking' | 'payment' | 'promo'>('booking');
    
    // Form States
    const [notice, setNotice] = useState('');
    const [bankInfo, setBankInfo] = useState({
        bankCode: '',
        bankName: '',
        accountNumber: '',
        accountName: ''
    });
    const [promo, setPromo] = useState<SeasonPassPromo>({
        enabled: false,
        title: '',
        description: '',
        ctaText: '了解更多',
        ctaLink: '/member/pass',
        imageUrl: ''
    });

    const [isSaving, setIsSaving] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    // Load initial data
    useEffect(() => {
        if (!isLoading && settings) {
            setNotice(settings.bookingNotice || '');
            if (settings.bankInfo) {
                setBankInfo(settings.bankInfo);
            }
            if (settings.seasonPassPromo) {
                setPromo(settings.seasonPassPromo);
            }
        }
    }, [isLoading, settings]);

    const handleSave = async () => {
        setIsSaving(true);
        setMessage(null);
        try {
            await updateGlobalSettings({
                bookingNotice: notice,
                bankInfo: bankInfo,
                seasonPassPromo: promo
            });
            setMessage({ type: 'success', text: '設定已儲存' });
        } catch (e) {
            console.error(e);
            setMessage({ type: 'error', text: '儲存失敗' });
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) return <div>載入中...</div>;

    return (
        <div className="space-y-6">
             <div className="mb-6">
                 <h2 className="text-xl font-serif font-bold text-gray-900 flex items-center gap-2">
                     <ClipboardDocumentCheckIcon className="w-6 h-6 text-purple-600" /> 預約與推廣設定
                 </h2>
                 <p className="text-sm text-gray-500 mt-1 ml-8">
                     管理預約須知、匯款帳號、以及季卡推廣內容。
                 </p>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-gray-200 mb-6">
                <button
                    onClick={() => setActiveTab('booking')}
                    className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                        activeTab === 'booking' 
                        ? 'border-purple-600 text-purple-600' 
                        : 'border-transparent text-gray-500 hover:text-gray-700'
                    }`}
                >
                    預約須知
                </button>
                <button
                    onClick={() => setActiveTab('payment')}
                    className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                        activeTab === 'payment' 
                        ? 'border-purple-600 text-purple-600' 
                        : 'border-transparent text-gray-500 hover:text-gray-700'
                    }`}
                >
                    匯款資訊
                </button>
                <button
                    onClick={() => setActiveTab('promo')}
                    className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                        activeTab === 'promo' 
                        ? 'border-purple-600 text-purple-600' 
                        : 'border-transparent text-gray-500 hover:text-gray-700'
                    }`}
                >
                    季卡推廣
                </button>
            </div>
            
            <div className="bg-white rounded-xl shadow-sm border border-[#EFECE5] p-6 max-w-2xl">
                 <div className="space-y-6">
                     
                     {activeTab === 'booking' && (
                         <div>
                             <label className="block text-sm font-bold text-gray-700 mb-2">預約注意事項 (Confirmation Notice)</label>
                             <p className="text-xs text-gray-500 mb-2">當顧客點擊「確認預約」時，會彈出此內容要求顧客確認。留空則不會顯示。</p>
                             <textarea 
                                 rows={8}
                                 className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-purple-200 focus:border-purple-500 outline-none"
                                 placeholder="例如：請勿遲到超過10分鐘，取消請提前24小時告知..."
                                 value={notice}
                                 onChange={(e) => setNotice(e.target.value)}
                             />
                         </div>
                     )}

                     {activeTab === 'payment' && (
                        <div className="space-y-4">
                            <div className="flex items-center gap-2 mb-4 text-gray-800 font-bold border-b pb-2">
                                <BanknotesIcon className="w-5 h-5 text-gray-500" />
                                <span>匯款帳號設定</span>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">銀行代碼</label>
                                    <input 
                                        type="text"
                                        className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-purple-200 focus:border-purple-500 outline-none"
                                        placeholder="例如：822"
                                        value={bankInfo.bankCode}
                                        onChange={(e) => setBankInfo({...bankInfo, bankCode: e.target.value})}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">銀行名稱</label>
                                    <input 
                                        type="text"
                                        className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-purple-200 focus:border-purple-500 outline-none"
                                        placeholder="例如：中國信託"
                                        value={bankInfo.bankName}
                                        onChange={(e) => setBankInfo({...bankInfo, bankName: e.target.value})}
                                    />
                                </div>
                            </div>
                            
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">銀行帳號</label>
                                <input 
                                    type="text"
                                    className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-purple-200 focus:border-purple-500 outline-none"
                                    placeholder="例如：123-456-789012"
                                    value={bankInfo.accountNumber}
                                    onChange={(e) => setBankInfo({...bankInfo, accountNumber: e.target.value})}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">戶名</label>
                                <input 
                                    type="text"
                                    className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-purple-200 focus:border-purple-500 outline-none"
                                    placeholder="例如：美甲沙龍有限公司"
                                    value={bankInfo.accountName}
                                    onChange={(e) => setBankInfo({...bankInfo, accountName: e.target.value})}
                                />
                            </div>
                            
                            <p className="text-xs text-gray-500 mt-2 bg-gray-50 p-2 rounded">
                                此資訊將顯示於季卡購買頁面，供顧客匯款參考。
                            </p>
                        </div>
                     )}

                     {activeTab === 'promo' && (
                        <div className="space-y-4">
                            <div className="flex items-center gap-2 mb-4 text-gray-800 font-bold border-b pb-2">
                                <MegaphoneIcon className="w-5 h-5 text-rose-500" />
                                <span>季卡推廣卡片</span>
                            </div>
                            <p className="text-xs text-gray-500 -mt-2 mb-4">
                                此推廣卡片將顯示於預約頁面的服務列表中，僅對「尚未擁有季卡」的用戶顯示。
                            </p>

                            {/* Enabled Toggle */}
                            <div className="flex items-center gap-3 py-2">
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input 
                                        type="checkbox"
                                        checked={promo.enabled}
                                        onChange={(e) => setPromo({...promo, enabled: e.target.checked})}
                                        className="sr-only peer"
                                    />
                                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                                </label>
                                <span className="text-sm font-medium text-gray-700">啟用推廣卡片</span>
                            </div>

                            {/* Title */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">標題</label>
                                <input 
                                    type="text"
                                    className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-purple-200 focus:border-purple-500 outline-none"
                                    placeholder="例如：成為會員享專屬優惠"
                                    value={promo.title}
                                    onChange={(e) => setPromo({...promo, title: e.target.value})}
                                />
                            </div>

                            {/* Description */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">描述</label>
                                <textarea 
                                    rows={3}
                                    className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-purple-200 focus:border-purple-500 outline-none resize-none"
                                    placeholder="例如：購買季卡即享多項專屬服務與優惠折扣..."
                                    value={promo.description}
                                    onChange={(e) => setPromo({...promo, description: e.target.value})}
                                />
                            </div>

                            {/* CTA */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">按鈕文字</label>
                                    <input 
                                        type="text"
                                        className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-purple-200 focus:border-purple-500 outline-none"
                                        placeholder="例如：了解更多"
                                        value={promo.ctaText}
                                        onChange={(e) => setPromo({...promo, ctaText: e.target.value})}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">按鈕連結</label>
                                    <input 
                                        type="text"
                                        className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-purple-200 focus:border-purple-500 outline-none"
                                        placeholder="例如：/member/pass"
                                        value={promo.ctaLink}
                                        onChange={(e) => setPromo({...promo, ctaLink: e.target.value})}
                                    />
                                </div>
                            </div>
                        </div>
                     )}

                     {message && (
                        <div className={`p-3 rounded-lg text-sm ${message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                            {message.text}
                        </div>
                     )}

                     <div className="flex justify-end pt-4 border-t border-gray-100">
                         <button 
                             onClick={handleSave}
                             disabled={isSaving}
                             className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 transition-colors font-medium text-sm"
                         >
                             {isSaving ? '儲存中...' : '儲存設定'}
                         </button>
                     </div>
                 </div>
            </div>
        </div>
    );
};

export default BookingSettings;

