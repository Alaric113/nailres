import React, { useState, useEffect } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../../../lib/firebase';
import { ClipboardDocumentCheckIcon } from '@heroicons/react/24/outline'; // Adjusted import

const BookingSettings: React.FC = () => {
    const [notice, setNotice] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    useEffect(() => {
        const fetchSettings = async () => {
             try {
                const docRef = doc(db, 'globals', 'settings');
                const snap = await getDoc(docRef);
                if (snap.exists()) {
                    setNotice(snap.data().bookingNotice || '');
                }
             } catch(e) {
                 console.error(e);
             }
        };
        fetchSettings();
    }, []);

    const handleSave = async () => {
        setIsSaving(true);
        setMessage(null);
        try {
            await setDoc(doc(db, 'globals', 'settings'), {
                bookingNotice: notice
            }, { merge: true });
            setMessage({ type: 'success', text: '預約注意事項已儲存' });
        } catch (e) {
            console.error(e);
            setMessage({ type: 'error', text: '儲存失敗' });
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="space-y-6">
             <div className="mb-6">
                 <h2 className="text-xl font-serif font-bold text-gray-900 flex items-center gap-2">
                     <ClipboardDocumentCheckIcon className="w-6 h-6 text-purple-600" /> 預約設定
                 </h2>
                 <p className="text-sm text-gray-500 mt-1 ml-8">
                     設定顧客在確認預約前看到的注意事項或條款。
                 </p>
            </div>
            
            <div className="bg-white rounded-xl shadow-sm border border-[#EFECE5] p-6 max-w-2xl">
                 <div className="space-y-4">
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

                     {message && (
                        <div className={`p-3 rounded-lg text-sm ${message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                            {message.text}
                        </div>
                     )}

                     <div className="flex justify-end pt-4">
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
