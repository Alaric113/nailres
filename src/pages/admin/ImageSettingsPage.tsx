import React, { useState, useEffect } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { XMarkIcon, PhotoIcon, ChevronLeftIcon } from '@heroicons/react/24/outline';
import ImageUploader from '../../components/admin/ImageUploader';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import LoyaltyCard from '../../components/dashboard/LoyaltyCard';
import SeasonPassCard from '../../components/dashboard/SeasonPassCard';
import { useToast } from '../../context/ToastContext';
import { useNavigate } from 'react-router-dom';
import { useSeasonPasses } from '../../hooks/useSeasonPasses';
import type { ActivePass } from '../../types/user';
import { Timestamp } from 'firebase/firestore';

type Tab = 'beforeAfter' | 'lash' | 'nail' | 'brow' | 'cards';
type CardSubTab = 'loyalty' | 'seasonPass';

interface SeasonPassBackground {
  backgroundUrl: string;
  textColor: string;
}

interface CustomImages {
  beforeAfter: { before: string; after: string; };
  lashImages: string[];
  nailImages: string[];
  browImages: string[];
  loyaltyCardBackground?: string;
  loyaltyCardTextColor?: string;
  seasonPassBackgrounds?: Record<string, SeasonPassBackground>; // key = pass id
}

const ImageSettingsPage: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<Tab>('beforeAfter');
  const [cardSubTab, setCardSubTab] = useState<CardSubTab>('loyalty');
  const [selectedPassId, setSelectedPassId] = useState<string>('');
  const { passes: seasonPasses, loading: loadingPasses } = useSeasonPasses();

  const [images, setImages] = useState<CustomImages>({
    beforeAfter: { before: '', after: '' },
    lashImages: [],
    nailImages: [],
    browImages: [],
    loyaltyCardBackground: '',
    loyaltyCardTextColor: '#FAF9F6',
    seasonPassBackgrounds: {},
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const { showToast } = useToast();

  // Set first season pass as default when loaded
  useEffect(() => {
    if (seasonPasses.length > 0 && !selectedPassId) {
      setSelectedPassId(seasonPasses[0].id);
    }
  }, [seasonPasses, selectedPassId]);

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
            loyaltyCardTextColor: data.loyaltyCardTextColor || '#FFFFFF',
            seasonPassBackgrounds: data.seasonPassBackgrounds || {},
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

  const handleSeasonPassBackgroundChange = (passId: string, field: 'backgroundUrl' | 'textColor', value: string) => {
    setImages(prev => ({
      ...prev,
      seasonPassBackgrounds: {
        ...prev.seasonPassBackgrounds,
        [passId]: {
          ...(prev.seasonPassBackgrounds?.[passId] || { backgroundUrl: '', textColor: '#FFFFFF' }),
          [field]: value
        }
      }
    }));
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
    { key: 'cards', label: '卡片背景', mobileLabel: '卡片' },
    { key: 'lash', label: '美睫輪播', mobileLabel: '美睫' },
    { key: 'nail', label: '美甲輪播', mobileLabel: '美甲' },
    { key: 'brow', label: '霧眉輪播', mobileLabel: '霧眉' },
  ];

  // Create mock ActivePass for preview
  const createMockActivePass = (passId: string): ActivePass | null => {
    const pass = seasonPasses.find(p => p.id === passId);
    if (!pass) return null;
    return {
      passId: pass.id,
      passName: pass.name,
      variantName: pass.variants[0]?.name || '',
      purchaseDate: Timestamp.now(),
      expiryDate: Timestamp.fromDate(new Date(Date.now() + 90 * 24 * 60 * 60 * 1000)),
      remainingUsages: pass.contentItems.reduce((acc, item) => {
        acc[item.id] = item.quantity || -1;
        return acc;
      }, {} as Record<string, number>)
    };
  };

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
      case 'cards':
        const currentPassBg = images.seasonPassBackgrounds?.[selectedPassId] || { backgroundUrl: '', textColor: '#FFFFFF' };
        const mockPass = createMockActivePass(selectedPassId);
        return (
          <div className="space-y-4">
            {/* Sub-Tab Selection */}
            <div className="flex gap-2 p-1 bg-gray-100 rounded-xl">
              <button
                onClick={() => setCardSubTab('loyalty')}
                className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all ${cardSubTab === 'loyalty'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
                  }`}
              >
                💳 集點卡
              </button>
              <button
                onClick={() => setCardSubTab('seasonPass')}
                className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all ${cardSubTab === 'seasonPass'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
                  }`}
              >
                🎫 季卡
              </button>
            </div>

            {/* Loyalty Card Settings */}
            {cardSubTab === 'loyalty' && (
              <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                <p className="text-sm text-gray-500 mb-4">設定會員集點卡的背景圖片</p>
                <div className="space-y-4">
                  <ImageUploader
                    label="背景圖片"
                    imageUrl={images.loyaltyCardBackground || ''}
                    onImageUrlChange={(url) => handleImageChange('loyaltyCardBackground', url)}
                    storagePath="homepage/loyalty"
                    compact={true}
                  />
                  {/* Text Color Setting */}
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
                    <label className="text-sm font-bold text-gray-700">字體顏色</label>
                    <div className="flex items-center gap-3">
                      <input
                        type="text"
                        value={images.loyaltyCardTextColor || '#FAF9F6'}
                        onChange={(e) => handleImageChange('loyaltyCardTextColor', e.target.value)}
                        className="w-24 px-2 py-1 text-xs font-mono border border-gray-300 rounded focus:ring-primary focus:border-primary uppercase"
                        placeholder="#FAF9F6"
                      />
                      <div className="relative w-8 h-8 rounded border border-gray-300 overflow-hidden shrink-0">
                        <input
                          type="color"
                          value={/^#[0-9A-F]{6}$/i.test(images.loyaltyCardTextColor || '') ? images.loyaltyCardTextColor : '#FAF9F6'}
                          onChange={(e) => handleImageChange('loyaltyCardTextColor', e.target.value)}
                          className="absolute -top-1/2 -left-1/2 w-[200%] h-[200%] p-0 cursor-pointer border-0"
                        />
                      </div>
                    </div>
                  </div>
                </div>
                {/* Preview */}
                <div className="w-full bg-[#FAF9F6] mt-4 p-4 rounded-xl">
                  <p className="text-xs text-gray-500 mb-2 text-center">預覽效果</p>
                  <div className="w-full aspect-[1.586/1]">
                    <LoyaltyCard
                      previewBackground={images.loyaltyCardBackground}
                      previewTextColor={images.loyaltyCardTextColor}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Season Pass Settings */}
            {cardSubTab === 'seasonPass' && (
              <div className="space-y-4 overflow-hidden">
                {/* Tier Selection */}
                {loadingPasses ? (
                  <div className="flex justify-center py-4"><LoadingSpinner /></div>
                ) : seasonPasses.length === 0 ? (
                  <div className="text-center py-8 text-gray-400 bg-white rounded-xl border border-gray-100">
                    尚未建立任何季卡方案
                  </div>
                ) : (
                  <>
                    <div className="overflow-x-auto scrollbar-hide">
                      <div className="flex gap-2 min-w-max pb-2">
                        {seasonPasses.map((pass) => (
                          <button
                            key={pass.id}
                            onClick={() => setSelectedPassId(pass.id)}
                            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${selectedPassId === pass.id
                              ? 'text-white shadow-sm bg-[#9f9f9f]'
                              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                              }`}
                            style={selectedPassId === pass.id ? { backgroundColor: pass.color } : {}}
                          >
                            {pass.name}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Selected Pass Background Settings */}
                    <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                      <p className="text-sm text-gray-500 mb-4">
                        設定「{seasonPasses.find(p => p.id === selectedPassId)?.name || ''}」季卡的背景圖片
                      </p>
                      <div className="space-y-4">
                        <ImageUploader
                          label="背景圖片"
                          imageUrl={currentPassBg.backgroundUrl}
                          onImageUrlChange={(url) => handleSeasonPassBackgroundChange(selectedPassId, 'backgroundUrl', url)}
                          storagePath={`homepage/seasonpass/${selectedPassId}`}
                          compact={true}
                        />
                        {/* Text Color Setting */}
                        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
                          <label className="text-sm font-bold text-gray-700">字體顏色</label>
                          <div className="flex items-center gap-3">
                            <input
                              type="text"
                              value={currentPassBg.textColor || '#FFFFFF'}
                              onChange={(e) => handleSeasonPassBackgroundChange(selectedPassId, 'textColor', e.target.value)}
                              className="w-24 px-2 py-1 text-xs font-mono border border-gray-300 rounded focus:ring-primary focus:border-primary uppercase"
                              placeholder="#FFFFFF"
                            />
                            <div className="relative w-8 h-8 rounded border border-gray-300 overflow-hidden shrink-0">
                              <input
                                type="color"
                                value={/^#[0-9A-F]{6}$/i.test(currentPassBg.textColor || '') ? currentPassBg.textColor : '#FFFFFF'}
                                onChange={(e) => handleSeasonPassBackgroundChange(selectedPassId, 'textColor', e.target.value)}
                                className="absolute -top-1/2 -left-1/2 w-[200%] h-[200%] p-0 cursor-pointer border-0"
                              />
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Preview */}
                      <div className="w-full bg-[#FAF9F6] mt-4 rounded-xl">
                        <p className="text-xs text-gray-500 mb-2 text-center">預覽效果</p>
                        {mockPass && (
                          <SeasonPassCard
                            pass={mockPass}
                            previewBackground={currentPassBg.backgroundUrl}
                            previewTextColor={currentPassBg.textColor}
                          />
                        )}
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}
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
