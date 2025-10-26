import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';

// Import Swiper React components
import { Swiper, SwiperSlide } from 'swiper/react';
import { Pagination, EffectCoverflow, Autoplay } from 'swiper/modules';
import BeforeAfterSlider from '../components/BeforeAfterSlider';

// Import Swiper styles
import 'swiper/css';
import 'swiper/css/pagination';

// 服務項目資料
const categories = [
  {
    title: '美睫服務',
    emoji: '👁️',
    description: '打造迷人電眼，多種款式與材質選擇。',
    highlights: ['日式嫁接', '自然濃密', '持久舒適'],
    link: '/booking?category=美睫',
  },
  {
    title: '霧眉服務',
    emoji: '✨',
    description: '專業霧眉技術，讓您擁有自然持久的完美眉型。',
    highlights: ['韓式霧眉', '客製設計', '自然妝感'],
    link: '/booking?category=霧眉',
  },
  {
    title: '美甲服務',
    emoji: '💅',
    description: '從基礎保養到精緻設計，讓您的指尖綻放光彩。',
    highlights: ['凝膠指甲', '手繪設計', '保養護理'],
    link: '/booking?category=美甲',
  },
];

const Home = () => {
  const [homepageImages, setHomepageImages] = useState({
    beforeAfter: { before: '', after: '' },
    lashImages: [],
    nailImages: [],
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchImages = async () => {
      try {
        const docRef = doc(db, 'globals', 'homepageImages');
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setHomepageImages(docSnap.data() as any);
        }
      } catch (error) {
        console.error("Error fetching homepage images:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchImages();
  }, []);

  return (
    <div className="bg-gray-50 text-gray-800 h-screen overflow-y-auto snap-y snap-mandatory scroll-smooth">
      {/* Hero Section */}
      <header className="relative min-h-screen flex items-center justify-center text-center text-white overflow-hidden pt-[72px] snap-start snap-always">
        {/* Background Image with Parallax effect */}
        <div
          className="absolute inset-0 bg-cover bg-center lg:bg-fixed"
          style={{ 
            backgroundImage: "url('https://firebasestorage.googleapis.com/v0/b/nail-62ea4.firebasestorage.app/o/logo.jpg?alt=media&token=37e1e109-cf49-4806-b1fb-7bde26cc4015')",
            transform: 'scale(1.05)'
          }}
        ></div>
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/40 to-black/60"></div>
        
        {/* Content */}
        <div className="relative z-10 max-w-4xl px-6 sm:px-8">
           <h1 
            className="text-7xl tracking-tight mb-4 sm:mb-6 leading-tight animate-fade-in" 
            style={{ fontFamily: "'Noto Serif Display', serif", textShadow: '0 4px 12px rgba(0, 0, 0, 0.5)', color: '#9F9586' }}
          >
            TREERING
          </h1>
          <p className="max-w-2xl mx-auto text-base sm:text-lg md:text-xl text-gray-100 mb-8 sm:mb-10 leading-relaxed px-4" 
             style={{ textShadow: '0 2px 8px rgba(0,0,0,0.5)' }}>
            專業美甲與美睫服務，為您打造專屬的精緻美麗
          </p>
          <Link
            to="/login"
            className="inline-block bg-gradient-to-r from-[#E97EB5] to-[#D96BA5] text-white font-bold rounded-full py-3 px-8 sm:py-4 sm:px-10 text-base sm:text-lg shadow-2xl hover:shadow-pink-500/50 hover:scale-105 active:scale-95 transition-all duration-300"
          >
            立即預約
          </Link>
          
          
        </div>
        {/* Scroll indicator */}
          <div className="absolute bottom-5 left-1/2 -translate-x-1/2 animate-bounce">
            <svg className="w-6 h-6 text-white/70" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
              <path d="M19 14l-7 7m0 0l-7-7m7 7V3"></path>
            </svg>
          </div>
      </header>

      <main>
        {/* Services Section */}
        <section id="services" className="min-h-screen flex items-center py-16 sm:py-20 bg-white snap-start snap-always">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 w-full">
            <div className="text-center mb-10 sm:mb-14">
              <h2 className="text-3xl sm:text-4xl font-bold mb-3 sm:mb-4">服務項目</h2>
              <div className="w-20 h-1 bg-gradient-to-r from-pink-400 to-purple-500 mx-auto mb-4"></div>
              <p className="text-gray-600 text-sm sm:text-base max-w-2xl mx-auto px-4">
                我們提供多樣化的專業服務，滿足您對美的所有想像
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 max-w-6xl mx-auto">
              {categories.map((category, index) => (
                <div 
                  key={category.title} 
                  className="group bg-white border-2 border-gray-100 rounded-2xl shadow-md hover:shadow-2xl overflow-hidden transform hover:-translate-y-2 transition-all duration-300"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  {/* Icon header */}
                  <div className="bg-gradient-to-br from-pink-50 to-purple-50 p-6 sm:p-8 text-center border-b border-gray-100">
                    <div className="text-5xl sm:text-6xl mb-3 transform group-hover:scale-110 transition-transform duration-300">
                      {category.emoji}
                    </div>
                    <h3 className="text-xl sm:text-2xl font-bold text-gray-800">{category.title}</h3>
                  </div>
                  
                  {/* Content */}
                  <div className="p-5 sm:p-6">
                    <p className="text-gray-600 text-sm sm:text-base mb-4 text-center leading-relaxed">
                      {category.description}
                    </p>
                    
                    {/* Highlights */}
                    <div className="flex flex-wrap justify-center gap-2 mb-5">
                      {category.highlights.map((highlight) => (
                        <span 
                          key={highlight}
                          className="text-xs px-3 py-1 bg-pink-50 text-pink-600 rounded-full border border-pink-200"
                        >
                          {highlight}
                        </span>
                      ))}
                    </div>
                    
                    {/* CTA Button */}
                    <Link 
                      to={category.link} 
                      className="block w-full bg-gradient-to-r from-pink-500 to-purple-600 text-white font-semibold rounded-xl py-3 text-sm sm:text-base hover:from-pink-600 hover:to-purple-700 transition-all shadow-md hover:shadow-lg transform hover:scale-[1.02] active:scale-[0.98] text-center"
                    >
                      立即預約
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Works Section */}
        <section id="works" className="min-h-screen flex items-center py-16 sm:py-20 bg-gradient-to-b from-white to-pink-50/30 snap-start snap-always">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 w-full">
            <div className="text-center mb-10 sm:mb-14">
              <h2 className="text-3xl sm:text-4xl font-bold mb-3 sm:mb-4">作品集</h2>
              <div className="w-20 h-1 bg-gradient-to-r from-pink-400 to-purple-500 mx-auto mb-4"></div>
              <p className="text-gray-600 text-sm sm:text-base max-w-2xl mx-auto px-4">
                拖曳中間的滑桿，查看我們為顧客帶來的驚喜改變
              </p>
            </div>
            
            {/* Loading state */}
            {isLoading ? (
              <div className="flex justify-center items-center py-20">
                <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-pink-500"></div>
              </div>
            ) : (
              <div className="max-w-4xl mx-auto">
                <BeforeAfterSlider
                  beforeImage={homepageImages.beforeAfter.before}
                  afterImage={homepageImages.beforeAfter.after}
                />
              </div>
            )}
          </div>
        </section>

        {/* Lash Style Showcase */}
        <section className="min-h-screen flex items-center py-16 sm:py-20 bg-pink-50/50 snap-start snap-always">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 w-full">
            <div className="text-center mb-10 sm:mb-14">
              <h2 className="text-3xl sm:text-4xl font-bold mb-3 sm:mb-4">更多作品展示</h2>
              <div className="w-20 h-1 bg-gradient-to-r from-pink-400 to-purple-500 mx-auto mb-4"></div>
              <p className="text-gray-600 text-sm sm:text-base px-4">
                滑動瀏覽我們的精選作品
              </p>
            </div>
            
            {isLoading ? (
              <div className="flex justify-center items-center py-20">
                <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-pink-500"></div>
              </div>
            ) : homepageImages.lashImages.length > 0 ? (
              <Swiper
                modules={[EffectCoverflow, Pagination, Autoplay]}
                effect={'coverflow'}
                centeredSlides={true}
                slidesPerView={1.2}
                spaceBetween={10}
                coverflowEffect={{
                  rotate: 30,
                  stretch: 0,
                  depth: 100,
                  modifier: 1.5,
                  slideShadows: true,
                }}
                pagination={{ 
                  clickable: true,
                  dynamicBullets: true,
                }}
                autoplay={{
                  delay: 3000,
                  disableOnInteraction: false,
                  pauseOnMouseEnter: true,
                }}
                loop={true}
                className="max-w-6xl mx-auto !pb-12"
                breakpoints={{
                  480: { 
                    slidesPerView: 1.5, 
                    spaceBetween: 15,
                    coverflowEffect: {
                      rotate: 35,
                      depth: 120,
                    }
                  },
                  768: { 
                    slidesPerView: 2.2, 
                    spaceBetween: 20,
                    coverflowEffect: {
                      rotate: 40,
                      depth: 150,
                    }
                  },
                  1024: { 
                    slidesPerView: 3, 
                    spaceBetween: 30,
                    coverflowEffect: {
                      rotate: 50,
                      depth: 180,
                    }
                  },
                }}
              >
                {homepageImages.lashImages.map((src, index) => (
                  <SwiperSlide key={`lash-${index}`}>
                    <div className="relative group overflow-hidden rounded-2xl">
                      <img 
                        src={src} 
                        alt={`作品展示 ${index + 1}`} 
                        className="w-full h-64 sm:h-72 md:h-80 object-cover transition-transform duration-500 group-hover:scale-110" 
                        loading="lazy"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    </div>
                  </SwiperSlide>
                ))}
              </Swiper>
            ) : (
              <div className="text-center py-20 text-gray-500">
                <p>暫無作品展示</p>
              </div>
            )}
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer id="contact" className="bg-gradient-to-b from-gray-900 to-gray-950 text-white snap-start">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 sm:gap-10 text-center md:text-left">
            {/* About */}
            <div className="md:col-span-1">
              <h3 className="text-lg sm:text-xl font-semibold mb-4 text-pink-300">關於我們</h3>
              <p className="text-gray-400 text-sm sm:text-base leading-relaxed">
                我們致力於提供最專業、最細緻的美甲與美睫服務，讓每一位顧客都能帶著滿意的微笑離開。
              </p>
            </div>

            {/* Location */}
            <div className="md:col-span-1">
              <div className="bg-gray-800/50 backdrop-blur-sm p-5 sm:p-6 rounded-2xl border border-gray-700/50 hover:border-pink-500/30 transition-colors">
                <h3 className="text-lg sm:text-xl font-semibold mb-4 text-pink-300">店鋪資訊</h3>
                <div className="space-y-3 text-gray-300 text-sm sm:text-base">
                  <p className="leading-relaxed">
                    <strong className="font-medium text-white block mb-1">📍 地址</strong>
                    新北市蘆洲區民權路68巷16號1樓
                  </p>
                  <p className="leading-relaxed">
                    <strong className="font-medium text-white block mb-1">🚇 交通</strong>
                    三民高中捷運站2號出口 步行5分鐘
                  </p>
                  <p className="leading-relaxed">
                    <strong className="font-medium text-white block mb-1">🕐 營業時間</strong>
                    每日 10:00 - 19:00
                  </p>
                </div>
              </div>
            </div>

            {/* Social */}
            <div className="md:col-span-1 flex flex-col items-center md:items-end">
              <h3 className="text-lg sm:text-xl font-semibold mb-4 text-pink-300">關注我們</h3>
              <div className="flex flex-wrap justify-center md:justify-end gap-3 sm:gap-4">
                {[
                  { name: 'Instagram', url: 'https://www.instagram.com/treering_83/', icon: '📷' },
                  { name: 'Facebook', url: 'https://www.facebook.com/share/19Z1mqXuKG/?mibextid=wwXIfr', icon: '👍' },
                  { name: 'TikTok', url: 'https://www.tiktok.com/@treering_83?is_from_webapp=1&sender_device=pc', icon: '🎵' },
                  { name: 'LINE', url: 'https://page.line.me/985jirte', icon: '💬' },
                ].map((social) => (
                  <a 
                    key={social.name}
                    href={social.url} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-pink-600 rounded-full text-sm transition-all transform hover:scale-105 active:scale-95"
                  >
                    <span>{social.icon}</span>
                    <span className="hidden sm:inline">{social.name}</span>
                  </a>
                ))}
              </div>
            </div>
          </div>
          
          <div className="mt-10 sm:mt-12 pt-8 border-t border-gray-700/50 text-center text-gray-500 text-xs sm:text-sm">
            <p>&copy; {new Date().getFullYear()} TreeRing Studio. All Rights Reserved.</p>
          </div>
        </div>
      </footer>

      {/* Custom Styles */}
      <style>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fade-in {
          animation: fade-in 1s ease-out;
        }
        
        /* Swiper pagination customization */
        .swiper-pagination-bullet {
          background: #E97EB5;
          opacity: 0.5;
        }
        .swiper-pagination-bullet-active {
          opacity: 1;
          background: #E97EB5;
        }
      `}</style>
    </div>
  );
};

export default Home;