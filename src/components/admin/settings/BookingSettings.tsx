import React, { useState, useEffect } from 'react';
import { ClipboardDocumentCheckIcon, BanknotesIcon, MegaphoneIcon, ChatBubbleLeftRightIcon, PencilSquareIcon } from '@heroicons/react/24/outline';
import { useGlobalSettings, type SeasonPassPromo, type SeasonPassFlexSettings, type ServiceNotice } from '../../../hooks/useGlobalSettings';
import { useServices } from '../../../hooks/useServices'; // Import services hook
import ImageUploader from '../ImageUploader'; // Import ImageUploader

const BookingSettings: React.FC = () => {
    const { services } = useServices(); // Fetch services for selection
    const { settings, isLoading, updateGlobalSettings } = useGlobalSettings();
    const [activeTab, setActiveTab] = useState<'booking' | 'payment' | 'promo' | 'lineFlex' | 'serviceNotice'>('booking'); // Added 'serviceNotice'
    
    // Form States
    const [notice, setNotice] = useState('');
    const [serviceNotices, setServiceNotices] = useState<ServiceNotice[]>([]); // Synced with settings
    
    // Draft Service Notice State
    const [editingNoticeId, setEditingNoticeId] = useState<string | null>(null);
    const [draftNotice, setDraftNotice] = useState<{serviceId: string, content: string}>({ serviceId: '', content: '' });

    const [bankInfo, setBankInfo] = useState({
        bankCode: '',
        bankName: '',
        accountNumber: '',
        accountName: '',
        note: ''
    });
    const [promo, setPromo] = useState<SeasonPassPromo>({
        enabled: false,
        title: '',
        description: '',
        ctaText: '了解更多',
        ctaLink: '/member/pass',
        imageUrl: ''
    });
    const [flexSettings, setFlexSettings] = useState<SeasonPassFlexSettings>({
        enabled: true,
        headerText: '',
        headerColor: '#9F9586',
        bodyTextTemplate: '',
        footerText: ''
    });

    const [isSaving, setIsSaving] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    // Load initial data
    useEffect(() => {
        if (!isLoading && settings) {
            setNotice(settings.bookingNotice || '');
            if (settings.serviceNotices) {
                setServiceNotices(settings.serviceNotices);
            }
            if (settings.bankInfo) {
                setBankInfo({
                    ...settings.bankInfo,
                    note: settings.bankInfo.note || '' // Ensure note exists
                });
            }
            if (settings.seasonPassPromo) {
                setPromo(settings.seasonPassPromo);
            }
            if (settings.seasonPassFlexMessage) {
                setFlexSettings(settings.seasonPassFlexMessage);
            }
        }
    }, [isLoading, settings]);

    const handleSave = async () => {
        setIsSaving(true);
        setMessage(null);
        try {
            await updateGlobalSettings({
                bookingNotice: notice,
                serviceNotices: serviceNotices, // Save array
                bankInfo: bankInfo,
                seasonPassPromo: promo,
                seasonPassFlexMessage: flexSettings
            });
            setMessage({ type: 'success', text: '設定已儲存' });
        } catch (e) {
            console.error(e);
            setMessage({ type: 'error', text: '儲存失敗' });
        } finally {
            setIsSaving(false);
        }
    };

    const handleSaveNotice = () => {
        if (!draftNotice.serviceId || !draftNotice.content) return;
        
        if (editingNoticeId) {
            setServiceNotices(prev => prev.map(item => 
                item.id === editingNoticeId 
                ? { ...item, serviceIds: [draftNotice.serviceId], content: draftNotice.content }
                : item
            ));
            setEditingNoticeId(null);
        } else {
            const newNotice: ServiceNotice = {
                id: Date.now().toString(),
                serviceIds: [draftNotice.serviceId],
                content: draftNotice.content,
                active: true
            };
            setServiceNotices([...serviceNotices, newNotice]);
        }
        setDraftNotice({ serviceId: '', content: '' });
    };

    const handleEditNotice = (notice: ServiceNotice) => {
        setEditingNoticeId(notice.id);
        setDraftNotice({
            serviceId: notice.serviceIds[0],
            content: notice.content
        });
    };

    const handleCancelEdit = () => {
        setEditingNoticeId(null);
        setDraftNotice({ serviceId: '', content: '' });
    };

    const handleDeleteNotice = (id: string) => {
        setServiceNotices(serviceNotices.filter(n => n.id !== id));
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
            <div className="flex border-b border-gray-200 mb-6 overflow-x-auto flex-wrap gap-1">
                <button
                    onClick={() => setActiveTab('booking')}
                    className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                        activeTab === 'booking' 
                        ? 'border-purple-600 text-purple-600' 
                        : 'border-transparent text-gray-500 hover:text-gray-700'
                    }`}
                >
                    預約須知(General)
                </button>
                <button
                    onClick={() => setActiveTab('serviceNotice')}
                    className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                        activeTab === 'serviceNotice' 
                        ? 'border-purple-600 text-purple-600' 
                        : 'border-transparent text-gray-500 hover:text-gray-700'
                    }`}
                >
                    個別服務注意事項
                </button>
                <button
                    onClick={() => setActiveTab('payment')}
                    className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                        activeTab === 'payment' 
                        ? 'border-purple-600 text-purple-600' 
                        : 'border-transparent text-gray-500 hover:text-gray-700'
                    }`}
                >
                    匯款資訊
                </button>
                <button
                    onClick={() => setActiveTab('promo')}
                    className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                        activeTab === 'promo' 
                        ? 'border-purple-600 text-purple-600' 
                        : 'border-transparent text-gray-500 hover:text-gray-700'
                    }`}
                >
                    季卡推廣
                </button>
                <button
                    onClick={() => setActiveTab('lineFlex')}
                    className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                        activeTab === 'lineFlex' 
                        ? 'border-purple-600 text-purple-600' 
                        : 'border-transparent text-gray-500 hover:text-gray-700'
                    }`}
                >
                    LINE 通知
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

                     {activeTab === 'serviceNotice' && (
                         <div className="space-y-6">
                             <div className={`p-4 rounded-lg border mb-4 ${editingNoticeId ? 'bg-purple-50 border-purple-100' : 'bg-blue-50 border-blue-100'}`}>
                                 <h3 className={`font-bold text-sm mb-2 ${editingNoticeId ? 'text-purple-900' : 'text-blue-900'}`}>
                                     {editingNoticeId ? '編輯服務注意事項' : '新增服務注意事項'}
                                 </h3>
                                 <div className="space-y-3">
                                     <div>
                                         <label className="block text-xs font-bold text-gray-500 mb-1">選擇服務</label>
                                         <select 
                                            value={draftNotice.serviceId} 
                                            onChange={(e) => setDraftNotice({...draftNotice, serviceId: e.target.value})}
                                            className="w-full border border-gray-300 rounded-md p-2 text-sm"
                                         >
                                             <option value="">請選擇...</option>
                                             {services.map(s => (
                                                 <option key={s.id} value={s.id}>{s.name} ({s.category})</option>
                                             ))}
                                         </select>
                                     </div>
                                     <div>
                                         <label className="block text-xs font-bold text-gray-500 mb-1">注意事項內容</label>
                                         <textarea 
                                             value={draftNotice.content}
                                             onChange={(e) => setDraftNotice({...draftNotice, content: e.target.value})}
                                             rows={6} 
                                             className="w-full border border-gray-300 rounded-md p-2 text-sm resize-none"
                                             placeholder="當客戶選擇此服務時，在下一步前會跳出此提示..."
                                         />
                                     </div>
                                     <div className="flex gap-2">
                                         <button 
                                            onClick={handleSaveNotice}
                                            disabled={!draftNotice.serviceId || !draftNotice.content}
                                            className={`${editingNoticeId ? 'bg-purple-600 hover:bg-purple-700' : 'bg-blue-600 hover:bg-blue-700'} text-white text-sm px-4 py-2 rounded-md disabled:bg-gray-300 disabled:cursor-not-allowed w-full md:w-auto transition-colors`}
                                         >
                                            {editingNoticeId ? '更新' : '新增'}
                                         </button>
                                         {editingNoticeId && (
                                             <button 
                                                onClick={handleCancelEdit}
                                                className="bg-gray-200 text-gray-700 text-sm px-4 py-2 rounded-md hover:bg-gray-300 w-full md:w-auto transition-colors"
                                             >
                                                取消
                                             </button>
                                         )}
                                     </div>
                                 </div>
                             </div>

                             <div className="space-y-4">
                                 <h3 className="font-bold text-gray-700 border-b pb-2">已設定的服務注意事項</h3>
                                 {serviceNotices.length === 0 ? (
                                     <p className="text-gray-400 text-sm text-center py-4">尚未設定任何注意事項</p>
                                 ) : (
                                     serviceNotices.map((item) => {
                                         const serviceName = services.find(s => s.id === item.serviceIds[0])?.name || '未知服務';
                                         const isEditing = item.id === editingNoticeId;
                                         return (
                                             <div key={item.id} className={`border rounded-lg p-3 transition-colors flex justify-between gap-4 ${isEditing ? 'border-purple-300 bg-purple-50' : 'border-gray-200 hover:bg-gray-50'}`}>
                                                 <div className="flex-1">
                                                     <div className="flex items-center gap-2 mb-1">
                                                        <span className="bg-purple-100 text-purple-700 text-xs px-2 py-0.5 rounded font-bold">
                                                            {serviceName}
                                                        </span>
                                                     </div>
                                                     <p className="text-sm text-gray-700 whitespace-pre-wrap">{item.content}</p>
                                                 </div>
                                                 <div className="flex flex-col gap-2">
                                                     <button 
                                                        onClick={() => handleEditNotice(item)}
                                                        className="text-gray-400 hover:text-purple-600 self-start"
                                                        title="編輯"
                                                        disabled={!!editingNoticeId && !isEditing}
                                                     >
                                                         <PencilSquareIcon className="w-5 h-5" />
                                                     </button>
                                                     <button 
                                                        onClick={() => handleDeleteNotice(item.id)}
                                                        className="text-gray-400 hover:text-red-600 self-start"
                                                        title="刪除"
                                                        disabled={!!editingNoticeId} // Disable delete while editing
                                                     >
                                                          ✕
                                                     </button>
                                                 </div>
                                             </div>
                                         );
                                     })
                                 )}
                             </div>
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
                            
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">匯款說明</label>
                                <textarea 
                                    rows={3}
                                    className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-purple-200 focus:border-purple-500 outline-none resize-none"
                                    placeholder="例如：請於匯款後告知末五碼"
                                    value={bankInfo.note || ''}
                                    onChange={(e) => setBankInfo({...bankInfo, note: e.target.value})}
                                />
                            </div>
                            
                            <p className="text-xs text-gray-500 mt-2 bg-gray-50 p-2 rounded">
                                此資訊將顯示於季卡購買頁面，供顧客匯款參考。
                            </p>
                        </div>
                     )}

                     {activeTab === 'lineFlex' && (
                        <div className="space-y-4">
                            <div className="flex items-center gap-2 mb-4 text-gray-800 font-bold border-b pb-2">
                                <ChatBubbleLeftRightIcon className="w-5 h-5 text-green-600" />
                                <span>訂單確認通知 (Flex Message)</span>
                            </div>
                            <p className="text-xs text-gray-500 -mt-2 mb-4">
                               設定下單成功後發送給客戶的 LINE 訊息樣式。
                            </p>

                            {/* Enabled Toggle */}
                            <div className="flex items-center gap-3 py-2">
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input 
                                        type="checkbox"
                                        checked={flexSettings.enabled}
                                        onChange={(e) => setFlexSettings({...flexSettings, enabled: e.target.checked})}
                                        className="sr-only peer"
                                    />
                                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                                </label>
                                <span className="text-sm font-medium text-gray-700">啟用 LINE 通知</span>
                            </div>

                             <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">標題文字</label>
                                    <input 
                                        type="text"
                                        className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-purple-200 focus:border-purple-500 outline-none"
                                        placeholder="例如：季卡訂單成立"
                                        value={flexSettings.headerText}
                                        onChange={(e) => setFlexSettings({...flexSettings, headerText: e.target.value})}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">標題背景色 (Hex)</label>
                                    <div className="flex gap-2">
                                        <input 
                                            type="color"
                                            className="h-9 w-9 p-1 rounded cursor-pointer border border-gray-300"
                                            value={flexSettings.headerColor}
                                            onChange={(e) => setFlexSettings({...flexSettings, headerColor: e.target.value})}
                                        />
                                        <input 
                                            type="text"
                                            className="w-full border border-gray-300 rounded-lg p-2 text-sm font-mono focus:ring-2 focus:ring-purple-200 focus:border-purple-500 outline-none uppercase"
                                            placeholder="#9F9586"
                                            value={flexSettings.headerColor}
                                            onChange={(e) => setFlexSettings({...flexSettings, headerColor: e.target.value})}
                                        />
                                    </div>
                                </div>
                            </div>

                             <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">內容模板</label>
                                <p className="text-xs text-gray-500 mb-2">可用變數：{'{{customerName}}'}, {'{{passName}}'}, {'{{variantName}}'}, {'{{price}}'}, {'{{bankInfo}}'}</p>
                                <textarea 
                                    rows={6}
                                    className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-purple-200 focus:border-purple-500 outline-none"
                                    placeholder="輸入訊息內容..."
                                    value={flexSettings.bodyTextTemplate}
                                    onChange={(e) => setFlexSettings({...flexSettings, bodyTextTemplate: e.target.value})}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">頁尾文字</label>
                                <input 
                                    type="text"
                                    className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-purple-200 focus:border-purple-500 outline-none"
                                    placeholder="例如：如有疑問請聯繫客服"
                                    value={flexSettings.footerText}
                                    onChange={(e) => setFlexSettings({...flexSettings, footerText: e.target.value})}
                                />
                            </div>
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
                            
                            {/* Promo Image */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">推廣圖片</label>
                                <p className="text-xs text-gray-500 mb-2">上傳圖片將取代預設的星形圖示。</p>
                                <ImageUploader
                                    label="上傳圖片"
                                    imageUrl={promo.imageUrl || ''}
                                    onImageUrlChange={(url) => setPromo({...promo, imageUrl: url})}
                                    storagePath="globals/promo"
                                    compact
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4 hidden">
                                
                                <div>
                                    <label className="block text-sm  font-medium text-gray-700 mb-1">按鈕連結</label>
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

