import { useState } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Pagination } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/pagination';

import LoyaltyCard from './LoyaltyCard';
import SeasonPassCard from './SeasonPassCard';
import { useAuthStore } from '../../store/authStore';

// Custom styles for swiper dots to match design


const MemberDashboardSlider = () => {
    const { userProfile } = useAuthStore();
    const activePasses = userProfile?.activePasses || [];
    const [isCardReady, setIsCardReady] = useState(false);

    // Loading skeleton
    const LoadingSkeleton = () => (
        <div className="bg-[#9F9586]/50 rounded-2xl min-h-[220px] animate-pulse flex flex-col p-6 sm:p-8">
            <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-full bg-white/20"></div>
                <div className="flex-1 space-y-2">
                    <div className="h-4 bg-white/20 rounded w-24"></div>
                    <div className="h-3 bg-white/20 rounded w-16"></div>
                </div>
            </div>
            <div className="mt-auto flex justify-end items-baseline gap-2">
                <div className="h-12 bg-white/20 rounded w-20"></div>
            </div>
        </div>
    );

    // If no active passes, just show Loyalty Card (no slider needed)
    if (activePasses.length === 0) {
        return (
            <div className="relative">
                {!isCardReady && <LoadingSkeleton />}
                <div className={isCardReady ? '' : 'absolute inset-0 opacity-0 pointer-events-none'}>
                    <LoyaltyCard onReady={() => setIsCardReady(true)} />
                </div>
            </div>
        );
    }

    return (
        <div className="w-full relative">
            {!isCardReady && <LoadingSkeleton />}
            <div className={isCardReady ? '' : 'absolute inset-0 opacity-0 pointer-events-none'}>
                <Swiper
                    modules={[Pagination]}
                    spaceBetween={16}
                    slidesPerView={1}
                    pagination={{ clickable: true }}
                    className="pb-10 member-card-swiper" // Padding bottom for pagination dots
                >
                    {/* Slide 1: Loyalty Card */}
                    <SwiperSlide>
                        <LoyaltyCard onReady={() => setIsCardReady(true)} />
                    </SwiperSlide>

                    {/* Slides 2+: Active Season Passes */}
                    {activePasses.map((pass) => (
                        <SwiperSlide key={pass.passId}>
                            <SeasonPassCard pass={pass} />
                        </SwiperSlide>
                    ))}
                </Swiper>
            </div>

            {/* Inline styles for dots if we don't want a separate css file, 
                but cleaner to inject style tag or use global css. 
                For now, injecting a style tag for the specific customization. */}
            <style>{`
                .member-card-swiper .swiper-pagination-bullet {
                    background: #e5e7ebb2;
                    opacity: 1;
                    width: 8px;
                    height: 8px;
                    transition: all 0.3s;
                }
                .member-card-swiper .swiper-pagination-bullet-active {
                    background: #ffffff;
                    width: 24px;
                    border-radius: 4px;
                }
            `}</style>
        </div>
    );
};

export default MemberDashboardSlider;

