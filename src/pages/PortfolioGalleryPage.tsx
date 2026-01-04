import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom'; // Added import
import usePortfolioItems from '../hooks/usePortfolioItems';
import { useServiceCategories } from '../hooks/useServiceCategories'; // Dynamic categories
import LoadingSpinner from '../components/common/LoadingSpinner';
import { isLiffBrowser } from '../lib/liff';

// Skeleton Card Component for Portfolio
const PortfolioCardSkeleton = () => (
  <div className="flex flex-row bg-white rounded-2xl shadow-sm border border-[#EFECE5] overflow-hidden h-full animate-pulse">
    <div className="relative w-1/2 min-w-[50%] max-w-[50%] shrink-0">
      <div className="pb-[100%] bg-gray-200" />
    </div>
    <div className="p-5 flex flex-col gap-3 w-1/2 flex-grow">
      <div>
        <div className="w-16 h-5 bg-gray-200 rounded-md mb-2" />
        <div className="h-6 bg-gray-200 rounded w-3/4 mb-1" />
        <div className="h-6 bg-gray-100 rounded w-1/2" />
      </div>
      <div className="mt-auto">
        <div className="h-4 bg-gray-100 rounded w-full mb-2" />
        <div className="h-4 bg-gray-100 rounded w-2/3 mb-3" />
        <div className="h-10 bg-gray-300 rounded-xl w-full" />
      </div>
    </div>
  </div>
);

const PortfolioGalleryPage = () => {
  const { portfolioItems, loading, error } = usePortfolioItems();
  const { categories: serviceCategories, isLoading: categoriesLoading } = useServiceCategories();
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [imagesLoaded, setImagesLoaded] = useState(false);
  const navigate = useNavigate(); // Hook for navigation
  const isLiff = isLiffBrowser();

  // Use dynamic categories from Firestore
  // Sort order is already handled by useServiceCategories hook
  const categories = useMemo(() => {
    const dynCats = serviceCategories
      .map(c => c.name)
      .filter(name => name !== '加購項目'); // Filter out '加購項目'
    // Ensure '其他' is included if present in items but not in categories? 
    // For now, assume serviceCategories covers main ones. 
    // We add 'all' at the start.
    return ['all', ...dynCats];
  }, [serviceCategories]);

  const filteredItems = portfolioItems.filter(item =>
    item.isActive &&
    item.category !== '加購項目' && // Explicitly exclude '加購項目' items
    (selectedCategory === 'all' || item.category === selectedCategory)
  );

  // Preload all portfolio images
  useEffect(() => {
    if (loading || categoriesLoading) return;

    const imageUrls = portfolioItems
      .filter(item => item.isActive && item.imageUrls?.length > 0)
      .map(item => item.imageUrls[0]);

    if (imageUrls.length === 0) {
      setImagesLoaded(true);
      return;
    }

    setImagesLoaded(false);

    const imagePromises = imageUrls.map(src => {
      return new Promise<void>((resolve) => {
        const img = new Image();
        img.onload = () => resolve();
        img.onerror = () => resolve();
        img.src = src;
      });
    });

    Promise.all(imagePromises).then(() => {
      setImagesLoaded(true);
    });
  }, [portfolioItems, loading, categoriesLoading]);

  const handleBookStyle = (category: string) => {
    // ServiceSelector uses Chinese keys (e.g. '美甲', '美睫'), so we pass them directly.
    const url = category && category !== 'all'
      ? `/booking?category=${encodeURIComponent(category)}`
      : '/booking';
    navigate(url);
  };

  if (loading || categoriesLoading) {
    return <LoadingSpinner fullScreen text="載入作品集..." />;
  }

  if (error) {
    return <div className="text-red-500 text-center p-4">載入作品集失敗: {error}</div>;
  }

  // Show skeleton while images are loading
  const showSkeleton = !imagesLoaded;

  return (
    <div className="min-h-screen bg-[#FAF9F6]  lg:pt-32 pb-20">
      <header className="py-4 bg-white/50 backdrop-blur-sm shadow-sm z-20">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-3xl font-serif font-bold text-[#2C2825] mb-2 tracking-wider">作品集</h1>
          <p className="text-[#8A8175]">探索我們的精選作品</p>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Category Filter */}
        <div className={`flex flex-wrap justify-center gap-3 mb-12 sticky ${isLiff ? 'top-0' : 'top-16'} py-2 z-20 bg-white/50 backdrop-blur-sm`}>
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-6 py-2.5 rounded-full text-sm  font-medium transition-all duration-300 transform active:scale-95
                ${selectedCategory === cat
                  ? 'bg-[#9F9586] text-white shadow-lg scale-105'
                  : 'bg-white text-[#5C5548] border border-[#EFECE5] hover:border-[#9F9586]/50 hover:bg-[#FAF9F6]'}`
              }
            >
              {cat === 'all' ? '所有作品' : cat}
            </button>
          ))}
        </div>

        {/* Skeleton Loading State */}
        {showSkeleton ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <PortfolioCardSkeleton key={i} />
            ))}
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="text-center text-[#8A8175] p-12 bg-white rounded-3xl border border-[#EFECE5] mx-auto max-w-lg">
            <p className="text-lg">目前沒有符合條件的作品。</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {filteredItems.map(item => (
              <div key={item.id} className="group flex flex-row bg-white rounded-2xl shadow-sm border border-[#EFECE5] overflow-hidden hover:shadow-xl transition-all duration-300 hover:-translate-y-1 h-full">
                <div className="relative overflow-hidden w-1/2 min-w-[50%] max-w-[50%] shrink-0">
                  {item.imageUrls && item.imageUrls.length > 0 && (
                    <img
                      src={item.imageUrls[0]}
                      alt={item.title}
                      className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                      loading="lazy"
                    />
                  )}
                  {/* Fallback or spacer if no image, or to set aspect ratio? 
                      If we want the image to dictate height, we can't use absolute.
                      If we want content to dictate height, we use absolute on image.
                      Let's try: Image container has aspect ratio? Or just fills height of content?
                      The problem: If title is short, card is short. Image gets cropped?
                      Or if image is tall?

                      User said "inconsistent width".
                      
                      Let's switch to:
                      Image container: w-1/2 shrink-0
                      Image: w-full h-full object-cover (absolute positioning)
                      
                      AND we need to ensure the card has a minimum height so the image isn't 0px.
                  */}
                  <div className="pb-[100%]"></div> {/* Aspect Ratio Spacer 1:1 (Square) */}
                  {item.imageUrls && item.imageUrls.length > 0 && (
                    <img
                      src={item.imageUrls[0]}
                      alt={item.title}
                      className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                      loading="lazy"
                    />
                  )}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300" />
                </div>

                <div className="p-5 flex flex-col gap-3 w-1/2 flex-grow">
                  <div>
                    <div className="flex justify-between items-start mb-1">
                      <span className="text-xs font-bold px-2 py-1 bg-[#EFECE5] text-[#8A8175] rounded-md line-clamp-1">
                        {item.category}
                      </span>
                    </div>
                    <h3 className="text-lg font-bold text-[#2C2825] font-serif line-clamp-2">{item.title}</h3>
                  </div>

                  <div className="mt-auto">
                    <p className="text-sm text-[#8A8175] line-clamp-2 mb-3">{item.description}</p>
                    <button
                      onClick={() => handleBookStyle(item.category)}
                      className="w-full py-2.5 px-4 bg-[#2C2825] text-white text-xs sm:text-sm font-bold rounded-xl opacity-90 hover:opacity-100 hover:shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2"
                    >
                      <span>立即預約此款</span>
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                        <path fillRule="evenodd" d="M3 3a1 1 0 00-1 1v12a1 1 0 102 0V4a1 1 0 00-1-1zm10.293 9.293a1 1 0 001.414 1.414l3-3a1 1 0 000-1.414l-3-3a1 1 0 10-1.414 1.414L14.586 9H7a1 1 0 100 2h7.586l-1.293 1.293z" clipRule="evenodd" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default PortfolioGalleryPage;
