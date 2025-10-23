import React, { useState, useEffect } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { XMarkIcon } from '@heroicons/react/24/outline';
import ImageUploader from './ImageUploader';
import LoadingSpinner from '../common/LoadingSpinner';

interface ImageManagementModalProps {
  onClose: () => void;
}

type Tab = 'beforeAfter' | 'lash' | 'nail';

interface HomepageImages {
  beforeAfter: { before: string; after: string; };
  lashImages: string[];
  nailImages: string[];
}

const ImageManagementModal: React.FC<ImageManagementModalProps> = ({ onClose }) => {
  const [activeTab, setActiveTab] = useState<Tab>('beforeAfter');
  const [images, setImages] = useState<HomepageImages>({
    beforeAfter: { before: '', after: '' },
    lashImages: [],
    nailImages: [],
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const fetchImages = async () => {
      setIsLoading(true);
      const docRef = doc(db, 'globals', 'homepageImages');
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        setImages(docSnap.data() as HomepageImages);
      }
      setIsLoading(false);
    };
    fetchImages();
  }, []);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const docRef = doc(db, 'globals', 'homepageImages');
      await setDoc(docRef, images, { merge: true });
      alert('圖片已成功儲存！');
      onClose();
    } catch (error) {
      console.error("Error saving images:", error);
      alert('儲存失敗，請稍後再試。');
    } finally {
      setIsSaving(false);
    }
  };

  const handleImageChange = (category: keyof HomepageImages, value: any) => {
    setImages(prev => ({ ...prev, [category]: value }));
  };

  const addImageSlot = (category: 'lashImages' | 'nailImages') => {
    setImages(prev => ({
      ...prev,
      [category]: [...prev[category], '']
    }));
  };

  const removeImageSlot = (category: 'lashImages' | 'nailImages', index: number) => {
    setImages(prev => ({
      ...prev,
      [category]: prev[category].filter((_, i) => i !== index)
    }));
  };

  const renderTabContent = () => {
    if (isLoading) {
      return <div className="flex justify-center p-8"><LoadingSpinner /></div>;
    }
    switch (activeTab) {
      case 'beforeAfter':
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <ImageUploader
              label="Before 圖片"
              imageUrl={images.beforeAfter.before}
              onImageUrlChange={(url) => handleImageChange('beforeAfter', { ...images.beforeAfter, before: url })}
              storagePath="homepage/beforeAfter"
            />
            <ImageUploader
              label="After 圖片"
              imageUrl={images.beforeAfter.after}
              onImageUrlChange={(url) => handleImageChange('beforeAfter', { ...images.beforeAfter, after: url })}
              storagePath="homepage/beforeAfter"
            />
          </div>
        );
      case 'lash':
      case 'nail':
        const categoryKey = activeTab === 'lash' ? 'lashImages' : 'nailImages';
        return (
          <div className="space-y-4">
            {images[categoryKey].map((url, index) => (
              <div key={index} className="flex items-center gap-4">
                <ImageUploader
                  label={`圖片 ${index + 1}`}
                  imageUrl={url}
                  onImageUrlChange={(newUrl) => {
                    const newUrls = [...images[categoryKey]];
                    newUrls[index] = newUrl;
                    handleImageChange(categoryKey, newUrls);
                  }}
                  storagePath={`homepage/${activeTab}`}
                />
                <button onClick={() => removeImageSlot(categoryKey, index)} className="text-red-500 hover:text-red-700 p-2 rounded-full bg-red-100">移除</button>
              </div>
            ))}
            <button
              onClick={() => addImageSlot(categoryKey)}
              disabled={images[categoryKey].some(url => !url)} // Disable if any slot is empty
              className="w-full mt-4 px-4 py-2 border border-dashed border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:bg-gray-200 disabled:cursor-not-allowed"
            >
              + 新增圖片
            </button>
          </div>
        );
      default:
        return null;
    }
  };

  const tabs = [
    { key: 'beforeAfter', label: 'Before & After' },
    { key: 'lash', label: '美睫作品' },
    { key: 'nail', label: '美甲作品' },
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl h-[90vh] flex flex-col">
        <div className="p-6 border-b border-gray-200 flex justify-between items-center">
          <h2 className="text-xl font-bold text-gray-800">編輯首頁圖片</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><XMarkIcon className="h-6 w-6" /></button>
        </div>
        <div className="border-b border-gray-200"><nav className="-mb-px flex space-x-8 px-6">{tabs.map(tab => (<button key={tab.key} onClick={() => setActiveTab(tab.key as Tab)} className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${activeTab === tab.key ? 'border-pink-500 text-pink-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}>{tab.label}</button>))}</nav></div>
        <div className="p-6 flex-grow overflow-y-auto">{renderTabContent()}</div>
        <div className="p-6 bg-gray-50 rounded-b-lg flex justify-end gap-4">
          <button onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-800 font-semibold rounded-md hover:bg-gray-300">取消</button>
          <button onClick={handleSave} disabled={isSaving || isLoading} className="px-4 py-2 bg-pink-500 text-white font-semibold rounded-md hover:bg-pink-600 disabled:bg-gray-400">{isSaving ? '儲存中...' : '儲存變更'}</button>
        </div>
      </div>
    </div>
  );
};

export default ImageManagementModal;
