import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import usePortfolioItems from '../hooks/usePortfolioItems';
import { useServiceCategories } from '../hooks/useServiceCategories';
import { isLiffBrowser } from '../lib/liff';
import type { PortfolioItem } from '../types/portfolio';
import { 
  Sparkles, 
  Search, 
  X, 
  Calendar, 
  Images, 
  ChevronLeft, 
  ChevronRight, 
  ArrowRight,
  User,
  Eye,
  SlidersHorizontal,
  Share2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// Swiper for Lightbox Modal
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination } from 'swiper/modules';
import 'swiper/css';
// @ts-ignore
import 'swiper/css/navigation';
// @ts-ignore
import 'swiper/css/pagination';

// Skeleton Card Component
const PortfolioSkeletonCard = () => (
  <div className="bg-white rounded-3xl overflow-hidden border border-[#EFECE5] shadow-soft animate-pulse">
    <div className="aspect-[4/5] bg-gray-200" />
    <div className="p-4 space-y-2.5">
      <div className="flex justify-between items-center">
        <div className="w-16 h-4 bg-gray-200 rounded-md" />
        <div className="w-12 h-4 bg-gray-200 rounded-md" />
      </div>
      <div className="w-3/4 h-5 bg-gray-200 rounded" />
      <div className="w-full h-8 bg-gray-200 rounded-xl mt-3" />
    </div>
  </div>
);

const PortfolioGalleryPage = () => {
  const { portfolioItems, loading, error } = usePortfolioItems();
  const { categories: serviceCategories, isLoading: categoriesLoading } = useServiceCategories();
  const navigate = useNavigate();
  const isLiff = isLiffBrowser();

  // Filter & Search State
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  
  // Lightbox Modal State
  const [selectedItem, setSelectedItem] = useState<PortfolioItem | null>(null);
  const [copiedToast, setCopiedToast] = useState(false);

  // Dynamic Categories from Firestore
  const categories = useMemo(() => {
    const dynCats = serviceCategories
      .map(c => c.name)
      .filter(name => name !== '加購項目');
    return ['all', ...dynCats];
  }, [serviceCategories]);

  // Filtered & Searched Portfolio Items
  const filteredItems = useMemo(() => {
    return portfolioItems.filter(item => {
      if (!item.isActive || item.category === '加購項目') return false;
      
      // Category Match
      const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
      
      // Search Match
      const q = searchQuery.trim().toLowerCase();
      const matchesSearch = !q || (
        item.title?.toLowerCase().includes(q) ||
        item.description?.toLowerCase().includes(q) ||
        item.category?.toLowerCase().includes(q) ||
        item.designerName?.toLowerCase().includes(q)
      );

      return matchesCategory && matchesSearch;
    });
  }, [portfolioItems, selectedCategory, searchQuery]);

  // Category counts
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { all: 0 };
    portfolioItems.forEach(item => {
      if (!item.isActive || item.category === '加購項目') return;
      counts.all = (counts.all || 0) + 1;
      counts[item.category] = (counts[item.category] || 0) + 1;
    });
    return counts;
  }, [portfolioItems]);

  const handleBookStyle = (item?: PortfolioItem) => {
    const category = item?.category || selectedCategory;
    const url = category && category !== 'all'
      ? `/booking?category=${encodeURIComponent(category)}`
      : '/booking';
    navigate(url);
  };

  const handleShare = (item: PortfolioItem) => {
    if (navigator.share) {
      navigator.share({
        title: `${item.title} | TREERING 希亞美學`,
        text: item.description,
        url: window.location.href,
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(window.location.href);
      setCopiedToast(true);
      setTimeout(() => setCopiedToast(false), 2500);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF9F6] pb-28 md:pb-16 text-text-main selection:bg-primary/20">
      
      {/* Top Ambient Glow Background */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-80 bg-gradient-to-b from-[#EFECE5]/80 via-[#FAF9F6]/40 to-transparent pointer-events-none -z-10 blur-3xl" />

      {/* Header Banner */}
      <header className="pt-4 sm:pt-8 pb-4">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#9F9586]/15 text-[#8A8173] border border-[#9F9586]/30">
            <Sparkles className="w-3.5 h-3.5 text-[#9F9586]" />
            TREERING Gallery
          </span>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-serif font-bold text-gray-900 tracking-tight">
            精選作品集鑑賞
          </h1>
          <p className="text-xs sm:text-sm text-text-light max-w-md mx-auto leading-relaxed">
            探索最新日韓凝膠美甲、極細柔睫與自然霧眉靈感款式，遇見專屬您的美麗姿態
          </p>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        
        {/* ========================================================================= */}
        {/* 1. STICKY FILTER BAR & SEARCH INPUT                                      */}
        {/* ========================================================================= */}
        <div className={`sticky ${isLiff ? 'top-0' : 'top-16'} z-20 bg-[#FAF9F6]/95 backdrop-blur-md py-3 -mx-4 px-4 sm:mx-0 sm:px-0 space-y-3 transition-all`}>
          
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            
            {/* Horizontal Scrollable Category Pills */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 custom-scrollbar sm:pb-0 scroll-smooth">
              {categories.map(cat => {
                const count = categoryCounts[cat] || 0;
                const isSelected = selectedCategory === cat;

                return (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-4 py-2 rounded-2xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all duration-200 flex items-center gap-1.5 shrink-0 cursor-pointer ${
                      isSelected
                        ? 'bg-[#9F9586] text-white shadow-sm scale-[1.02]'
                        : 'bg-white text-text-main border border-[#EFECE5] hover:border-[#9F9586]/40 hover:bg-[#FAF9F6]'
                    }`}
                  >
                    <span>{cat === 'all' ? '所有款式' : cat}</span>
                    {count > 0 && (
                      <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-medium ${
                        isSelected ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-500'
                      }`}>
                        {count}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Keyword Search Input */}
            <div className="relative w-full sm:w-64 shrink-0">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="搜尋款式、風格或設計師..."
                className="w-full pl-9 pr-8 py-2 bg-white rounded-2xl border border-[#EFECE5] text-xs sm:text-sm text-text-main placeholder:text-text-light/60 focus:outline-none focus:border-[#9F9586] focus:ring-1 focus:ring-[#9F9586] shadow-subtle transition-all"
              />
              <Search className="w-4 h-4 text-text-light absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 rounded-full cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

          </div>

          {/* Results counter indicator */}
          <div className="flex items-center justify-between text-xs text-text-light px-1">
            <span>
              共 <strong className="text-gray-900 font-bold">{filteredItems.length}</strong> 款精緻設計
            </span>
            {searchQuery && (
              <span className="text-[#9F9586]">
                包含「{searchQuery}」的搜尋結果
              </span>
            )}
          </div>

        </div>

        {/* ========================================================================= */}
        {/* 2. PORTFOLIO CARDS GRID                                                  */}
        {/* ========================================================================= */}
        {loading || categoriesLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-5 lg:gap-6">
            {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
              <PortfolioSkeletonCard key={i} />
            ))}
          </div>
        ) : error ? (
          <div className="text-center py-16 bg-white rounded-3xl border border-dashed border-rose-200 text-rose-600 p-6 max-w-md mx-auto">
            <p className="font-bold text-sm">載入作品集失敗</p>
            <p className="text-xs text-gray-500 mt-1">{error}</p>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-3xl border border-dashed border-[#EFECE5] p-8 max-w-md mx-auto space-y-3 shadow-subtle">
            <div className="w-12 h-12 rounded-full bg-[#FAF9F6] border border-[#EFECE5] flex items-center justify-center mx-auto text-[#9F9586]">
              <Images className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-gray-900 text-sm">找不到符合條件的作品</h3>
              <p className="text-xs text-text-light mt-1">請嘗試更換分類或清除搜尋關鍵字</p>
            </div>
            <button
              onClick={() => {
                setSelectedCategory('all');
                setSearchQuery('');
              }}
              className="px-4 py-2 bg-[#9F9586] text-white text-xs font-bold rounded-xl hover:bg-[#8A8173] transition-all shadow-sm cursor-pointer"
            >
              清除所有篩選
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-5 lg:gap-6">
            {filteredItems.map(item => {
              const imageCount = item.imageUrls?.length || 0;
              const mainImage = item.imageUrls?.[0] || 'https://images.unsplash.com/photo-1604654894610-df63bc536371?q=80&w=600&auto=format&fit=crop';

              return (
                <div
                  key={item.id}
                  onClick={() => setSelectedItem(item)}
                  className="group bg-white rounded-3xl overflow-hidden border border-[#EFECE5] shadow-soft hover:shadow-strong transition-all duration-300 flex flex-col cursor-pointer active:scale-[0.98]"
                >
                  {/* Photo Canvas */}
                  <div className="relative aspect-[4/5] w-full overflow-hidden bg-secondary-dark">
                    <img
                      src={mainImage}
                      alt={item.title}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                    {/* Category Badge */}
                    <span className="absolute top-2.5 left-2.5 px-2.5 py-0.5 bg-white/90 backdrop-blur-md text-gray-900 text-[10px] sm:text-xs font-bold rounded-full shadow-sm">
                      {item.category}
                    </span>

                    {/* Multi-Photo Indicator */}
                    {imageCount > 1 && (
                      <span className="absolute top-2.5 right-2.5 px-2 py-0.5 bg-black/50 backdrop-blur-md text-white text-[10px] font-medium rounded-full flex items-center gap-1 border border-white/20">
                        <Images className="w-3 h-3" />
                        <span>{imageCount}</span>
                      </span>
                    )}

                    {/* Hover Quick Action Badge */}
                    <div className="absolute inset-x-3 bottom-3 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <span className="w-full py-2 bg-white/95 backdrop-blur-md text-gray-900 text-xs font-bold rounded-xl shadow-md text-center flex items-center justify-center gap-1.5">
                        <Eye className="w-3.5 h-3.5 text-[#9F9586]" />
                        <span>查看大圖與詳情</span>
                      </span>
                    </div>
                  </div>

                  {/* Card Info Content */}
                  <div className="p-3.5 sm:p-4 flex-1 flex flex-col justify-between space-y-2">
                    <div>
                      <h3 className="font-bold text-gray-900 text-xs sm:text-sm font-serif line-clamp-1 group-hover:text-[#9F9586] transition-colors">
                        {item.title}
                      </h3>
                      {item.description && (
                        <p className="text-[11px] sm:text-xs text-text-light line-clamp-1 mt-0.5">
                          {item.description}
                        </p>
                      )}
                    </div>

                    <div className="pt-2 border-t border-[#EFECE5] flex items-center justify-between text-[11px] text-text-light">
                      <span className="flex items-center gap-1 truncate">
                        <User className="w-3 h-3 text-[#9F9586] shrink-0" />
                        <span className="truncate">{item.designerName || '希亞特約設計師'}</span>
                      </span>
                      <span className="text-[#9F9586] font-bold shrink-0 flex items-center">
                        預約
                        <ChevronRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                      </span>
                    </div>
                  </div>

                </div>
              );
            })}
          </div>
        )}

      </main>

      {/* ========================================================================= */}
      {/* 3. LIGHTBOX DETAIL MODAL                                                  */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {selectedItem && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-6">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedItem(null)}
              className="absolute inset-0 bg-black/80 backdrop-blur-md"
            />

            {/* Modal Dialog Content */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ duration: 0.25 }}
              className="relative w-full max-w-2xl bg-white rounded-3xl overflow-hidden shadow-2xl z-10 max-h-[90vh] flex flex-col"
            >
              {/* Top Close & Share Bar */}
              <div className="absolute top-3 right-3 z-30 flex items-center gap-2">
                <button
                  onClick={() => handleShare(selectedItem)}
                  className="p-2 rounded-full bg-black/40 hover:bg-black/60 text-white backdrop-blur-md transition-all shadow-md cursor-pointer"
                  title="分享款式"
                >
                  <Share2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setSelectedItem(null)}
                  className="p-2 rounded-full bg-black/40 hover:bg-black/60 text-white backdrop-blur-md transition-all shadow-md cursor-pointer"
                  title="關閉"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Swiper Photos Slider */}
              <div className="relative w-full aspect-square sm:aspect-[4/3] bg-black shrink-0">
                {selectedItem.imageUrls && selectedItem.imageUrls.length > 0 ? (
                  <Swiper
                    modules={[Navigation, Pagination]}
                    navigation
                    pagination={{ clickable: true }}
                    className="w-full h-full custom-swiper-nav"
                  >
                    {selectedItem.imageUrls.map((url, idx) => (
                      <SwiperSlide key={idx} className="flex items-center justify-center bg-black">
                        <img
                          src={url}
                          alt={`${selectedItem.title} - ${idx + 1}`}
                          className="w-full h-full object-contain"
                        />
                      </SwiperSlide>
                    ))}
                  </Swiper>
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-white/50">
                    暫無相片
                  </div>
                )}
              </div>

              {/* Detail Info & CTA Body */}
              <div className="p-5 sm:p-6 overflow-y-auto space-y-4 flex-1">
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#9F9586]/15 text-[#8A8173] border border-[#9F9586]/30">
                      {selectedItem.category}
                    </span>
                    <h2 className="text-xl sm:text-2xl font-serif font-bold text-gray-900">
                      {selectedItem.title}
                    </h2>
                  </div>

                  {selectedItem.designerName && (
                    <div className="text-right shrink-0">
                      <span className="text-[10px] text-text-light block">主創設計師</span>
                      <span className="text-xs sm:text-sm font-bold text-gray-800 flex items-center gap-1 justify-end">
                        <User className="w-3.5 h-3.5 text-[#9F9586]" />
                        {selectedItem.designerName}
                      </span>
                    </div>
                  )}
                </div>

                {selectedItem.description && (
                  <div className="bg-[#FAF9F6] p-4 rounded-2xl border border-[#EFECE5]">
                    <p className="text-xs sm:text-sm text-text-main leading-relaxed whitespace-pre-line">
                      {selectedItem.description}
                    </p>
                  </div>
                )}

                {/* Direct Booking CTA */}
                <div className="pt-2 flex gap-3">
                  <button
                    onClick={() => {
                      setSelectedItem(null);
                      handleBookStyle(selectedItem);
                    }}
                    className="flex-1 py-3 bg-[#9F9586] hover:bg-[#8A8173] text-white text-xs sm:text-sm font-bold rounded-2xl transition-all shadow-md active:scale-98 flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Calendar className="w-4 h-4" />
                    <span>立即預約此款式 / 分類</span>
                  </button>
                  <button
                    onClick={() => setSelectedItem(null)}
                    className="px-5 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs sm:text-sm font-medium rounded-2xl transition-all cursor-pointer"
                  >
                    關閉
                  </button>
                </div>
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Copy Toast Alert */}
      <AnimatePresence>
        {copiedToast && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[10000] px-4 py-2 bg-gray-900 text-white text-xs font-bold rounded-xl shadow-lg flex items-center gap-1.5"
          >
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>已複製作品連結至剪貼簿</span>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
};

export default PortfolioGalleryPage;
