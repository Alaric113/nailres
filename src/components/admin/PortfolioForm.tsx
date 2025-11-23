import React, { useState, useEffect } from 'react';
import { db } from '../../lib/firebase';
import { collection, addDoc, updateDoc, doc, serverTimestamp } from 'firebase/firestore';
import type { PortfolioItem } from '../../types/portfolio';
import ImageUploader from './ImageUploader'; // Import existing ImageUploader

interface PortfolioFormProps {
  item: PortfolioItem | null; // Null for new item, existing item for editing
  onClose: () => void;
  onSave: () => void; // Callback after successful save
}

const PortfolioForm: React.FC<PortfolioFormProps> = ({ item, onClose, onSave }) => {
  const [title, setTitle] = useState(item?.title || '');
  const [description, setDescription] = useState(item?.description || '');
  const [category, setCategory] = useState(item?.category || '');
  const [imageUrls, setImageUrls] = useState<string[]>(item?.imageUrls || ['', '', '']); // Allow up to 3 images for now
  const [order, setOrder] = useState(item?.order?.toString() || '0');
  const [isActive, setIsActive] = useState(item?.isActive ?? true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (item) {
      setTitle(item.title);
      setDescription(item.description);
      setCategory(item.category);
      // Ensure imageUrls array has at least 3 elements, fill with empty strings if less
      const paddedImageUrls = [...item.imageUrls];
      while (paddedImageUrls.length < 3) {
        paddedImageUrls.push('');
      }
      setImageUrls(paddedImageUrls);
      setOrder(item.order.toString());
      setIsActive(item.isActive);
    } else {
      setTitle('');
      setDescription('');
      setCategory('');
      setImageUrls(['', '', '']);
      setOrder('0');
      setIsActive(true);
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
    if (!title || !category) {
      setError('標題和分類為必填項！');
      setIsSaving(false);
      return;
    }

    const itemData = {
      title,
      description,
      category,
      imageUrls: imageUrls.filter(url => url), // Filter out empty URLs
      order: parseInt(order),
      isActive,
      updatedAt: serverTimestamp(),
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
      onSave(); // Notify parent of successful save
    } catch (err) {
      console.error("Error saving portfolio item:", err);
      setError('儲存作品集項目失敗！');
    } finally {
      setIsSaving(false);
    }
  };

  const categories = ['美甲', '美睫', '霧眉', '其他']; // Example categories

  return (
    <form onSubmit={handleSubmit} className="space-y-4 p-4">
      {error && <div className="text-red-500 text-sm">{error}</div>}

      <div>
        <label htmlFor="title" className="block text-sm font-medium text-gray-700">標題 <span className="text-red-500">*</span></label>
        <input
          type="text"
          id="title"
          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />
      </div>

      <div>
        <label htmlFor="category" className="block text-sm font-medium text-gray-700">分類 <span className="text-red-500">*</span></label>
        <select
          id="category"
          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          required
        >
          <option value="">請選擇分類</option>
          {categories.map((cat) => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="description" className="block text-sm font-medium text-gray-700">描述</label>
        <textarea
          id="description"
          rows={3}
          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        ></textarea>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">作品圖片 (最多3張)</label>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {imageUrls.map((url, index) => (
            <ImageUploader
              key={index}
              label={`圖片 ${index + 1}`}
              imageUrl={url}
              onImageUrlChange={(newUrl) => handleImageUrlChange(index, newUrl)}
              storagePath={`portfolio/${category || 'uncategorized'}`}
            />
          ))}
        </div>
      </div>

      <div>
        <label htmlFor="order" className="block text-sm font-medium text-gray-700">排序 (數字越小越前面)</label>
        <input
          type="number"
          id="order"
          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
          value={order}
          onChange={(e) => setOrder(e.target.value)}
        />
      </div>

      <div className="flex items-center">
        <input
          id="isActive"
          type="checkbox"
          className="h-4 w-4 text-indigo-600 border-gray-300 rounded"
          checked={isActive}
          onChange={(e) => setIsActive(e.target.checked)}
        />
        <label htmlFor="isActive" className="ml-2 block text-sm text-gray-900">啟用 (在客戶端顯示)</label>
      </div>

      <div className="flex justify-end space-x-3">
        <button
          type="button"
          onClick={onClose}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300"
          disabled={isSaving}
        >
          取消
        </button>
        <button
          type="submit"
          className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700"
          disabled={isSaving}
        >
          {isSaving ? '儲存中...' : '儲存'}
        </button>
      </div>
    </form>
  );
};

export default PortfolioForm;
