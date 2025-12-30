import React, { useState } from 'react';
import type { SeasonPass, SeasonPassVariant, PlanContentItem } from '../../types/seasonPass';
import { useServices } from '../../hooks/useServices';
import { PlusIcon, TrashIcon, PhotoIcon, BoltIcon } from '@heroicons/react/24/outline';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore'; 
import { db } from '../../lib/firebase';
import { v4 as uuidv4 } from 'uuid';

interface PlanFormProps {
    plan?: SeasonPass | null;
    onClose: () => void;
    onSave: (data: Omit<SeasonPass, 'id'>) => Promise<void>;
}

const PlanForm: React.FC<PlanFormProps> = ({ plan, onClose, onSave }) => {
    const { services } = useServices(); // To link content items to services
    const [isLoading, setIsLoading] = useState(false);
    const [uploading, setUploading] = useState(false);

    // Form State
    const [name, setName] = useState(plan?.name || '');
    const [duration, setDuration] = useState(plan?.duration || '3個月');
    const [note, setNote] = useState(plan?.note || '');
    const [color, setColor] = useState(plan?.color || '#9F9586');
    const [isActive, setIsActive] = useState(plan?.isActive ?? true);
    const [imageUrl, setImageUrl] = useState(plan?.imageUrl || '');
    
    // Tab State
    const [activeTab, setActiveTab] = useState<'basic' | 'variants' | 'content'>('basic');

    // Quick Add Service State
    const [showQuickAdd, setShowQuickAdd] = useState(false);
    const [quickServiceName, setQuickServiceName] = useState('');
    const [quickServiceDuration, setQuickServiceDuration] = useState(60);
    const [quickServiceLoading, setQuickServiceLoading] = useState(false);
    const [pendingQuickAddIndex, setPendingQuickAddIndex] = useState<number | null>(null); // Index of content item to auto-fill
    
    // Dynamic Lists
    const [variants, setVariants] = useState<SeasonPassVariant[]>(plan?.variants || [{ name: '一般', price: 0 }]);
    const [contentItems, setContentItems] = useState<PlanContentItem[]>(plan?.contentItems || []);
    
    // Handlers for Variants
    const addVariant = () => {
        setVariants([...variants, { name: '', price: 0 }]);
    };

    const updateVariant = (index: number, field: keyof SeasonPassVariant, value: any) => {
        const newVariants = [...variants];
        newVariants[index] = { ...newVariants[index], [field]: value };
        setVariants(newVariants);
    };

    const removeVariant = (index: number) => {
        setVariants(variants.filter((_, i) => i !== index));
    };

    // Handlers for Content Items
    const addContentItem = () => {
        setContentItems([...contentItems, { 
            id: uuidv4(), 
            name: '', 
            category: '服務', 
            benefitType: 'standalone',
            quantity: 1 
        }]);
    };

    const updateContentItem = (index: number, field: keyof PlanContentItem, value: any) => {
        const newItems = [...contentItems];
        if (field === 'serviceId') {
            // Auto-fill name if service selected
            const service = services.find(s => s.id === value);
            if (service) {
                newItems[index].name = service.name;
            }
        }
        newItems[index] = { ...newItems[index], [field]: value };
        setContentItems(newItems);
    };

    const removeContentItem = (index: number) => {
        setContentItems(contentItems.filter((_, i) => i !== index));
    };

    // Image Upload
    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploading(true);
        try {
            const storage = getStorage();
            const storageRef = ref(storage, `plans/${uuidv4()}_${file.name}`);
            await uploadBytes(storageRef, file);
            const url = await getDownloadURL(storageRef);
            setImageUrl(url);
        } catch (error) {
            console.error("Upload failed", error);
            alert("圖片上傳失敗");
        } finally {
            setUploading(false);
        }
    };

    const handleQuickAddService = async () => {
        if (!quickServiceName) return;
        setQuickServiceLoading(true);
        try {
            const newServiceData = {
                name: quickServiceName,
                duration: quickServiceDuration,
                description: '快速建立的方案專屬服務',
                price: 0, // Default to 0 for plan services (usually just for redemption)
                category: '其他',
                isPlanOnly: true, // Key: Hidden from public booking
                createdAt: serverTimestamp(),
                order: 999
            };
            
            const docRef = await addDoc(collection(db, 'services'), newServiceData);
            
            // If we were trying to add to a specific index, auto-select it
            if (pendingQuickAddIndex !== null) {
                updateContentItem(pendingQuickAddIndex, 'serviceId', docRef.id);
                // Also update the name to mirror the service name immediately (optimistic update)
                const newItems = [...contentItems];
                newItems[pendingQuickAddIndex].name = quickServiceName;
                setContentItems(newItems);
            }

            // Reset
            setQuickServiceName('');
            setQuickServiceDuration(60);
            setShowQuickAdd(false);
            setPendingQuickAddIndex(null);
        } catch (error) {
            console.error("Quick add failed", error);
            alert("快速新增失敗");
        } finally {
            setQuickServiceLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            const formData: Omit<SeasonPass, 'id'> = {
                name,
                duration,
                note,
                color,
                isActive,
                imageUrl,
                variants,
                contentItems,
                order: plan?.order || 99
            };
            const cleanData = JSON.parse(JSON.stringify(formData));
            await onSave(cleanData);
            onClose();
        } catch (error) {
            console.error(error);
            alert("儲存失敗");
        } finally {
            setIsLoading(false);
        }
    };


    return (
        <>
            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Tabs Header */}
                <div className="border-b border-gray-200">
                    <nav className="-mb-px flex space-x-8">
                        <button
                            type="button"
                            onClick={() => setActiveTab('basic')}
                            className={`py-4 px-1 border-b-2 font-medium text-sm ${
                                activeTab === 'basic'
                                    ? 'border-primary text-primary'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                            }`}
                        >
                            基本資訊
                        </button>
                        <button
                             type="button"
                             onClick={() => setActiveTab('variants')}
                             className={`py-4 px-1 border-b-2 font-medium text-sm ${
                                 activeTab === 'variants'
                                     ? 'border-primary text-primary'
                                     : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                             }`}
                        >
                             價格方案
                        </button>
                        <button
                             type="button"
                             onClick={() => setActiveTab('content')}
                             className={`py-4 px-1 border-b-2 font-medium text-sm ${
                                 activeTab === 'content'
                                     ? 'border-primary text-primary'
                                     : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                             }`}
                        >
                             包含內容
                        </button>
                    </nav>
                </div>

                <div className="min-h-[400px]">
                    {/* Basic Info Tab */}
                    {activeTab === 'basic' && (
                        <div className="space-y-6 max-w-2xl">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">方案名稱</label>
                        <input 
                            type="text" 
                            required
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                            placeholder="例如 初卡"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">有效期限</label>
                        <div className="flex items-center gap-2">
                            <input 
                            type="number" 
                            required
                            value={duration}
                            onChange={(e) => setDuration(e.target.value)}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                            placeholder="例如 3"
                        />
                        <span className="text-sm text-gray-500 text-nowrap">個月</span>
                        </div>
                    </div>
                    <div >
                        <label className="block text-sm font-medium text-gray-700">備註/說明</label>
                        <textarea 
                            value={note}
                            onChange={(e) => setNote(e.target.value)}
                            rows={3}
                            className="mt-1 block w-full border rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                        />
                    </div>
                    <div className="hidden">
                        <label className="block text-sm font-medium text-gray-700">代表顏色</label>
                        <input 
                            type="color" 
                            value={color}
                            onChange={(e) => setColor(e.target.value)}
                            className="mt-1 block w-full h-10 p-1 rounded-md border border-gray-300 cursor-pointer"
                        />
                    </div>
                    <div className="flex items-center gap-2">
                        <input 
                            type="checkbox"
                            id="isActive"
                            checked={isActive}
                            onChange={(e) => setIsActive(e.target.checked)}
                            className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                        />
                        <label htmlFor="isActive" className="text-sm text-gray-700">啟用此方案</label>
                    </div>

                    {/* Image Upload */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700">方案圖片 (選填)</label>
                        <div className="mt-1 flex items-center gap-4">
                            {imageUrl && (
                                <img src={imageUrl} alt="Preview" className="h-20 w-20 object-cover rounded-md border" />
                            )}
                            <label className="cursor-pointer flex items-center gap-2 px-4 py-2 bg-gray-50 hover:bg-gray-100 border border-gray-300 rounded-md transition-colors">
                                <PhotoIcon className="w-5 h-5 text-gray-500" />
                                <span className="text-sm text-gray-600">{uploading ? '上傳中...' : '選擇圖片'}</span>
                                <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
                            </label>
                        </div>
                    </div>
                </div>
                    )}

                    {/* Variants Tab */}
                    {activeTab === 'variants' && (
                         <div className="space-y-6 max-w-3xl">
                        <div className="flex justify-between items-center mb-3">
                            <h3 className="text-sm font-bold text-gray-700">價格方案 (Variants)</h3>
                            <button type="button" onClick={addVariant} className="text-xs text-primary hover:text-primary-dark font-medium flex items-center gap-1">
                                <PlusIcon className="w-3 h-3" /> 新增方案
                            </button>
                        </div>
                        <div className="space-y-2 max-h-48 overflow-y-auto">
                            {variants.map((v, idx) => (
                                <div key={idx} className="flex flex-col md:flex-row items-start md:items-center gap-2 pb-4 md:pb-0 border-b md:border-none border-gray-100 last:border-0">
                                    <input 
                                        type="text" 
                                        placeholder="名稱 (e.g. 120本)"
                                        value={v.name}
                                        onChange={(e) => updateVariant(idx, 'name', e.target.value)}
                                        className="w-full md:flex-1 md:min-w-[80px] rounded border-gray-300 text-sm py-1"
                                    />
                                    <div className="flex w-full md:w-auto gap-2">
                                        <input 
                                            type="number" 
                                            placeholder="價格"
                                            value={v.price}
                                            onChange={(e) => updateVariant(idx, 'price', Number(e.target.value))}
                                            className="w-full md:w-24 rounded border-gray-300 text-sm py-1"
                                        />
                                        <input 
                                            type="number" 
                                            placeholder="原價 (選填)"
                                            value={v.originalPrice || ''}
                                            onChange={(e) => updateVariant(idx, 'originalPrice', Number(e.target.value))}
                                            className="w-full md:w-24 rounded border-gray-300 text-sm py-1"
                                        />
                                    </div>
                                    <button type="button" onClick={() => removeVariant(idx)} className="text-red-400 hover:text-red-600 self-end md:self-center p-1">
                                        <TrashIcon className="w-4 h-4" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>


                    )}

                    {/* Content Items Tab */}
                    {activeTab === 'content' && (
                        <div className="space-y-6 max-w-3xl">
                            <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
                                <div className="flex justify-between items-center mb-4">
                                    <h3 className="text-sm font-bold text-gray-700">包含內容</h3>
                                    <button type="button" onClick={addContentItem} className="text-xs text-primary hover:text-primary-dark font-medium flex items-center gap-1">
                                        <PlusIcon className="w-3 h-3" /> 新增項目
                                    </button>
                                </div>
                                <div className="space-y-3 max-h-[400px] overflow-y-auto">
                                    {contentItems.map((item, idx) => (
                                        <div key={item.id} className="bg-white p-3 rounded-lg border border-gray-200 text-sm space-y-3">
                                            {/* Row 1: Category + BenefitType + Delete */}
                                            <div className="flex flex-wrap gap-2 items-center">
                                                <select 
                                                    value={item.category}
                                                    onChange={(e) => updateContentItem(idx, 'category', e.target.value as '服務' | '權益')}
                                                    className="text-xs border-none bg-indigo-50 text-indigo-700 font-bold rounded px-2 py-1 focus:ring-0"
                                                >
                                                    <option value="服務">🎫 服務</option>
                                                    <option value="權益">⭐ 權益</option>
                                                </select>
                                                <select 
                                                    value={item.benefitType || 'standalone'}
                                                    onChange={(e) => updateContentItem(idx, 'benefitType', e.target.value)}
                                                    className="text-xs border-none bg-amber-50 text-amber-700 font-bold rounded px-2 py-1 focus:ring-0"
                                                >
                                                    <option value="standalone">獨立使用</option>
                                                    <option value="upgrade">附加升級</option>
                                                    <option value="discount">折扣券</option>
                                                </select>
                                                <button type="button" onClick={() => removeContentItem(idx)} className="text-red-400 hover:text-red-600 ml-auto">
                                                    <TrashIcon className="w-4 h-4" />
                                                </button>
                                            </div>

                                            {/* Row 2: Content based on benefitType */}
                                            <div className="space-y-2">
                                                {/* 獨立使用: Select service */}
                                                {item.benefitType === 'standalone' && (
                                                    <div className="flex flex-col gap-2">
                                                        <select
                                                            value={item.serviceId || ''}
                                                            onChange={(e) => updateContentItem(idx, 'serviceId', e.target.value || undefined)}
                                                            className="w-full rounded border-gray-300 text-sm py-1.5"
                                                        >
                                                            <option value="">選擇服務...</option>
                                                            {services.map(s => (
                                                                <option key={s.id} value={s.id}>{s.name}</option>
                                                            ))}
                                                        </select>
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                setShowQuickAdd(true);
                                                                setPendingQuickAddIndex(idx);
                                                            }}
                                                            className="text-xs text-primary hover:text-primary-dark font-medium flex items-center gap-1 self-start"
                                                        >
                                                            <BoltIcon className="w-3 h-3" /> 快速建立隱藏服務
                                                        </button>
                                                    </div>
                                                )}

                                                {/* 附加升級: Select service + add-on option */}
                                                {item.benefitType === 'upgrade' && (
                                                    <div className="flex flex-col md:flex-row gap-2">
                                                        <select
                                                            value={item.appliesTo || ''}
                                                            onChange={(e) => {
                                                                updateContentItem(idx, 'appliesTo', e.target.value || undefined);
                                                                updateContentItem(idx, 'upgradeOptionId', undefined);
                                                            }}
                                                            className="flex-1 rounded border-gray-300 text-sm py-1.5"
                                                        >
                                                            <option value="">選擇服務...</option>
                                                            {services.filter(s => s.options && s.options.length > 0).map(s => (
                                                                <option key={s.id} value={s.id}>{s.name}</option>
                                                            ))}
                                                        </select>
                                                        {item.appliesTo && (() => {
                                                            const selectedService = services.find(s => s.id === item.appliesTo);
                                                            const allOptions = selectedService?.options?.flatMap(opt => 
                                                                opt.items.map(optItem => ({ ...optItem, optionGroupName: opt.name }))
                                                            ) || [];
                                                            return (
                                                                <select
                                                                    value={item.upgradeOptionId || ''}
                                                                    onChange={(e) => updateContentItem(idx, 'upgradeOptionId', e.target.value || undefined)}
                                                                    className="flex-1 rounded border-gray-300 text-sm py-1.5"
                                                                >
                                                                    <option value="">選擇附加項目...</option>
                                                                    {allOptions.map(opt => (
                                                                        <option key={opt.id} value={opt.id}>
                                                                            {opt.optionGroupName}: {opt.name} (+${opt.price})
                                                                        </option>
                                                                    ))}
                                                                </select>
                                                            );
                                                        })()}
                                                    </div>
                                                )}

                                                {/* 折扣券: Link to coupon (placeholder) */}
                                                {item.benefitType === 'discount' && (
                                                    <div className="text-xs text-gray-400 italic py-2">
                                                        優惠券連結功能開發中...
                                                    </div>
                                                )}
                                            </div>

                                            {/* Row 3: Name + Quantity (for 服務 category) */}
                                            <div className="flex flex-col md:flex-row gap-2">
                                                <input 
                                                    type="text" 
                                                    placeholder="顯示名稱 (例: 3次完整睫毛嫁接)"
                                                    value={item.name}
                                                    onChange={(e) => updateContentItem(idx, 'name', e.target.value)}
                                                    className="flex-1 rounded border-gray-300 text-sm py-1.5"
                                                />
                                                {item.category === '服務' && item.benefitType === 'standalone' && (
                                                    <>
                                                        <input 
                                                            type="number" 
                                                            placeholder="次數"
                                                            value={item.quantity || 1}
                                                            min={1}
                                                            onChange={(e) => updateContentItem(idx, 'quantity', Number(e.target.value))}
                                                            className="w-full md:w-20 rounded border-gray-300 text-sm py-1.5"
                                                        />
                                                        <input 
                                                            type="number" 
                                                            placeholder="每月限"
                                                            value={item.monthlyLimit || ''}
                                                            min={0}
                                                            onChange={(e) => updateContentItem(idx, 'monthlyLimit', e.target.value ? Number(e.target.value) : undefined)}
                                                            className="w-full md:w-20 rounded border-gray-300 text-sm py-1.5"
                                                            title="每月使用限制 (0=無限制)"
                                                        />
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
                </div>

            <div className="flex justify-end gap-3 pt-6 border-t border-gray-100">
                <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                >
                    取消
                </button>
                <button
                    type="submit"
                    disabled={isLoading}
                    className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary-dark transition-colors shadow-sm disabled:opacity-50"
                >
                    {isLoading ? '儲存中...' : '儲存方案'}
                </button>
            </div>
        </form>
        
        {/* Quick Add Service Modal */}
        {showQuickAdd && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
                <div className="bg-white rounded-lg p-6 w-80 shadow-xl border border-gray-200">
                    <h3 className="text-lg font-bold text-gray-800 mb-4">快速新增隱藏服務</h3>
                    <div className="space-y-3">
                        <div>
                            <label className="block text-xs font-bold text-gray-500 mb-1">服務名稱</label>
                            <input 
                                type="text"
                                className="w-full rounded border-gray-300 text-sm"
                                placeholder="例如: 會員免費卸甲"
                                value={quickServiceName}
                                onChange={(e) => setQuickServiceName(e.target.value)}
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-500 mb-1">服務時長 (分鐘)</label>
                            <input 
                                type="number"
                                className="w-full rounded border-gray-300 text-sm"
                                value={quickServiceDuration}
                                onChange={(e) => setQuickServiceDuration(Number(e.target.value))}
                            />
                        </div>
                        <p className="text-xs text-orange-500 bg-orange-50 p-2 rounded">
                            此服務將自動設為「僅限方案使用」，不會顯示在公開預約頁面。
                        </p>
                    </div>
                    <div className="flex justify-end gap-2 mt-6">
                        <button 
                             type="button"
                             onClick={() => setShowQuickAdd(false)}
                             className="px-3 py-1.5 text-xs text-gray-500 hover:text-gray-700"
                        >
                            取消
                        </button>
                        <button 
                             type="button"
                             onClick={handleQuickAddService}
                             disabled={!quickServiceName || quickServiceLoading}
                             className="px-3 py-1.5 text-xs bg-primary text-white rounded hover:bg-primary-dark disabled:opacity-50"
                        >
                            {quickServiceLoading ? '建立中...' : '建立並選用'}
                        </button>
                    </div>
                </div>
            </div>
        )}
        </>
    );
};

export default PlanForm;
