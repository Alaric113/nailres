import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Sparkles, Calendar, Image as ImageIcon, ChevronRight } from 'lucide-react';
import Card from '../components/common/Card';

// Swiper Imports
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay } from 'swiper/modules';
import 'swiper/css';
// @ts-ignore
import 'swiper/css/autoplay';

const Home = () => {
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
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchImages = async () => {
      try {
        const docRef = doc(db, 'globals', 'homepageImages');
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data() as any;
          setHomepageImages(data);
        }
      } catch (error) {
        console.error("Error fetching homepage images:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchImages();
  }, []);

  // Services Data
  const services = [
    {
      id: 1,
      title: '日式美睫',
      price: 1000,
      description: 'EYELASH',
      category: '美睫',
      image: homepageImages.lashImages[0] || '',
      icon: '👁️',
    },
    {
      id: 2,
      title: '質感美甲',
      price: 1000,
      description: 'NAILS',
      category: '美甲',
      image: homepageImages.nailImages[0] || '',
      icon: '💅',
    },
    {
      id: 3,
      title: '韓式霧眉',
      price: 5500,
      description: 'POWDER BROWS',
      category: '霧眉',
      image: homepageImages.browImages[0] || '',
      icon: '💅',
    },
  ];

  return (
    <div className="min-h-screen bg-secondary-light pb-24">
      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        
        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-3">
          <Link
            to="/booking"
            className="bg-white rounded-2xl p-4 shadow-soft hover:shadow-medium transition-all active:scale-95 tap-highlight-none"
          >
            <div className="flex items-center justify-between">
              <div>
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center mb-2">
                  <Calendar className="w-5 h-5 text-primary" />
                </div>
                <h3 className="font-medium text-text-main">立即預約</h3>
                <p className="text-xs text-text-light mt-0.5">Book Now</p>
              </div>
              <ChevronRight className="w-5 h-5 text-text-light" />
            </div>
          </Link>

          <Link
            to="/portfolio"
            className="bg-white rounded-2xl p-4 shadow-soft hover:shadow-medium transition-all active:scale-95 tap-highlight-none"
          >
            <div className="flex items-center justify-between">
              <div>
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center mb-2">
                  <ImageIcon className="w-5 h-5 text-primary" />
                </div>
                <h3 className="font-medium text-text-main">作品集</h3>
                <p className="text-xs text-text-light mt-0.5">Portfolio</p>
              </div>
              <ChevronRight className="w-5 h-5 text-text-light" />
            </div>
          </Link>
        </div>

        {/* Featured Services */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-serif font-bold text-text-main flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary" />
              熱門服務
            </h2>
            <Link to="/booking" className="text-sm text-primary hover:text-primary-dark transition-colors">
              查看全部
            </Link>
          </div>

          <div className="space-y-3">
            {services.map((service) => (
              <Link
                key={service.id}
                to={`/booking?category=${service.category}`}
                className="block"
              >
                <Card hoverable className="overflow-hidden">
                  <div className="flex items-center gap-4 p-0">
                    {/* Service Image */}
                    <div className="w-24 h-24 flex-shrink-0 bg-secondary-dark overflow-hidden">
                      {service.image ? (
                        <img
                          src={service.image}
                          alt={service.title}
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-3xl">
                          {service.icon}
                        </div>
                      )}
                    </div>

                    {/* Service Info */}
                    <div className="flex-1 py-3 pr-4">
                      <h3 className="font-serif font-bold text-text-main mb-1">
                        {service.title}
                      </h3>
                      <p className="text-xs text-text-light mb-2">{service.description}</p>
                      <div className="flex items-center justify-between">
                        <span className="text-primary font-bold">NT$ {service.price.toLocaleString()}</span>
                        <ChevronRight className="w-4 h-4 text-text-light" />
                      </div>
                    </div>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        </section>

        {/* Portfolio Preview */}
        {!isLoading && homepageImages.lashImages.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-serif font-bold text-text-main">
                精選作品
              </h2>
              <Link to="/portfolio" className="text-sm text-primary hover:text-primary-dark transition-colors">
                查看更多
              </Link>
            </div>

            <Swiper
              modules={[Autoplay]}
              spaceBetween={12}
              slidesPerView={2.2}
              loop={true}
              speed={1000}
              autoplay={{
                delay: 2000,
                disableOnInteraction: false,
                pauseOnMouseEnter: true
              }}
              breakpoints={{
                640: {
                  slidesPerView: 3.2,
                  spaceBetween: 16,
                },
                768: {
                  slidesPerView: 4.2,
                  spaceBetween: 16,
                },
              }}
              className="w-full py-2" // Added py-2 for potential shadow clipping
            >
              {[...homepageImages.lashImages, ...homepageImages.nailImages, ...homepageImages.browImages]
                .slice(0, 8) 
                .map((image, index) => (
                  <SwiperSlide key={index}>
                    <Link
                      to="/portfolio"
                      className="block aspect-square rounded-xl overflow-hidden shadow-soft hover:shadow-medium transition-all active:scale-95 relative group"
                    >
                       <img
                        src={image}
                        alt={`作品 ${index + 1}`}
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                        loading="lazy"
                      />
                       {/* Subtle Overlay */}
                       <div className="absolute inset-0 bg-black/5 group-hover:bg-black/0 transition-colors pointer-events-none" />
                    </Link>
                  </SwiperSlide>
                ))}
            </Swiper>
          </section>
        )}

        {/* Loading State */}
        {isLoading && (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div
                key={i}
                className="aspect-square rounded-xl bg-secondary-dark animate-pulse"
              ></div>
            ))}
          </div>
        )}

        {/* About Section */}
        <section className="bg-white rounded-2xl p-6 shadow-soft">
          <h2 className="text-lg font-serif font-bold text-text-main mb-3">
            關於 TREERING
          </h2>
          <p className="text-sm text-text-light leading-relaxed mb-4">
            我們致力於提供最專業的美甲、美睫與霧眉服務，
            以自然、精緻的手法，為每位客人打造獨特的美麗風格。
          </p>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-primary mb-1">5+</div>
              <div className="text-xs text-text-light">年經驗</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-primary mb-1">1000+</div>
              <div className="text-xs text-text-light">滿意客戶</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-primary mb-1">100%</div>
              <div className="text-xs text-text-light">專業認證</div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default Home;