import { useState, useEffect } from 'react';
import { collection, query, limit, getDocs } from 'firebase/firestore';
import { db } from '../../lib/firebase';
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
  const [reviews, setReviews] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchReviews = async () => {
      try {
        const reviewsRef = collection(db, 'public_reviews');
        // Note: orderBy('createdAt', 'desc') might require an index. 
        // If it fails, rely on default order or create index.
        const q = query(reviewsRef, limit(5));
        
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
                 serviceNames: data.serviceNames
              };
           });

           // Fallback Dummy Data if empty (for demo purposes)
           if (fetchedReviews.length === 0) {
              fetchedReviews = [{
                  id: 'test-1',
                  customerFeedback: { rating: 5, comment: "這裡目前的氣氛非常放鬆，設計師非常專業！" },
                  serviceNames: ['測試服務']
              }];
           }

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

  if (isLoading || reviews.length === 0) return null;

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
          {reviews.map((review, index) => (
             <SwiperSlide key={index}>
                <div className="flex flex-col items-start text-center space-y-4 px-2">
                   {/* Stars */}
                   {/* User Info Placeholder */}
                   <div className="flex items-center  gap-3 mt-2">
                       <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden">
                          {(!review.isAnonymous && review.userAvatarUrl) ? (
                              <img src={review.userAvatarUrl} alt={review.userName} className="w-full h-full object-cover" />
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
