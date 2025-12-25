import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Sparkles, Calendar, Image as ImageIcon, ChevronRight } from 'lucide-react';

// Swiper Imports
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, EffectFade } from 'swiper/modules';
import 'swiper/css';
// @ts-ignore
import 'swiper/css/autoplay';
// @ts-ignore
import 'swiper/css/effect-fade';

// New Imports for Feedback
import { collection, query, limit, getDocs } from 'firebase/firestore';

import { UserCircleIcon } from '@heroicons/react/24/solid'; // Use solid for avatar placeholder
import { StarIcon as StarIconSolid } from '@heroicons/react/24/solid';

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
  const [reviews, setReviews] = useState<any[]>([]); // Store filtered feedback bookings
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch Homepage Images
        const imgDocRef = doc(db, 'globals', 'homepageImages');
        const imgDocSnap = await getDoc(imgDocRef);
        if (imgDocSnap.exists()) {
          setHomepageImages(imgDocSnap.data() as any);
        }

        // Fetch Public Reviews (Direct Firestore Query)
        const reviewsRef = collection(db, 'public_reviews');
        const q = query(
            reviewsRef, 
            // orderBy('createdAt', 'desc'), // Comment out to test if Index is the issue
            limit(5)
        );
        
        try {
           console.log("Fetching reviews from public_reviews...");
           const querySnapshot = await getDocs(q);
           console.log(`Fetched ${querySnapshot.size} reviews`);
           
           let fetchedReviews = querySnapshot.docs.map(doc => {
              const data = doc.data();
              console.log("Review data:", data);
              return {
                 id: doc.id,
                 customerFeedback: {
                    rating: data.rating,
                    comment: data.comment
                 },
                 serviceNames: data.serviceNames
              };
           });

           // DEBUG: Inject dummy data if empty to test UI
           if (fetchedReviews.length === 0) {
              console.log("No reviews found, injecting Dummy Data for testing!");
              fetchedReviews = [{
                  id: 'test-1',
                  customerFeedback: { rating: 5, comment: "這是一個測試評論，如果看到這個表示 UI 正常，是資料庫沒抓到資料。" },
                  serviceNames: ['測試服務']
              }];
           }

           setReviews(fetchedReviews);
        } catch (err) {
           console.error("Error fetching public reviews:", err);
        }

      } catch (error) {
        console.error("Error fetching home data:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  // Services Data
// ... (rest of services array)

// ...

        {/* Portfolio Preview */}
        {!isLoading && homepageImages.lashImages.length > 0 && (
          <section>
             {/* ... Swiper Carousel ... */}
             {/* ... (Existing Swiper code) ... */}
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

        {/* Customer Reviews Section */}
        {!isLoading && reviews.length > 0 && (
          <section className="bg-white rounded-2xl p-6 shadow-soft relative overflow-hidden">
             
             {/* Decorative Background Icon */}
             <div className="absolute -right-4 -top-4 text-gray-50 opacity-50 pointer-events-none">
                <Sparkles className="w-32 h-32" />
             </div>

             <div className="flex items-center gap-2 mb-6 relative z-10">
                <Sparkles className="w-5 h-5 text-primary" />
                <h2 className="text-lg font-serif font-bold text-text-main">
                  客戶好評
                </h2>
             </div>

             <Swiper
                modules={[Autoplay, EffectFade]}
                effect={'fade'}
                fadeEffect={{ crossFade: true }}
                spaceBetween={20}
                slidesPerView={1}
                loop={true}
                speed={800}
                autoplay={{
                  delay: 4000,
                  disableOnInteraction: false,
                }}
                className="w-full relative z-10"
             >
                {reviews.map((review, index) => (
                   <SwiperSlide key={index}>
                      <div className="flex flex-col items-center text-center space-y-4 px-4">
                         {/* Stars */}
                         <div className="flex gap-1">
                            {[...Array(review.customerFeedback.rating)].map((_, i) => (
                               <StarIconSolid key={i} className="w-5 h-5 text-yellow-400" />
                            ))}
                         </div>
                         
                         {/* Comment */}
                         <p className="text-text-main font-medium leading-relaxed italic text-lg">
                            "{review.customerFeedback.comment}"
                         </p>

                         {/* User Info Placeholder */}
                         <div className="flex items-center gap-3 mt-2">
                            <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                               <UserCircleIcon className="w-6 h-6 text-gray-400" />
                            </div>
                            <div className="text-left">
                               <p className="text-sm font-bold text-gray-900">貴賓客戶</p>
                               <div className="flex items-center gap-2 text-xs text-gray-400">
                                  <span>{review.serviceNames?.[0] || '美甲服務'}</span>
                               </div>
                            </div>
                         </div>
                      </div>
                   </SwiperSlide>
                ))}
             </Swiper>
          </section>
        )}

  // Services Data
  const services = [
    {
      id: 1,
      title: '日式美睫',
      price: 1000,
      description: 'EYELASH',
      category: '日式美睫',
      image: homepageImages.lashImages[0] || '',
      icon: '👁️',
    },
    {
      id: 2,
      title: '質感美甲',
      price: 1000,
      description: 'NAILS',
      category: '質感美甲',
      image: homepageImages.nailImages[0] || '',
      icon: '💅',
    },
    {
      id: 3,
      title: '韓式霧眉',
      price: 5500,
      description: 'POWDER BROWS',
      category: '韓式霧眉',
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

          <div className="grid grid-cols-3 gap-3">
            {services.map((service) => (
              <Link
                key={service.id}
                to={`/booking?category=${service.category}`}
                className="block group active:scale-95 transition-transform"
              >
                <div className="relative aspect-square rounded-2xl overflow-hidden mb-2 shadow-soft group-hover:shadow-medium transition-all">
                  {service.image ? (
                    <img
                      src={service.image}
                      alt={service.title}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-full h-full bg-secondary-light flex items-center justify-center text-3xl">
                      {service.icon}
                    </div>
                  )}
                </div>
                
                <div className="text-center px-1">
                  <h3 className="font-serif font-bold text-text-main text-sm truncate">
                    {service.title}
                  </h3>
                </div>
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