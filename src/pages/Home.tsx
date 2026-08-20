import { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuthStore } from '../store/authStore';
import { useBookings } from '../hooks/useBookings';
import usePortfolioItems from '../hooks/usePortfolioItems';
import { 
  Sparkles, 
  Calendar, 
  Clock, 
  Image as ImageIcon, 
  ChevronRight, 
  ShieldCheck, 
  MapPin,
  Heart, 
  Award,
  ArrowRight,
  Eye,
} from 'lucide-react';
import CustomerReviews from '../components/home/CustomerReviews';
import { format, isBefore } from 'date-fns';

// Swiper Imports
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay } from 'swiper/modules';
import 'swiper/css';
// @ts-ignore
import 'swiper/css/autoplay';

const Home = () => {
  const { userProfile, currentUser } = useAuthStore();
  const { bookings } = useBookings();
  const { portfolioItems } = usePortfolioItems();
  const navigate = useNavigate();

  const [homepageImages, setHomepageImages] = useState<{
    beforeAfter: { before: string; after: string };
    lashImages: string[];
    nailImages: string[];
    browImages: string[];
  }>({
    beforeAfter: { before: '', after: '' },
    lashImages: [],
    nailImages: [],
    browImages: [],
  });

  const [activeCategoryTab, setActiveCategoryTab] = useState<'all' | 'nail' | 'lash' | 'brow'>('all');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const imgDocRef = doc(db, 'globals', 'homepageImages');
        const imgDocSnap = await getDoc(imgDocRef);
        if (imgDocSnap.exists()) {
          setHomepageImages(imgDocSnap.data() as any);
        }
      } catch (error) {
        console.error("Error fetching home data:", error);
      }
    };
    fetchData();
  }, []);

  // Compute Nearest Upcoming Booking
  const now = new Date();
  const upcomingBookings = bookings
    .filter(b => !isBefore(b.dateTime, now) && !['completed', 'cancelled'].includes(b.status))
    .sort((a, b) => a.dateTime.getTime() - b.dateTime.getTime());

  const nextBooking = upcomingBookings[0];

  // Dynamic Greeting based on time of day
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return '早安';
    if (hour < 18) return '午安';
    return '晚安';
  };

  // Helper to find image for category: homepageImages first, then fallback to latest Portfolio item
  const getCategoryImage = (categoryKeywords: string[], specificHomepageImages?: string[]) => {
    if (specificHomepageImages && specificHomepageImages.length > 0 && specificHomepageImages[0]) {
      return specificHomepageImages[0];
    }
    const match = portfolioItems.find(item => 
      item.isActive && 
      item.imageUrls?.length > 0 && 
      categoryKeywords.some(kw => item.category?.includes(kw))
    );
    return match?.imageUrls?.[0] || '';
  };

  // Core Services Data with automatic portfolio image fallback
  const coreServices = [
    {
      id: 'nails',
      title: '質感美甲',
      subtitle: 'GEL NAIL ART',
      desc: '日本頂級凝膠・法式暈染手繪・客製養甲',
      price: '$1,000 起',
      category: '質感美甲',
      image: getCategoryImage(['美甲', '甲'], homepageImages.nailImages),
      icon: '💅',
      tag: '人氣首選',
    },
    {
      id: 'eyelash',
      title: '日式美睫',
      subtitle: 'JAPANESE EYELASH',
      desc: '極細羽柔單根・多層次山茶花・根根分明',
      price: '$1,000 起',
      category: '日式美睫',
      image: getCategoryImage(['美睫', '睫'], homepageImages.lashImages),
      icon: '👁️',
      tag: '自然空氣感',
    },
    {
      id: 'brows',
      title: '韓式霧眉',
      subtitle: 'POWDER BROWS',
      desc: '半永久柔霧定妝・原生毛流感・客製眼眉比例',
      price: '$5,500 起',
      category: '韓式霧眉',
      image: getCategoryImage(['霧眉', '眉'], homepageImages.browImages),
      icon: '✨',
      tag: '素顏神器',
    },
  ];

  // Gallery images with filter - Combined from homepageImages and real Portfolio collection
  const galleryImages = useMemo(() => {
    const list: { url: string; category: string }[] = [];
    const seenUrls = new Set<string>();

    // 1. Add from homepageImages
    if (activeCategoryTab === 'all' || activeCategoryTab === 'nail') {
      (homepageImages.nailImages || []).forEach(img => {
        if (img && !seenUrls.has(img)) {
          seenUrls.add(img);
          list.push({ url: img, category: '美甲' });
        }
      });
    }
    if (activeCategoryTab === 'all' || activeCategoryTab === 'lash') {
      (homepageImages.lashImages || []).forEach(img => {
        if (img && !seenUrls.has(img)) {
          seenUrls.add(img);
          list.push({ url: img, category: '美睫' });
        }
      });
    }
    if (activeCategoryTab === 'all' || activeCategoryTab === 'brow') {
      (homepageImages.browImages || []).forEach(img => {
        if (img && !seenUrls.has(img)) {
          seenUrls.add(img);
          list.push({ url: img, category: '霧眉' });
        }
      });
    }

    // 2. Fallback / Add from real Portfolio items
    portfolioItems.forEach(item => {
      if (!item.isActive || !item.imageUrls || item.imageUrls.length === 0) return;

      let catLabel = '美甲';
      if (item.category?.includes('睫')) catLabel = '美睫';
      else if (item.category?.includes('眉')) catLabel = '霧眉';

      const matchesTab = 
        activeCategoryTab === 'all' ||
        (activeCategoryTab === 'nail' && catLabel === '美甲') ||
        (activeCategoryTab === 'lash' && catLabel === '美睫') ||
        (activeCategoryTab === 'brow' && catLabel === '霧眉');

      if (matchesTab) {
        item.imageUrls.forEach(url => {
          if (url && !seenUrls.has(url)) {
            seenUrls.add(url);
            list.push({ url, category: catLabel });
          }
        });
      }
    });

    return list;
  }, [homepageImages, portfolioItems, activeCategoryTab]);

  const displayedGallery = galleryImages;

  return (
    <div className="min-h-screen bg-[#FAF9F6] pb-24 md:pb-16 text-text-main selection:bg-primary/20">
      
      {/* Top Ambient Glow Background */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-72 bg-gradient-to-b from-[#EFECE5]/80 via-[#FAF9F6]/40 to-transparent pointer-events-none -z-10 blur-3xl" />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-3 sm:pt-5 space-y-5 sm:space-y-6">
        
        {/* ========================================================================= */}
        {/* 1. TOP SALUTATION & QUICK ACTION BUTTONS                                   */}
        {/* ========================================================================= */}
        <section className="flex flex-row items-center justify-between gap-3 bg-white/90 backdrop-blur-md rounded-2xl p-4 sm:p-5 border border-[#EFECE5] shadow-soft">
          <div className="space-y-0.5 min-w-0">
            <h1 className="text-2xl sm:text-xl font-serif font-bold text-gray-900 tracking-tight truncate">
              {getGreeting()}，{userProfile?.profile?.displayName || currentUser?.displayName || '親愛的貴賓'}
            </h1>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => navigate('/booking')}
              className="px-3.5 py-2 bg-[#9F9586] hover:bg-[#8A8173] text-white text-xs sm:text-sm font-bold rounded-xl transition-all shadow-sm active:scale-95 flex items-center gap-1.5 cursor-pointer"
            >
              <Calendar className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span>線上預約</span>
            </button>
            <button
              onClick={() => navigate('/portfolio')}
              className="px-3 py-2 bg-[#FAF9F6] hover:bg-[#EFECE5] text-text-main border border-[#EFECE5] text-xs sm:text-sm font-medium rounded-xl transition-all active:scale-95 flex items-center gap-1.5 cursor-pointer"
            >
              <ImageIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#9F9586]" />
              <span className="hidden sm:inline">作品集</span>
            </button>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* 2. UPCOMING BOOKING NOTIFICATION (IF ANY)                                 */}
        {/* ========================================================================= */}
        {nextBooking && (
          <section className="bg-gradient-to-r from-white via-white to-[#FAF9F6] rounded-2xl p-4 sm:p-5 border border-[#9F9586]/30 shadow-soft relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-24 h-24 bg-[#9F9586]/10 rounded-bl-full pointer-events-none" />
            
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </span>
                  <span className="text-[11px] font-bold text-[#8A8173] tracking-wide uppercase">
                    預約提醒
                  </span>
                  <span className="text-[11px] text-text-light">
                    #{nextBooking.id.slice(-6).toUpperCase()}
                  </span>
                </div>

                <h3 className="text-base sm:text-lg font-bold text-gray-900">
                  {nextBooking.serviceName}
                </h3>

                <div className="flex flex-wrap items-center gap-y-1 gap-x-3 text-xs text-text-light">
                  <div className="flex items-center gap-1 text-gray-800 font-medium">
                    <Calendar className="w-3.5 h-3.5 text-[#9F9586]" />
                    <span>{format(nextBooking.dateTime, 'yyyy/MM/dd (eee)')}</span>
                  </div>
                  <div className="flex items-center gap-1 text-gray-800 font-medium">
                    <Clock className="w-3.5 h-3.5 text-[#9F9586]" />
                    <span>{format(nextBooking.dateTime, 'HH:mm')}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5 text-[#9F9586]" />
                    <span>{nextBooking.designerName || '不指定設計師'}</span>
                  </div>
                </div>
              </div>

              <div className="flex gap-2 pt-1 sm:pt-0">
                <button
                  onClick={() => navigate(`/orders/${nextBooking.id}`)}
                  className="px-3.5 py-1.5 bg-[#9F9586] text-white text-xs font-bold rounded-lg hover:bg-[#8A8173] transition-all shadow-sm active:scale-95 cursor-pointer"
                >
                  查看明細
                </button>
                <button
                  onClick={() => navigate(`/member/reschedule/${nextBooking.id}`)}
                  className="px-3 py-1.5 bg-white text-text-main border border-[#EFECE5] text-xs font-medium rounded-lg hover:bg-gray-50 transition-all active:scale-95 cursor-pointer"
                >
                  改期
                </button>
              </div>
            </div>
          </section>
        )}

        {/* ========================================================================= */}
        {/* 3. CORE BEAUTY SERVICES (COMPACT SWIPE CAROUSEL ON MOBILE, 3-COL ON DESKTOP) */}
        {/* ========================================================================= */}
        <section className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#9F9586]" />
              <h2 className="text-base sm:text-lg font-serif font-bold text-gray-900 tracking-tight">
                三大核心服務
              </h2>
            </div>
            <button
              onClick={() => navigate('/booking')}
              className="text-xs text-[#9F9586] hover:text-[#8A8173] font-semibold transition-colors flex items-center gap-0.5 cursor-pointer"
            >
              所有服務價目
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Compact Layout: Swipe deck on mobile, 3-col on desktop */}
          <div className="flex overflow-x-auto snap-x snap-mandatory gap-3 pb-1 -mx-4 px-4 scrollbar-hide md:grid md:grid-cols-3 md:gap-4 md:mx-0 md:px-0 md:overflow-visible">
            {coreServices.map((service) => (
              <div
                key={service.id}
                onClick={() => navigate(`/booking?category=${encodeURIComponent(service.category)}`)}
                className="w-[78vw] max-w-[280px] shrink-0 snap-center md:w-auto group bg-white rounded-2xl overflow-hidden border border-[#EFECE5] shadow-soft hover:shadow-strong transition-all duration-300 flex flex-col cursor-pointer active:scale-[0.98]"
              >
                {/* Photo Header */}
                {service.image ? (
                  <div className="relative aspect-[16/10] w-full overflow-hidden bg-secondary-dark">
                    <img
                      src={service.image}
                      alt={service.title}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-80" />
                    
                    {/* Category Pill Tag */}
                    <span className="absolute top-2.5 left-2.5 px-2.5 py-0.5 bg-white/90 backdrop-blur-md text-gray-900 text-[10px] font-bold rounded-full shadow-sm">
                      {service.tag}
                    </span>

                    {/* Starting Price Badge */}
                    <span className="absolute bottom-2 right-2.5 px-2.5 py-0.5 bg-black/60 backdrop-blur-md text-white text-[11px] font-serif font-bold rounded-full border border-white/20">
                      {service.price}
                    </span>
                  </div>
                ) : (
                  <div className="relative aspect-[16/10] w-full overflow-hidden bg-gradient-to-br from-[#FAF9F6] to-[#EFECE5] flex items-center justify-center border-b border-[#EFECE5]">
                    <span className="text-4xl">{service.icon}</span>
                    <span className="absolute top-2.5 left-2.5 px-2.5 py-0.5 bg-white text-gray-900 text-[10px] font-bold rounded-full shadow-sm">
                      {service.tag}
                    </span>
                    <span className="absolute bottom-2 right-2.5 px-2.5 py-0.5 bg-[#9F9586] text-white text-[11px] font-serif font-bold rounded-full">
                      {service.price}
                    </span>
                  </div>
                )}

                {/* Body Content */}
                <div className="p-3.5 flex-1 flex flex-col justify-between space-y-2">
                  <div>
                    <div className="flex items-center justify-between">
                      <h3 className="text-base font-serif font-bold text-gray-900 group-hover:text-[#9F9586] transition-colors">
                        {service.title}
                      </h3>
                      <span className="text-[9px] tracking-wider text-text-light font-bold">
                        {service.subtitle}
                      </span>
                    </div>
                    <p className="text-[11px] text-text-light mt-1 line-clamp-2 leading-relaxed">
                      {service.desc}
                    </p>
                  </div>

                  <div className="pt-2 border-t border-[#EFECE5] flex items-center justify-between text-[11px] font-bold text-[#9F9586]">
                    <span>前往預約</span>
                    <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ========================================================================= */}
        {/* 4. REAL CUSTOMER REVIEWS (PROMOTED HERE WITH SMOOTH VERTICAL SCROLL)       */}
        {/* ========================================================================= */}
        <section className="space-y-2">
          <CustomerReviews />
        </section>

        {/* ========================================================================= */}
        {/* 5. FEATURED GALLERY & WORKS SLIDER                                       */}
        {/* ========================================================================= */}
        {displayedGallery.length > 0 && (
          <section className="space-y-3">
            <div className="flex flex-row items-center justify-between gap-2 px-1">
              <div className="flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-[#9F9586]" />
                <h2 className="text-base sm:text-lg font-serif font-bold text-gray-900 tracking-tight">
                  精選作品鑑賞
                </h2>
              </div>

              {/* Filter Tabs */}
              <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-[#EFECE5] shadow-subtle shrink-0">
                {[
                  { key: 'all', label: '全部' },
                  { key: 'nail', label: '美甲' },
                  { key: 'lash', label: '美睫' },
                  { key: 'brow', label: '霧眉' },
                ].map(tab => (
                  <button
                    key={tab.key}
                    onClick={() => setActiveCategoryTab(tab.key as any)}
                    className={`px-2.5 py-0.5 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                      activeCategoryTab === tab.key
                        ? 'bg-[#9F9586] text-white shadow-sm'
                        : 'text-gray-500 hover:text-gray-900'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Swiper Works Carousel */}
            <div className="relative">
              <Swiper
                modules={[Autoplay]}
                spaceBetween={10}
                slidesPerView={2.3}
                loop={displayedGallery.length > 3}
                speed={1000}
                autoplay={{
                  delay: 2500,
                  disableOnInteraction: false,
                  pauseOnMouseEnter: true
                }}
                breakpoints={{
                  640: {
                    slidesPerView: 3.3,
                    spaceBetween: 14,
                  },
                  1024: {
                    slidesPerView: 4.3,
                    spaceBetween: 16,
                  },
                }}
                className="w-full py-0.5"
              >
                {displayedGallery.map((item, index) => (
                  <SwiperSlide key={index}>
                    <Link
                      to="/portfolio"
                      className="block aspect-square rounded-xl overflow-hidden shadow-soft hover:shadow-medium transition-all group relative border border-[#EFECE5] bg-secondary-dark active:scale-95"
                    >
                      <img
                        src={item.url}
                        alt={`作品展示 ${index + 1}`}
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                        loading="lazy"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-2.5">
                        <span className="text-white text-[11px] font-bold flex items-center gap-1">
                          <Eye className="w-3 h-3" />
                          細節
                        </span>
                      </div>
                      <span className="absolute top-2 right-2 px-1.5 py-0.5 bg-black/40 backdrop-blur-md text-white text-[9px] font-bold rounded">
                        {item.category}
                      </span>
                    </Link>
                  </SwiperSlide>
                ))}
              </Swiper>
            </div>

            <div className="text-center pt-0.5">
              <button
                onClick={() => navigate('/portfolio')}
                className="inline-flex items-center gap-1 text-xs font-bold text-[#9F9586] hover:text-[#8A8173] transition-colors cursor-pointer"
              >
                <span>瀏覽完整作品藝廊 (Portfolio)</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </section>
        )}

        {/* ========================================================================= */}
        {/* 6. BRAND VALUE & PHILOSOPHY (COMPACT 2x2 GRID ON MOBILE)                   */}
        {/* ========================================================================= */}
        <section className="bg-white rounded-2xl p-4 sm:p-6 border border-[#EFECE5] shadow-soft space-y-4">
          <div className="text-center max-w-xl mx-auto space-y-0.5">
            <span className="text-[10px] font-bold text-[#9F9586] tracking-wider uppercase">
              Brand Philosophy
            </span>
            <h2 className="text-base sm:text-lg font-serif font-bold text-gray-900">
              為什麼選擇 TREERING ?
            </h2>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3.5">
            
            <div className="bg-[#FAF9F6] p-3 sm:p-4 rounded-xl border border-[#EFECE5] space-y-1.5">
              <div className="w-8 h-8 rounded-lg bg-white border border-[#EFECE5] flex items-center justify-center text-[#9F9586] shadow-subtle">
                <Heart className="w-4 h-4" />
              </div>
              <h3 className="font-bold text-gray-900 text-xs sm:text-sm">日本頂級凝膠</h3>
              <p className="text-[11px] text-text-light leading-relaxed">
                無毒環保，透氣不傷甲面，色澤飽滿純淨持久。
              </p>
            </div>

            <div className="bg-[#FAF9F6] p-3 sm:p-4 rounded-xl border border-[#EFECE5] space-y-1.5">
              <div className="w-8 h-8 rounded-lg bg-white border border-[#EFECE5] flex items-center justify-center text-[#9F9586] shadow-subtle">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <h3 className="font-bold text-gray-900 text-xs sm:text-sm">醫療級滅菌消毒</h3>
              <p className="text-[11px] text-text-light leading-relaxed">
                一人一套拋棄式耗材，器械高壓紫外線滅菌。
              </p>
            </div>

            <div className="bg-[#FAF9F6] p-3 sm:p-4 rounded-xl border border-[#EFECE5] space-y-1.5">
              <div className="w-8 h-8 rounded-lg bg-white border border-[#EFECE5] flex items-center justify-center text-[#9F9586] shadow-subtle">
                <Sparkles className="w-4 h-4" />
              </div>
              <h3 className="font-bold text-gray-900 text-xs sm:text-sm">量身客製美感</h3>
              <p className="text-[11px] text-text-light leading-relaxed">
                依據個人甲型眼型，調配專屬修飾造型。
              </p>
            </div>

            <div className="bg-[#FAF9F6] p-3 sm:p-4 rounded-xl border border-[#EFECE5] space-y-1.5">
              <div className="w-8 h-8 rounded-lg bg-white border border-[#EFECE5] flex items-center justify-center text-[#9F9586] shadow-subtle">
                <Award className="w-4 h-4" />
              </div>
              <h3 className="font-bold text-gray-900 text-xs sm:text-sm">7 天安心保固</h3>
              <p className="text-[11px] text-text-light leading-relaxed">
                7 天內非人為掉鑽脫膠，提供免費原店修補。
              </p>
            </div>

          </div>
        </section>

        {/* ========================================================================= */}
        {/* 7. STORE INFO & NAVIGATION SHORTCUT                                       */}
        {/* ========================================================================= */}
        <section className=" hidden bg-gradient-to-br from-[#9F9586] to-[#8A8173] text-white rounded-2xl p-5 sm:p-6 shadow-medium relative overflow-hidden">
          <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full blur-2xl pointer-events-none" />
          
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-2 max-w-xl">
              <span className="px-2.5 py-0.5 bg-white/20 backdrop-blur-md rounded-full text-[10px] font-bold tracking-wider uppercase border border-white/20">
                Salon Sanctuary
              </span>
              <h2 className="text-xl sm:text-2xl font-serif font-bold">
                TREERING 希亞美學・門市資訊
              </h2>
              <p className="text-xs text-white/85 leading-relaxed">
                隱身於靜謐巷弄中的質感包廂空間，讓每次美甲美睫都是放鬆的享受。
              </p>

              <div className="flex flex-wrap gap-3 pt-0.5 text-xs text-white/90">
                <div className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-white/75" />
                  <span>週一至週日 10:00 - 20:00</span>
                </div>
                <div className="flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-white/75" />
                  <span>預約制專屬服務</span>
                </div>
              </div>
            </div>

            <div className="flex flex-row md:flex-col gap-2 shrink-0">
              <button
                onClick={() => navigate('/store')}
                className="flex-1 md:flex-none px-4 py-2.5 bg-white text-gray-900 hover:bg-[#FAF9F6] text-xs font-bold rounded-xl transition-all shadow-md active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <MapPin className="w-3.5 h-3.5 text-[#9F9586]" />
                <span>門市地圖</span>
              </button>
              <button
                onClick={() => navigate('/booking')}
                className="flex-1 md:flex-none px-4 py-2.5 bg-white/20 hover:bg-white/30 backdrop-blur-md text-white text-xs font-bold rounded-xl border border-white/30 transition-all active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Calendar className="w-3.5 h-3.5" />
                <span>立即預約</span>
              </button>
            </div>
          </div>
        </section>

      </div>
    </div>
  );
};

export default Home;