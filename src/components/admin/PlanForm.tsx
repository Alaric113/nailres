import React, { useState } from 'react';
import type { SeasonPass, SeasonPassVariant, PlanContentItem } from '../../types/seasonPass';
import { useServices } from '../../hooks/useServices';
import { PlusIcon, TrashIcon, PhotoIcon } from '@heroicons/react/24/outline';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
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
        setContentItems([...contentItems, { id: uuidv4(), name: '', type: 'service', quantity: 1 }]);
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
        <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Basic Info */}
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">方案名稱</label>
                        <input 
                            type="text" 
                            required
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                            placeholder="e.g., 初卡"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">有效期限</label>
                        <input 
                            type="text" 
                            required
                            value={duration}
                            onChange={(e) => setDuration(e.target.value)}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                            placeholder="e.g., 3個月"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">備註/說明</label>
                        <textarea 
                            value={note}
                            onChange={(e) => setNote(e.target.value)}
                            rows={3}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                        />
                    </div>
                    <div>
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

                {/* Right Column: Dynamic Lists */}
                <div className="space-y-6">
                    {/* Variants */}
                    <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                        <div className="flex justify-between items-center mb-3">
                            <h3 className="text-sm font-bold text-gray-700">價格方案 (Variants)</h3>
                            <button type="button" onClick={addVariant} className="text-xs text-primary hover:text-primary-dark font-medium flex items-center gap-1">
                                <PlusIcon className="w-3 h-3" /> 新增方案
                            </button>
                        </div>
                        <div className="space-y-2 max-h-48 overflow-y-auto">
                            {variants.map((v, idx) => (
                                <div key={idx} className="flex items-center gap-2">
                                    <input 
                                        type="text" 
                                        placeholder="名稱 (e.g. 120本)"
                                        value={v.name}
                                        onChange={(e) => updateVariant(idx, 'name', e.target.value)}
                                        className="flex-1 min-w-[80px] rounded border-gray-300 text-sm py-1"
                                    />
                                    <input 
                                        type="number" 
                                        placeholder="價格"
                                        value={v.price}
                                        onChange={(e) => updateVariant(idx, 'price', Number(e.target.value))}
                                        className="w-24 rounded border-gray-300 text-sm py-1"
                                    />
                                    <button type="button" onClick={() => removeVariant(idx)} className="text-red-400 hover:text-red-600">
                                        <TrashIcon className="w-4 h-4" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Content Items */}
                    <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                         <div className="flex justify-between items-center mb-3">
                            <h3 className="text-sm font-bold text-gray-700">包含內容 (Content)</h3>
                            <button type="button" onClick={addContentItem} className="text-xs text-primary hover:text-primary-dark font-medium flex items-center gap-1">
                                <PlusIcon className="w-3 h-3" /> 新增項目
                            </button>
                        </div>
                        <div className="space-y-3 max-h-60 overflow-y-auto">
                            {contentItems.map((item, idx) => (
                                <div key={item.id} className="bg-white p-2 rounded border border-gray-200 text-sm space-y-2">
                                    <div className="flex justify-between">
                                        <select 
                                            value={item.type}
                                            onChange={(e) => updateContentItem(idx, 'type', e.target.value)}
                                            className="text-xs border-none bg-transparent font-medium text-gray-500 focus:ring-0 p-0"
                                        >
                                            <option value="service">服務 (Service)</option>
                                            <option value="product">產品 (Product)</option>
                                        </select>
                                        <button type="button" onClick={() => removeContentItem(idx)} className="text-red-400 hover:text-red-600">
                                            <TrashIcon className="w-4 h-4" />
                                        </button>
                                    </div>
                                    <div className="flex gap-2">
                                        <div className="flex-1">
                                            {item.type === 'service' ? (
                                                <select
                                                    value={item.serviceId || ''}
                                                    onChange={(e) => {
                                                        const val = e.target.value;
                                                        updateContentItem(idx, 'serviceId', val || undefined);
                                                    }}
                                                    className="w-full rounded border-gray-300 text-sm py-1"
                                                >
                                                    <option value="">選擇服務 (或手動輸入名稱)</option>
                                                    {services.map(s => (
                                                        <option key={s.id} value={s.id}>{s.name}</option>
                                                    ))}
                                                </select>
                                            ) : null}
                                             <input 
                                                type="text" 
                                                placeholder="項目名稱"
                                                value={item.name}
                                                onChange={(e) => updateContentItem(idx, 'name', e.target.value)}
                                                className="w-full rounded border-gray-300 text-sm py-1 mt-1"
                                            />
                                        </div>
                                        <div className="w-20">
                                            <input 
                                                type="number" 
                                                placeholder="數量"
                                                value={item.quantity}
                                                min={1}
                                                onChange={(e) => updateContentItem(idx, 'quantity', Number(e.target.value))}
                                                className="w-full rounded border-gray-300 text-sm py-1"
                                            />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
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
    );
};

export default PlanForm;
