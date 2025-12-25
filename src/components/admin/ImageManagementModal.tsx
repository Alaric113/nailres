import React, { useState, useEffect } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { XMarkIcon } from '@heroicons/react/24/outline';
import ImageUploader from './ImageUploader';
import LoadingSpinner from '../common/LoadingSpinner';
import { useToast } from '../../context/ToastContext'; // NEW IMPORT

interface ImageManagementModalProps {
  onClose: () => void;
}

type Tab = 'beforeAfter' | 'lash' | 'nail' | 'brow';

interface HomepageImages {
  beforeAfter: { before: string; after: string; };
  lashImages: string[];
  nailImages: string[];
  browImages: string[];
}

const ImageManagementModal: React.FC<ImageManagementModalProps> = ({ onClose }) => {
  const [activeTab, setActiveTab] = useState<Tab>('beforeAfter');
  const [images, setImages] = useState<HomepageImages>({
    beforeAfter: { before: '', after: '' },
    lashImages: [],
    nailImages: [],
    browImages: [],
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const { showToast } = useToast();

  useEffect(() => {
    const fetchImages = async () => {
      setIsLoading(true);
      const docRef = doc(db, 'globals', 'homepageImages');
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        setImages({
          beforeAfter: data.beforeAfter || { before: '', after: '' },
          lashImages: data.lashImages || [],
          nailImages: data.nailImages || [],
          browImages: data.browImages || [], // 確保 browImages 至少是一個空陣列
        });
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
      showToast('圖片已成功儲存！', 'success'); // Success toast
      onClose();
    } catch (error) {
      console.error("Error saving images:", error);
      showToast('儲存失敗，請稍後再試。', 'error'); // Error toast
    } finally {
      setIsSaving(false);
    }
  };

  const handleImageChange = (category: keyof HomepageImages, value: any) => {
    setImages(prev => ({ ...prev, [category]: value }));
  };

  const addImageSlot = (category: 'lashImages' | 'nailImages' | 'browImages') => {
    setImages(prev => ({
      ...prev,
      [category]: [...prev[category], '']
    }));
  };

  const removeImageSlot = (category: 'lashImages' | 'nailImages' | 'browImages', index: number) => {
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
      case 'brow':
        const categoryKey = activeTab === 'lash' ? 'lashImages' : activeTab === 'nail' ? 'nailImages' : 'browImages';
        return (
          <div className="space-y-4">
            {images[categoryKey].map((url, index) => (
              <div key={index} className="flex items-center gap-4 bg-white p-3 rounded-xl border border-gray-100 shadow-sm group hover:border-primary/30 transition-all">
                <div className="flex-grow">
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
                </div>
                <button 
                  onClick={() => removeImageSlot(categoryKey, index)} 
                  className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-all"
                  title="移除此圖片"
                >
                  <XMarkIcon className="w-5 h-5" />
                </button>
              </div>
            ))}
            <button
              onClick={() => addImageSlot(categoryKey)}
              disabled={images[categoryKey].some(url => !url)} // Disable if any slot is empty
              className="w-full mt-4 px-4 py-3 border-2 border-dashed border-gray-200 text-sm font-bold text-gray-500 rounded-xl hover:border-primary hover:text-primary hover:bg-white transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <span className="text-xl">+</span> 新增圖片欄位
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
    { key: 'brow', label: '霧眉作品' },
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-[100] p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl h-[85vh] flex flex-col overflow-hidden animate-slide-up">
        {/* Header */}
        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-secondary-light/30">
          <div>
            <h2 className="text-xl font-serif font-bold text-text-main">編輯首頁圖片</h2>
            <p className="text-xs text-text-light mt-1">管理首頁輪播與作品集展示圖片</p>
          </div>
          <button 
            onClick={onClose} 
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-all"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-100 px-6 bg-white sticky top-0 z-10">
          <nav className="-mb-px flex space-x-8 overflow-x-auto no-scrollbar">
            {tabs.map(tab => (
              <button 
                key={tab.key} 
                onClick={() => setActiveTab(tab.key as Tab)} 
                className={`
                  whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-all
                  ${activeTab === tab.key 
                    ? 'border-primary text-primary' 
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}
                `}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Content */}
        <div className="p-6 flex-grow overflow-y-auto bg-[#FAF9F6]">
          {renderTabContent()}
        </div>

        {/* Footer */}
        <div className="p-5 bg-white border-t border-gray-100 flex justify-end gap-3">
          <button 
            onClick={onClose} 
            className="px-5 py-2.5 text-sm font-medium text-gray-600 bg-gray-50 hover:bg-gray-100 rounded-xl transition-colors"
          >
            取消
          </button>
          <button 
            onClick={handleSave} 
            disabled={isSaving || isLoading} 
            className="px-5 py-2.5 text-sm font-bold text-white bg-primary hover:bg-primary-dark rounded-xl shadow-lg shadow-primary/20 hover:shadow-primary/30 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSaving ? '儲存中...' : '儲存變更'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ImageManagementModal;
