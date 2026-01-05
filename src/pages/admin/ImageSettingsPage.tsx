import React, { useState, useEffect } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { XMarkIcon, PhotoIcon, ChevronLeftIcon } from '@heroicons/react/24/outline';
import ImageUploader from '../../components/admin/ImageUploader';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import LoyaltyCard from '../../components/dashboard/LoyaltyCard'; // Import LoyaltyCard
import { useToast } from '../../context/ToastContext';
import { useNavigate } from 'react-router-dom';

type Tab = 'beforeAfter' | 'lash' | 'nail' | 'brow' | 'loyalty';

interface CustomImages {
  beforeAfter: { before: string; after: string; };
  lashImages: string[];
  nailImages: string[];
  browImages: string[];
  loyaltyCardBackground?: string;
}

const ImageSettingsPage: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<Tab>('beforeAfter');
  const [images, setImages] = useState<CustomImages>({
    beforeAfter: { before: '', after: '' },
    lashImages: [],
    nailImages: [],
    browImages: [],
    loyaltyCardBackground: '',
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const { showToast } = useToast();

  useEffect(() => {
    const fetchImages = async () => {
      setIsLoading(true);
      try {
        const docRef = doc(db, 'globals', 'homepageImages');
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          setImages({
            beforeAfter: data.beforeAfter || { before: '', after: '' },
            lashImages: data.lashImages || [],
            nailImages: data.nailImages || [],
            browImages: data.browImages || [],
            loyaltyCardBackground: data.loyaltyCardBackground || '',
          });
        }
      } catch (e) {
        console.error(e);
      } finally {
        setIsLoading(false);
      }
    };
    fetchImages();
  }, []);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const docRef = doc(db, 'globals', 'homepageImages');
      await setDoc(docRef, images, { merge: true });
      showToast('圖片已成功儲存！', 'success');
    } catch (error) {
      console.error("Error saving images:", error);
      showToast('儲存失敗，請稍後再試。', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleImageChange = (category: keyof CustomImages, value: any) => {
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

  const tabs = [
    { key: 'beforeAfter', label: 'Before/After', mobileLabel: 'B/A' },
    { key: 'loyalty', label: '集點卡背景', mobileLabel: '集點卡' },
    { key: 'lash', label: '美睫輪播', mobileLabel: '美睫' },
    { key: 'nail', label: '美甲輪播', mobileLabel: '美甲' },
    { key: 'brow', label: '霧眉輪播', mobileLabel: '霧眉' },
  ];

  const renderTabContent = () => {
    if (isLoading) {
      return <div className="flex justify-center items-center py-20"><LoadingSpinner /></div>;
    }
    switch (activeTab) {
      case 'beforeAfter':
        return (
          <div className="space-y-4">
            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
              <p className="text-sm text-gray-500 mb-4">首頁 Before & After 效果比較圖</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
            </div>
          </div>
        );
      case 'loyalty':
        return (
          <div className="space-y-4">
            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
              <p className="text-sm text-gray-500 mb-4">設定會員集點卡的背景圖片（建議直式圖片）</p>
              <ImageUploader
                label="背景圖片"
                imageUrl={images.loyaltyCardBackground || ''}
                onImageUrlChange={(url) => handleImageChange('loyaltyCardBackground', url)}
                storagePath="homepage/loyalty"
                compact={true}
              />
              

                      {/* Content Area */}
                      <div className="w-full h-full bg-[#FAF9F6] pt-12 px-4 relative flex items-center justify-center">
                          <div className="w-full aspect-[1.586/1]">
                             <LoyaltyCard previewBackground={images.loyaltyCardBackground} />
                          </div>
                      </div>

                      {/* Home Indicator */}
                      
                
            </div>
          </div>
        );
      case 'lash':
      case 'nail':
      case 'brow':
        const categoryKey = activeTab === 'lash' ? 'lashImages' : activeTab === 'nail' ? 'nailImages' : 'browImages';
        const categoryLabel = activeTab === 'lash' ? '美睫' : activeTab === 'nail' ? '美甲' : '霧眉';
        return (
          <div className="space-y-4">
            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
              <p className="text-sm text-gray-500 mb-4">首頁 {categoryLabel} 作品輪播圖片</p>
              
              {images[categoryKey].length === 0 && (
                <div className="text-center py-10 text-gray-400 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
                  尚無圖片
                </div>
              )}
              
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {images[categoryKey].map((url, index) => (
                  <div key={index} className="relative group aspect-square bg-gray-100 rounded-lg overflow-hidden border border-gray-100">
                    {url ? (
                      <img src={url} alt={`${categoryLabel} ${index + 1}`} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <PhotoIcon className="w-8 h-8 text-gray-300" />
                      </div>
                    )}
                    <button 
                      onClick={() => removeImageSlot(categoryKey, index)} 
                      className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-md"
                    >
                      <XMarkIcon className="w-3.5 h-3.5" />
                    </button>
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                       <ImageUploader
                          label=""
                          imageUrl={url}
                          onImageUrlChange={(newUrl) => {
                            const newUrls = [...images[categoryKey]];
                            newUrls[index] = newUrl;
                            handleImageChange(categoryKey, newUrls);
                          }}
                          storagePath={`homepage/${activeTab}`}
                          compact
                        />
                    </div>
                  </div>
                ))}
              </div>
              
              <button
                onClick={() => addImageSlot(categoryKey)}
                disabled={images[categoryKey].some(url => !url)}
                className="w-full mt-4 py-3 border-2 border-dashed border-gray-200 text-sm font-bold text-gray-500 rounded-xl hover:border-primary hover:text-primary transition-all disabled:opacity-40"
              >
                + 新增圖片
              </button>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF9F6]">
      {/* Mobile Header */}
      <header className="sticky top-0 z-30 bg-white border-b border-gray-200 px-4 py-3">
        <div className="flex items-center justify-between">
          <button onClick={() => navigate(-1)} className="p-2 -ml-2 rounded-full hover:bg-gray-100">
            <ChevronLeftIcon className="w-5 h-5 text-gray-600" />
          </button>
          <h1 className="text-base font-bold text-gray-900">圖片管理</h1>
          <button 
            onClick={handleSave}
            disabled={isSaving || isLoading}
            className="px-4 py-1.5 text-sm font-bold text-white bg-primary rounded-lg disabled:opacity-60"
          >
            {isSaving ? '儲存...' : '儲存'}
          </button>
        </div>
      </header>

      {/* Tabs - Scrollable on Mobile */}
      <div className="bg-white border-b border-gray-100 overflow-x-auto scrollbar-hide sticky top-[57px] z-20">
        <nav className="flex min-w-max">
          {tabs.map(tab => (
            <button 
              key={tab.key} 
              onClick={() => setActiveTab(tab.key as Tab)} 
              className={`
                flex-1 min-w-[80px] py-3 px-3 text-center text-sm font-medium border-b-2 transition-colors
                ${activeTab === tab.key 
                  ? 'border-primary text-primary' 
                  : 'border-transparent text-gray-500 hover:text-gray-700'}
              `}
            >
              <span className="hidden sm:inline">{tab.label}</span>
              <span className="sm:hidden">{tab.mobileLabel}</span>
            </button>
          ))}
        </nav>
      </div>

      {/* Content */}
      <main className="p-4 pb-20">
        {renderTabContent()}
      </main>
    </div>
  );
};

export default ImageSettingsPage;
