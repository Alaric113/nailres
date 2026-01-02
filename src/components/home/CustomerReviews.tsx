import { useState, useEffect } from 'react';
import { collection, query, limit, getDocs } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useGlobalSettings } from '../../hooks/useGlobalSettings';
import { StarIcon as StarIconSolid } from '@heroicons/react/24/solid';
import { UserCircleIcon } from '@heroicons/react/24/outline';


// Swiper Imports
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, EffectFade } from 'swiper/modules';
import 'swiper/css';
// @ts-ignore
import 'swiper/css/autoplay';
// @ts-ignore
import 'swiper/css/effect-fade';

const CustomerReviews = () => {
  const { settings, isLoading: settingsLoading } = useGlobalSettings();
  const [reviews, setReviews] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchReviews = async () => {
      try {
        const reviewsRef = collection(db, 'public_reviews');
        // Note: orderBy('createdAt', 'desc') might require an index. 
        // We limit to 20 to allow for client-side filtering (e.g. if some are hidden)
        const q = query(reviewsRef, limit(20));
        
        try {
           const querySnapshot = await getDocs(q);
           let fetchedReviews = querySnapshot.docs.map(doc => {
              const data = doc.data();
              return {
                 id: doc.id,
                 ...data, // Spread original data to get userName, userAvatarUrl, isAnonymous
                 customerFeedback: {
                    rating: data.rating,
                    comment: data.comment
                 },
                 serviceNames: data.serviceNames,
                 isReviewHidden: data.isReviewHidden // Explicitly get hidden status
              };
           });

           setReviews(fetchedReviews);
        } catch (err) {
           console.error("Error fetching public reviews:", err);
        }

      } catch (error) {
        console.error("Error in reviews setup:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchReviews();
  }, []);

  if (settingsLoading || isLoading) return null;

  const reviewSettings = settings.reviewSettings || { showReviews: true, minRating: 4 };

  if (!reviewSettings.showReviews) return null;

  const filteredReviews = reviews.filter(r => 
      !r.isReviewHidden && 
      (r.customerFeedback.rating || 0) >= reviewSettings.minRating
  );

  if (filteredReviews.length === 0) return null; // Or return dummy if no real reviews? 
  // Let's use filteredReviews for display instead of reviews.

  return (
    <section className="bg-[#9F9586] rounded-2xl p-6 shadow-soft relative overflow-hidden my-8 mx-4 md:mx-auto max-w-4xl">
       

       <Swiper
          modules={[Autoplay, EffectFade]}
          effect={'fade'}
          fadeEffect={{
            crossFade: true,
          }}
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
          {filteredReviews.map((review, index) => (
             <SwiperSlide key={index}>
                <div className="flex flex-col items-start text-center space-y-4 px-2">
                   {/* Stars */}
                   {/* User Info Placeholder */}
                   <div className="flex items-center  gap-3 mt-2">
                       <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden">
                          {(!review.isAnonymous && review.userAvatarUrl) ? (
                              <img src={review.userAvatarUrl} alt={review.userName} className="w-full h-full object-cover" loading="lazy" />
                          ) : (
                              <UserCircleIcon className="w-6 h-6 text-gray-400" />
                          )}
                       </div>
                       <div className="text-left">
                          <p className="text-sm font-bold text-white">
                              {review.isAnonymous ? '匿名客戶' : (review.userName || '貴賓客戶')}
                          </p>
                          <div className="flex items-center gap-2 text-xs text-white">
                             <span>{review.serviceNames?.[0] || '美甲服務'}</span>
                          </div>
                          {review.designerName && (
                              <p className="text-[10px] text-white">by {review.designerName}</p>
                          )}
                       </div>
                   </div>
                   <div className="flex gap-1">
                      {[...Array(review.customerFeedback.rating || 5)].map((_, i) => (
                         <StarIconSolid key={i} className="w-5 h-5 text-yellow-400" />
                      ))}
                   </div>
                   
                   {/* Comment */}
                   <p className="text-white font-medium leading-relaxed italic text-lg">
                      {review.customerFeedback.comment}
                   </p>

                   
                </div>
             </SwiperSlide>
          ))}
       </Swiper>
    </section>
  );
};

export default CustomerReviews;
