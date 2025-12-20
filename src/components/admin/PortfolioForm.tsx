import React, { useState, useEffect } from 'react';
import { db } from '../../lib/firebase';
import { collection, addDoc, updateDoc, doc, serverTimestamp, getDocs } from 'firebase/firestore';
import type { PortfolioItem } from '../../types/portfolio';
import ImageUploader from './ImageUploader';
import { useServices } from '../../hooks/useServices';

interface PortfolioFormProps {
  item: PortfolioItem | null;
  onClose: () => void;
  onSave: () => void;
}

interface Designer { // Minimal Designer Interface
  id: string;
  name: string;
  displayName?: string;
}

const PortfolioForm: React.FC<PortfolioFormProps> = ({ item, onClose, onSave }) => {
  // const [title, setTitle] = useState(item?.title || ''); // Removed
  const [description, setDescription] = useState(item?.description || '');
  const [category, setCategory] = useState(item?.category || '');
  const [imageUrls, setImageUrls] = useState<string[]>(item?.imageUrls || ['', '', '']);
  const [order, setOrder] = useState(item?.order?.toString() || '0');
  const [isActive, setIsActive] = useState(item?.isActive ?? true);
  
  // New States for Linked Data
  const [selectedServiceId, setSelectedServiceId] = useState(item?.serviceId || '');
  const [selectedDesignerId, setSelectedDesignerId] = useState(item?.designerId || '');

  const [designers, setDesigners] = useState<Designer[]>([]);
  const { services } = useServices();
  
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Fetch Designers
    const fetchDesigners = async () => {
        try {
            const snapshot = await getDocs(collection(db, 'designers'));
            const designersData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Designer));
            setDesigners(designersData);
        } catch (err) {
            console.error("Error fetching designers:", err);
        }
    };
    fetchDesigners();
  }, []);

  useEffect(() => {
    if (item) {
      // setTitle(item.title);
      setDescription(item.description);
      setCategory(item.category);
      const paddedImageUrls = [...item.imageUrls];
      while (paddedImageUrls.length < 3) {
        paddedImageUrls.push('');
      }
      setImageUrls(paddedImageUrls);
      setOrder(item.order.toString());
      setIsActive(item.isActive);
      setSelectedServiceId(item.serviceId || '');
      setSelectedDesignerId(item.designerId || '');
    } else {
        // Reset defaults
        // setTitle('');
        setDescription('');
        setCategory('');
        setImageUrls(['', '', '']);
        setOrder('0');
        setIsActive(true);
        setSelectedServiceId('');
        setSelectedDesignerId('');
    }
  }, [item]);

  const handleImageUrlChange = (index: number, url: string) => {
    const newImageUrls = [...imageUrls];
    newImageUrls[index] = url;
    setImageUrls(newImageUrls);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setError(null);

    // Basic validation
    if (!category) {
      setError('分類為必填項！');
      setIsSaving(false);
      return;
    }

    // Lookup Names
    const serviceName = services.find(s => s.id === selectedServiceId)?.name || null;
    const designerName = designers.find(d => d.id === selectedDesignerId)?.name || designers.find(d => d.id === selectedDesignerId)?.displayName || null;

    // Derive Title
    const derivedTitle = serviceName || `${category}作品`;

    const itemData = {
      title: derivedTitle,
      description,
      category,
      imageUrls: imageUrls.filter(url => url),
      order: parseInt(order),
      isActive,
      updatedAt: serverTimestamp(),
      serviceId: selectedServiceId || null,
      serviceName: serviceName,
      designerId: selectedDesignerId || null,
      designerName: designerName,
    };

    try {
      if (item) {
        // Update existing item
        const itemRef = doc(db, 'portfolioItems', item.id);
        await updateDoc(itemRef, itemData);
      } else {
        // Add new item
        await addDoc(collection(db, 'portfolioItems'), {
          ...itemData,
          createdAt: serverTimestamp(),
        });
      }
      onSave();
    } catch (err) {
      console.error("Error saving portfolio item:", err);
      setError('儲存作品集項目失敗！');
    } finally {
      setIsSaving(false);
    }
  };

  const categories = ['美甲', '美睫', '霧眉'];

  return (
    <form onSubmit={handleSubmit} className="flex flex-col md:flex-row gap-6 p-4 md:p-6 h-full md:h-auto overflow-y-auto">
      {/* Left Column: Images */}
      <div className="w-full md:w-1/3 space-y-4">
        <h3 className="text-lg font-bold text-gray-900 mb-2">作品圖片</h3>
        <p className="text-xs text-gray-500 mb-4">建議尺寸 3:4 或 1:1，首張將作為封面。</p>
        <div className="grid grid-cols-3 gap-2">
          {imageUrls.map((url, index) => (
            <ImageUploader
              key={index}
              label={index === 0 ? "封面" : `圖片${index + 1}`}
              imageUrl={url}
              onImageUrlChange={(newUrl) => handleImageUrlChange(index, newUrl)}
              storagePath={`portfolio/${category || 'uncategorized'}`}
            />
          ))}
        </div>
      </div>

      {/* Right Column: Form Fields */}
      <div className="w-full md:w-2/3 space-y-5">
        
        {error && <div className="bg-red-50 text-red-500 p-3 rounded-lg text-sm">{error}</div>}

        {item?.orderId && (
            <div className="bg-blue-50 border border-blue-100 p-3 rounded-lg flex flex-col gap-1 text-sm text-blue-800">
                <p className="font-bold flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                    已連結訂單資訊
                </p>
                <p className="text-blue-600/80">此作品來自訂單 #{item.orderId.slice(0, 6)}，部分欄位已自動鎖定。</p>
            </div>
        )}

        {/* Reorganized Form Fields: Category and Service First */}
        <div className="grid grid-cols-2 gap-4">
             <div className="col-span-2 sm:col-span-1">
                <label htmlFor="category" className="block text-sm font-bold text-gray-700 mb-1">分類 <span className="text-red-500">*</span></label>
                <select
                    id="category"
                    className={`block w-full border rounded-lg shadow-sm p-2.5 focus:ring-[#9F9586] focus:border-[#9F9586] transition-colors ${item?.orderId ? 'bg-gray-100 text-gray-500 border-gray-200 cursor-not-allowed' : 'border-gray-200'}`}
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    required
                    disabled={!!item?.orderId}
                >
                <option value="">請選擇分類</option>
                {categories.map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                ))}
                {item?.category && !categories.includes(item.category) && (
                    <option value={item.category}>{item.category}</option>
                )}
                </select>
            </div>
            
            <div className="col-span-2 sm:col-span-1">
                 <label htmlFor="service" className="block text-sm font-bold text-gray-700 mb-1">對應服務 <span className="text-gray-400 font-normal text-xs">(將作為標題)</span></label>
                 <select
                    id="service"
                    className="block w-full border border-gray-200 rounded-lg shadow-sm p-2.5 focus:ring-[#9F9586] focus:border-[#9F9586]"
                    value={selectedServiceId}
                    onChange={(e) => setSelectedServiceId(e.target.value)}
                >
                    <option value="">-- 自訂 (使用分類名稱) --</option>
                    {services.map(s => (
                        <option key={s.id} value={s.id}>{s.name || s.title || '服務'}</option>
                    ))}
                </select>
            </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
             <div className="col-span-2 sm:col-span-1">
                <label htmlFor="designer" className="block text-sm font-bold text-gray-700 mb-1">負責設計師</label>
                <select
                    id="designer"
                    className="block w-full border border-gray-200 rounded-lg shadow-sm p-2.5 focus:ring-[#9F9586] focus:border-[#9F9586]"
                    value={selectedDesignerId}
                    onChange={(e) => setSelectedDesignerId(e.target.value)}
                >
                    <option value="">-- 未指定 --</option>
                    {designers.map(d => (
                        <option key={d.id} value={d.id}>{d.name || d.displayName || '未命名設計師'}</option>
                    ))}
                </select>
            </div>
            
             <div className="col-span-2 sm:col-span-1">
                 <label htmlFor="order" className="block text-sm font-bold text-gray-700 mb-1">排序權重</label>
                 <span className="text-xs text-gray-400 block mb-1">數字越小越靠前</span>
                 <input
                    type="number"
                    id="order"
                    className="block w-full border border-gray-200 rounded-lg shadow-sm p-2.5"
                    value={order}
                    onChange={(e) => setOrder(e.target.value)}
                    placeholder="0"
                />
            </div>
        </div>

        <div>
            <label htmlFor="description" className="block text-sm font-bold text-gray-700 mb-1">作品描述</label>
            <textarea
                id="description"
                rows={3}
                className="block w-full border border-gray-200 rounded-lg shadow-sm p-3 focus:ring-[#9F9586] focus:border-[#9F9586] transition-colors"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="輸入作品的詳細描述、使用顏色或設計理念..."
            ></textarea>
        </div>

        <div className="flex items-center justify-end h-full pt-6">
                 <label className="flex items-center cursor-pointer">
                    <div className="relative">
                        <input
                            type="checkbox"
                            id="isActive"
                            className="sr-only"
                            checked={isActive}
                            onChange={(e) => setIsActive(e.target.checked)}
                        />
                        <div className={`block w-10 h-6 rounded-full transition-colors ${isActive ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                        <div className={`absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${isActive ? 'transform translate-x-4' : ''}`}></div>
                    </div>
                    <span className="ml-3 text-sm font-medium text-gray-900">啟用顯示</span>
                </label>
            </div>

        <div className="flex justify-end gap-3 pt-6 border-t border-gray-100 mt-4">
            <button
                type="button"
                onClick={onClose}
                className="px-5 py-2.5 text-sm font-bold text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                disabled={isSaving}
            >
                取消
            </button>
            <button
                type="submit"
                className="px-5 py-2.5 text-sm font-bold text-white bg-[#9F9586] rounded-lg hover:bg-[#8a8175] transition-colors shadow-sm"
                disabled={isSaving}
            >
                {isSaving ? '儲存中...' : '確認儲存'}
            </button>
        </div>
      </div>
    </form>
  );
};

export default PortfolioForm;
