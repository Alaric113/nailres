import React, { useState } from 'react';
import type { SeasonPass, SeasonPassVariant, PlanContentItem } from '../../types/seasonPass';
import { useServices } from '../../hooks/useServices';
import { PlusIcon, TrashIcon, PhotoIcon, BoltIcon, ChevronDownIcon, ChevronUpIcon } from '@heroicons/react/24/outline';
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
    
    // Collapsible State for Content Items (set of expanded item IDs)
    const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
    
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
            <form onSubmit={handleSubmit} className="flex flex-col h-full">
                {/* Tabs Header - Mobile Optimized */}
                <div className="border-b border-gray-200 -mx-4 sm:-mx-6 px-4 sm:px-6 sticky top-0 bg-white z-10">
                    <nav className="flex gap-1 sm:gap-2 overflow-x-auto hide-scrollbar -mb-px">
                        {[
                            { id: 'basic', label: '基本資訊', icon: '📋' },
                            { id: 'variants', label: '價格方案', icon: '💰' },
                            { id: 'content', label: '包含內容', icon: '📦' }
                        ].map((tab) => (
                            <button
                                key={tab.id}
                                type="button"
                                onClick={() => setActiveTab(tab.id as 'basic' | 'variants' | 'content')}
                                className={`flex items-center gap-1.5 py-3 px-3 sm:px-4 border-b-2 font-medium text-sm whitespace-nowrap transition-colors ${
                                    activeTab === tab.id
                                        ? 'border-primary text-primary bg-primary/5'
                                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                }`}
                            >
                                <span className="hidden sm:inline">{tab.icon}</span>
                                {tab.label}
                            </button>
                        ))}
                    </nav>
                </div>

                {/* Tab Content Area - Scrollable */}
                <div className="flex-1 overflow-y-auto py-5 sm:py-6 min-h-[300px] sm:min-h-[400px]">

                    {/* Basic Info Tab */}
                    {activeTab === 'basic' && (
                        <div className="space-y-5">
                            {/* 方案名稱 */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1.5">方案名稱</label>
                                <input 
                                    type="text" 
                                    required
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-primary focus:ring-primary text-sm py-2.5 px-3"
                                    placeholder="例如：初卡、進階卡"
                                />
                            </div>

                            {/* 有效期限 */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1.5">有效期限</label>
                                <div className="flex items-center gap-3">
                                    <input 
                                        type="number" 
                                        required
                                        value={duration}
                                        onChange={(e) => setDuration(e.target.value)}
                                        className="block w-24 rounded-lg border-gray-300 shadow-sm focus:border-primary focus:ring-primary text-sm py-2.5 px-3"
                                        placeholder="3"
                                        min={1}
                                    />
                                    <span className="text-sm text-gray-600 font-medium">個月</span>
                                </div>
                            </div>

                            {/* 備註說明 */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1.5">備註/說明</label>
                                <textarea 
                                    value={note}
                                    onChange={(e) => setNote(e.target.value)}
                                    rows={3}
                                    className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-primary focus:ring-primary text-sm py-2.5 px-3 resize-none"
                                    placeholder="輸入方案說明或注意事項..."
                                />
                            </div>

                            {/* 代表顏色 - 隱藏 */}
                            <div className="hidden">
                                <label className="block text-sm font-semibold text-gray-700 mb-1.5">代表顏色</label>
                                <input 
                                    type="color" 
                                    value={color}
                                    onChange={(e) => setColor(e.target.value)}
                                    className="block w-full h-10 p-1 rounded-lg border border-gray-300 cursor-pointer"
                                />
                            </div>

                            {/* 啟用開關 */}
                            <div className="flex items-center gap-3 py-2">
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input 
                                        type="checkbox"
                                        id="isActive"
                                        checked={isActive}
                                        onChange={(e) => setIsActive(e.target.checked)}
                                        className="sr-only peer"
                                    />
                                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                                </label>
                                <span className="text-sm font-medium text-gray-700">啟用此方案</span>
                            </div>

                            {/* 圖片上傳 */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1.5">方案圖片 (選填)</label>
                                <div className="mt-1 flex flex-wrap items-center gap-4">
                                    {imageUrl && (
                                        <div className="relative group">
                                            <img src={imageUrl} alt="Preview" className="h-20 w-20 object-cover rounded-xl border-2 border-gray-200" />
                                            <button 
                                                type="button"
                                                onClick={() => setImageUrl('')}
                                                className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                                            >
                                                ✕
                                            </button>
                                        </div>
                                    )}
                                    <label className="cursor-pointer flex items-center gap-2 px-4 py-3 bg-gray-50 hover:bg-gray-100 border border-dashed border-gray-300 rounded-xl transition-colors">
                                        <PhotoIcon className="w-5 h-5 text-gray-400" />
                                        <span className="text-sm text-gray-600">{uploading ? '上傳中...' : '選擇圖片'}</span>
                                        <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
                                    </label>
                                </div>
                            </div>
                        </div>
                    )}


                    {/* Variants Tab */}
                    {activeTab === 'variants' && (
                        <div className="space-y-4">
                            {/* Header */}
                            <div className="flex justify-between items-center">
                                <div>
                                    <h3 className="text-base font-bold text-gray-800">價格方案</h3>
                                    <p className="text-xs text-gray-500 mt-0.5">設定不同規格的價格選項</p>
                                </div>
                                <button 
                                    type="button" 
                                    onClick={addVariant} 
                                    className="flex items-center gap-1.5 px-3 py-2 bg-primary/10 hover:bg-primary/20 text-primary font-medium text-sm rounded-lg transition-colors"
                                >
                                    <PlusIcon className="w-4 h-4" />
                                    <span className="hidden sm:inline">新增方案</span>
                                </button>
                            </div>

                            {/* Variants List */}
                            <div className="space-y-3">
                                {variants.length === 0 && (
                                    <div className="text-center py-8 text-gray-400 text-sm bg-gray-50 rounded-xl border border-dashed border-gray-200">
                                        尚未新增任何價格方案
                                    </div>
                                )}
                                {variants.map((v, idx) => (
                                    <div 
                                        key={idx} 
                                        className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm space-y-4"
                                    >
                                        {/* Header Row with Index & Delete */}
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <span className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold">
                                                    {idx + 1}
                                                </span>
                                                <span className="text-sm font-medium text-gray-700">
                                                    {v.name || '未命名方案'}
                                                </span>
                                            </div>
                                            <button 
                                                type="button" 
                                                onClick={() => removeVariant(idx)} 
                                                className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                            >
                                                <TrashIcon className="w-4 h-4" />
                                            </button>
                                        </div>

                                        {/* Form Fields */}
                                        <div className="space-y-3">
                                            {/* Variant Name */}
                                            <div>
                                                <label className="block text-xs font-medium text-gray-500 mb-1">方案名稱</label>
                                                <input 
                                                    type="text" 
                                                    placeholder="例如：120本、基礎款"
                                                    value={v.name}
                                                    onChange={(e) => updateVariant(idx, 'name', e.target.value)}
                                                    className="w-full rounded-lg border-gray-300 text-sm py-2.5 px-3 focus:ring-primary focus:border-primary"
                                                />
                                            </div>

                                            {/* Price Row */}
                                            <div className="grid grid-cols-2 gap-3">
                                                <div>
                                                    <label className="block text-xs font-medium text-gray-500 mb-1">售價</label>
                                                    <div className="relative">
                                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">$</span>
                                                        <input 
                                                            type="number" 
                                                            placeholder="0"
                                                            value={v.price}
                                                            onChange={(e) => updateVariant(idx, 'price', Number(e.target.value))}
                                                            className="w-full rounded-lg border-gray-300 text-sm py-2.5 pl-7 pr-3 focus:ring-primary focus:border-primary"
                                                        />
                                                    </div>
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-medium text-gray-500 mb-1">原價 (選填)</label>
                                                    <div className="relative">
                                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">$</span>
                                                        <input 
                                                            type="number" 
                                                            placeholder="0"
                                                            value={v.originalPrice || ''}
                                                            onChange={(e) => updateVariant(idx, 'originalPrice', Number(e.target.value))}
                                                            className="w-full rounded-lg border-gray-300 text-sm py-2.5 pl-7 pr-3 focus:ring-primary focus:border-primary"
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Content Items Tab */}
                    {activeTab === 'content' && (
                        <div className="space-y-4">
                            {/* Header */}
                            <div className="flex justify-between items-center">
                                <div>
                                    <h3 className="text-base font-bold text-gray-800">包含內容</h3>
                                    <p className="text-xs text-gray-500 mt-0.5">設定方案包含的服務與權益</p>
                                </div>
                                <button 
                                    type="button" 
                                    onClick={() => {
                                        addContentItem();
                                        // Auto-expand newly added item
                                        setTimeout(() => {
                                            const newId = contentItems[contentItems.length]?.id;
                                            if (newId) setExpandedItems(prev => new Set([...prev, newId]));
                                        }, 0);
                                    }} 
                                    className="flex items-center gap-1.5 px-3 py-2 bg-primary/10 hover:bg-primary/20 text-primary font-medium text-sm rounded-lg transition-colors"
                                >
                                    <PlusIcon className="w-4 h-4" />
                                    <span className="hidden sm:inline">新增項目</span>
                                </button>
                            </div>

                            {/* Content Items List - Accordion Style */}
                            <div className="space-y-2">
                                {contentItems.length === 0 && (
                                    <div className="text-center py-8 text-gray-400 text-sm bg-gray-50 rounded-xl border border-dashed border-gray-200">
                                        尚未新增任何內容項目
                                    </div>
                                )}
                                {contentItems.map((item, idx) => {
                                    const isExpanded = expandedItems.has(item.id);
                                    const displayName = item.name || '未命名項目';
                                    
                                    const toggleExpand = () => {
                                        setExpandedItems(prev => {
                                            const newSet = new Set(prev);
                                            if (newSet.has(item.id)) {
                                                newSet.delete(item.id);
                                            } else {
                                                newSet.add(item.id);
                                            }
                                            return newSet;
                                        });
                                    };

                                    return (
                                        <div 
                                            key={item.id} 
                                            className={`rounded-xl border overflow-hidden transition-all ${
                                                isExpanded 
                                                    ? 'bg-white border-primary/30 shadow-sm' 
                                                    : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                                            }`}
                                        >
                                            {/* Accordion Header */}
                                            <div 
                                                onClick={toggleExpand}
                                                className="flex items-center justify-between p-3 cursor-pointer"
                                            >
                                                <div className="flex items-center gap-2 min-w-0">
                                                    <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                                                        isExpanded ? 'bg-primary text-white' : 'bg-gray-200 text-gray-500'
                                                    }`}>
                                                        {idx + 1}
                                                    </span>
                                                    <span className={`text-xs px-2 py-0.5 rounded-full shrink-0 ${
                                                        item.category === '權益' 
                                                            ? 'bg-purple-100 text-purple-700' 
                                                            : 'bg-blue-100 text-blue-700'
                                                    }`}>
                                                        {item.category === '權益' ? '⭐' : '🎫'}
                                                    </span>
                                                    <span className={`font-medium truncate ${isExpanded ? 'text-gray-900' : 'text-gray-600'}`}>
                                                        {displayName}
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-1 shrink-0">
                                                    <button 
                                                        type="button" 
                                                        onClick={(e) => { e.stopPropagation(); removeContentItem(idx); }} 
                                                        className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                    >
                                                        <TrashIcon className="w-4 h-4" />
                                                    </button>
                                                    {isExpanded ? (
                                                        <ChevronUpIcon className="w-5 h-5 text-gray-400" />
                                                    ) : (
                                                        <ChevronDownIcon className="w-5 h-5 text-gray-400" />
                                                    )}
                                                </div>
                                            </div>

                                            {/* Accordion Content (Expanded) */}
                                            {isExpanded && (
                                                <div className="px-4 pb-4 pt-2 border-t border-gray-100 space-y-4">
                                                    {/* Display Name Input - First */}
                                                    <div>
                                                        <label className="block text-xs font-medium text-gray-500 mb-1">顯示名稱</label>
                                                        <input 
                                                            type="text" 
                                                            placeholder="例: 3次完整睫毛嫁接"
                                                            value={item.name}
                                                            onChange={(e) => updateContentItem(idx, 'name', e.target.value)}
                                                            className="w-full rounded-lg border-gray-300 text-sm py-2.5 px-3 focus:ring-primary focus:border-primary"
                                                        />
                                                    </div>

                                                    {/* Category & Benefit Type Row */}
                                                    <div className="grid grid-cols-2 gap-3">
                                                        <div>
                                                            <label className="block text-xs font-medium text-gray-500 mb-1">類型</label>
                                                            <select 
                                                                value={item.category}
                                                                onChange={(e) => updateContentItem(idx, 'category', e.target.value as '服務' | '權益')}
                                                                className="w-full text-sm rounded-lg border-gray-300 py-2.5 px-3 focus:ring-primary focus:border-primary"
                                                            >
                                                                <option value="服務">🎫 服務</option>
                                                                <option value="權益">⭐ 權益</option>
                                                            </select>
                                                        </div>
                                                        <div>
                                                            <label className="block text-xs font-medium text-gray-500 mb-1">使用方式</label>
                                                            <select 
                                                                value={item.benefitType || 'standalone'}
                                                                onChange={(e) => updateContentItem(idx, 'benefitType', e.target.value)}
                                                                className="w-full text-sm rounded-lg border-gray-300 py-2.5 px-3 focus:ring-primary focus:border-primary"
                                                            >
                                                                <option value="standalone">獨立使用</option>
                                                                <option value="upgrade">附加升級</option>
                                                                <option value="discount">折扣券</option>
                                                            </select>
                                                        </div>
                                                    </div>

                                                    {/* Service Selection (Conditional) */}
                                                    {item.benefitType === 'standalone' && (
                                                        <div className="space-y-2">
                                                            <label className="block text-xs font-medium text-gray-500 mb-1">連結服務</label>
                                                            <select
                                                                value={item.serviceId || ''}
                                                                onChange={(e) => updateContentItem(idx, 'serviceId', e.target.value || undefined)}
                                                                className="w-full rounded-lg border-gray-300 text-sm py-2.5 px-3 focus:ring-primary focus:border-primary"
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
                                                                className="text-xs text-primary hover:text-primary-dark font-medium flex items-center gap-1"
                                                            >
                                                                <BoltIcon className="w-3 h-3" /> 快速建立隱藏服務
                                                            </button>
                                                        </div>
                                                    )}

                                                    {item.benefitType === 'upgrade' && (
                                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                                            <div>
                                                                <label className="block text-xs font-medium text-gray-500 mb-1">適用服務</label>
                                                                <select
                                                                    value={item.appliesTo || ''}
                                                                    onChange={(e) => {
                                                                        updateContentItem(idx, 'appliesTo', e.target.value || undefined);
                                                                        updateContentItem(idx, 'upgradeOptionId', undefined);
                                                                    }}
                                                                    className="w-full rounded-lg border-gray-300 text-sm py-2.5 px-3"
                                                                >
                                                                    <option value="">選擇服務...</option>
                                                                    {services.filter(s => s.options && s.options.length > 0).map(s => (
                                                                        <option key={s.id} value={s.id}>{s.name}</option>
                                                                    ))}
                                                                </select>
                                                            </div>
                                                            {item.appliesTo && (() => {
                                                                const selectedService = services.find(s => s.id === item.appliesTo);
                                                                const allOptions = selectedService?.options?.flatMap(opt => 
                                                                    opt.items.map(optItem => ({ ...optItem, optionGroupName: opt.name }))
                                                                ) || [];
                                                                return (
                                                                    <div>
                                                                        <label className="block text-xs font-medium text-gray-500 mb-1">附加選項</label>
                                                                        <select
                                                                            value={item.upgradeOptionId || ''}
                                                                            onChange={(e) => updateContentItem(idx, 'upgradeOptionId', e.target.value || undefined)}
                                                                            className="w-full rounded-lg border-gray-300 text-sm py-2.5 px-3"
                                                                        >
                                                                            <option value="">選擇附加項目...</option>
                                                                            {allOptions.map(opt => (
                                                                                <option key={opt.id} value={opt.id}>
                                                                                    {opt.optionGroupName}: {opt.name} (+${opt.price})
                                                                                </option>
                                                                            ))}
                                                                        </select>
                                                                    </div>
                                                                );
                                                            })()}
                                                        </div>
                                                    )}

                                                    {item.benefitType === 'discount' && (
                                                        <div className="text-xs text-gray-400 italic py-2 px-3 bg-gray-50 rounded-lg">
                                                            優惠券連結功能開發中...
                                                        </div>
                                                    )}

                                                    {/* Quantity & Monthly Limit (For Standalone Services) */}
                                                    {item.category === '服務' && item.benefitType === 'standalone' && (
                                                        <div className="grid grid-cols-2 gap-3">
                                                            <div>
                                                                <label className="block text-xs font-medium text-gray-500 mb-1">總次數</label>
                                                                <input 
                                                                    type="number" 
                                                                    placeholder="1"
                                                                    value={item.quantity || 1}
                                                                    min={1}
                                                                    onChange={(e) => updateContentItem(idx, 'quantity', Number(e.target.value))}
                                                                    className="w-full rounded-lg border-gray-300 text-sm py-2.5 px-3 text-center"
                                                                />
                                                            </div>
                                                            <div>
                                                                <label className="block text-xs font-medium text-gray-500 mb-1">每月限制 (選填)</label>
                                                                <input 
                                                                    type="number" 
                                                                    placeholder="無限制"
                                                                    value={item.monthlyLimit || ''}
                                                                    min={0}
                                                                    onChange={(e) => updateContentItem(idx, 'monthlyLimit', e.target.value ? Number(e.target.value) : undefined)}
                                                                    className="w-full rounded-lg border-gray-300 text-sm py-2.5 px-3 text-center"
                                                                    title="每月使用限制 (空=無限制)"
                                                                />
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                </div>

                {/* Footer Buttons - Fixed on mobile */}
                <div className="flex flex-row justify-end gap-3 pt-5 mt-auto border-t border-gray-100 bg-white -mx-4 sm:-mx-6 px-4 sm:px-6 pb-safe-area sticky bottom-2">
                    <button
                        type="button"
                        onClick={onClose}
                        className="w-full sm:w-auto px-6 py-3 border border-gray-300 rounded-xl text-sm font-semibold text-gray-700 hover:bg-gray-50 active:scale-[0.98] transition-all"
                    >
                        取消
                    </button>
                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full sm:w-auto px-6 py-3 bg-primary text-white rounded-xl text-sm font-semibold hover:bg-primary-dark active:scale-[0.98] transition-all shadow-sm disabled:opacity-50"
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
