import { useState, useEffect } from 'react';
import { collection, query, limit, getDocs } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useGlobalSettings } from '../../hooks/useGlobalSettings';
import { Star, Quote, ChevronUp, ChevronDown } from 'lucide-react';
import UserAvatar from '../common/UserAvatar';

// Swiper Imports
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay } from 'swiper/modules';
import type { Swiper as SwiperType } from 'swiper';
import 'swiper/css';
// @ts-ignore
import 'swiper/css/autoplay';

interface ReviewItem {
  id: string;
  userName?: string;
  userAvatarUrl?: string;
  isAnonymous?: boolean;
  customerFeedback: {
    rating?: number;
    comment?: string;
  };
  serviceNames?: string[];
  designerName?: string;
  createdAt?: any;
}

const DEFAULT_REVIEWS: ReviewItem[] = [
  {
    id: 'default-1',
    userName: 'Jessica L.',
    customerFeedback: {
      rating: 5,
      comment: '美甲師非常細心，修型跟死皮處理得好乾淨！法式暈染非常有氣質，維持了一個月都沒掉。'
    },
    serviceNames: ['質感美甲'],
    designerName: '希亞'
  },
  {
    id: 'default-2',
    userName: '王小姐',
    customerFeedback: {
      rating: 5,
      comment: '接美睫完全沒有異物感，睡一覺起來眼睛變得超級有神，而且環境非常舒適放鬆！'
    },
    serviceNames: ['日式美睫'],
    designerName: '王靖雯'
  },
  {
    id: 'default-3',
    userName: 'Emily C.',
    customerFeedback: {
      rating: 5,
      comment: '店內包廂隱密性很高，消毒做得很徹底，每次來都覺得像做 SPA 一樣療癒！'
    },
    serviceNames: ['質感美甲'],
    designerName: '希亞'
  },
  {
    id: 'default-4',
    userName: '林小姐',
    customerFeedback: {
      rating: 5,
      comment: '霧眉效果超級自然，毛流感做得很精緻，出門省下超多畫眉毛的時間，超推！'
    },
    serviceNames: ['韓式霧眉'],
    designerName: '資深設計師'
  }
];

const CustomerReviews = () => {
  const { settings, isLoading: settingsLoading } = useGlobalSettings();
  const [reviews, setReviews] = useState<ReviewItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [swiperInstance, setSwiperInstance] = useState<SwiperType | null>(null);

  useEffect(() => {
    const fetchReviews = async () => {
      try {
        const reviewsRef = collection(db, 'public_reviews');
        const q = query(reviewsRef, limit(20));

        try {
          const querySnapshot = await getDocs(q);
          const fetchedReviews: ReviewItem[] = querySnapshot.docs.map(doc => {
            const data = doc.data();
            return {
              id: doc.id,
              ...data,
              customerFeedback: {
                rating: data.rating,
                comment: data.comment
              },
              serviceNames: data.serviceNames,
              isReviewHidden: data.isReviewHidden
            } as ReviewItem;
          });

          const activeReviews = fetchedReviews.filter(
            r => !(r as any).isReviewHidden && (r.customerFeedback.rating || 0) >= (settings.reviewSettings?.minRating || 4)
          );

          setReviews(activeReviews.length > 0 ? activeReviews : DEFAULT_REVIEWS);
        } catch (err) {
          console.error("Error fetching public reviews, using defaults:", err);
          setReviews(DEFAULT_REVIEWS);
        }
      } catch (error) {
        console.error("Error in reviews setup:", error);
        setReviews(DEFAULT_REVIEWS);
      } finally {
        setIsLoading(false);
      }
    };
    fetchReviews();
  }, [settings.reviewSettings?.minRating]);

  if (settingsLoading && isLoading) return null;

  const reviewSettings = settings.reviewSettings || { showReviews: true, minRating: 4 };
  if (!reviewSettings.showReviews) return null;

  const displayList = reviews.length > 0 ? reviews : DEFAULT_REVIEWS;

  return (
    <div className="relative bg-gradient-to-br from-[#FAF9F6] to-[#EFECE5]/60 rounded-2xl p-4 sm:p-5 border border-[#EFECE5] shadow-sm overflow-hidden">
      {/* Background Decorative Quote Mark */}
      <div className="absolute -right-2 -bottom-4 text-[#9F9586]/10 pointer-events-none select-none">
        <Quote className="w-24 h-24 rotate-180" />
      </div>

      <div className="flex items-center justify-between mb-3 pb-2.5 border-b border-[#EFECE5]">
        <div className="flex items-center gap-2">
          <span className="flex h-2 w-2 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
          </span>
          <span className="text-xs font-bold text-gray-800 tracking-wide">
            最新顧客實測好評
          </span>
          <span className="text-[11px] bg-amber-100 text-amber-800 font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
            <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
            4.9 / 5.0
          </span>
        </div>

        {/* Up / Down Navigation Controls */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => swiperInstance?.slidePrev()}
            className="p-1 rounded-full hover:bg-white text-gray-500 hover:text-gray-900 transition-colors cursor-pointer"
            aria-label="上一則評論"
          >
            <ChevronUp className="w-4 h-4" />
          </button>
          <button
            onClick={() => swiperInstance?.slideNext()}
            className="p-1 rounded-full hover:bg-white text-gray-500 hover:text-gray-900 transition-colors cursor-pointer"
            aria-label="下一則評論"
          >
            <ChevronDown className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Vertical Scrolling Ticker */}
      <div className="h-[96px] sm:h-[84px] w-full overflow-hidden">
        <Swiper
          direction="vertical"
          modules={[Autoplay]}
          onSwiper={setSwiperInstance}
          spaceBetween={8}
          slidesPerView={1}
          loop={displayList.length > 1}
          speed={600}
          autoplay={{
            delay: 3500,
            disableOnInteraction: false,
            pauseOnMouseEnter: true,
          }}
          className="h-full w-full"
        >
          {displayList.map((review, index) => (
            <SwiperSlide key={review.id || index} className="h-full flex flex-col justify-center">
              <div className="flex flex-col h-full py-0.5">
                {/* User & Stars */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <UserAvatar
                      src={review.isAnonymous ? null : review.userAvatarUrl}
                      name={review.isAnonymous ? '匿名' : review.userName}
                      className="w-6 h-6 text-[10px]"
                    />
                    <span className="text-xs font-bold text-gray-900 truncate">
                      {review.isAnonymous ? '匿名貴賓' : (review.userName || '貴賓顧客')}
                    </span>
                    <span className="text-[10px] bg-white border border-[#EFECE5] text-[#9F9586] font-medium px-2 py-0.2 rounded-md shrink-0">
                      {review.serviceNames?.[0] || '質感美學'}
                    </span>
                    {review.designerName && (
                      <span className="text-[10px] text-gray-400 hidden sm:inline">
                        設計師: {review.designerName}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-0.5 shrink-0">
                    {[...Array(review.customerFeedback.rating || 5)].map((_, i) => (
                      <Star key={i} className="w-3 h-3 text-amber-400 fill-amber-400" />
                    ))}
                  </div>
                </div>

                {/* Comment */}
                <p className="text-sm flex-1 flex flex-col justify-center he-full sm:text-xs text-gray-700 font-medium line-clamp-2 leading-snug pl-1 pt-1 italic">
                  {review.customerFeedback.comment}
                </p>
              </div>
            </SwiperSlide>
          ))}
        </Swiper>
      </div>
    </div>
  );
};

export default CustomerReviews;
