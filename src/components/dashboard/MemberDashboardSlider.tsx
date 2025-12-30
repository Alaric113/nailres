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

    // If no active passes, just show Loyalty Card (no slider needed)
    if (activePasses.length === 0) {
        return <LoyaltyCard />;
    }

    return (
        <div className="w-full">
            <Swiper
                modules={[Pagination]}
                spaceBetween={16}
                slidesPerView={1}
                pagination={{ clickable: true }}
                className="pb-10 member-card-swiper" // Padding bottom for pagination dots
            >
                {/* Slide 1: Loyalty Card */}
                <SwiperSlide>
                    <LoyaltyCard />
                </SwiperSlide>

                {/* Slides 2+: Active Season Passes */}
                {activePasses.map((pass) => (
                    <SwiperSlide key={pass.passId}>
                         <SeasonPassCard pass={pass} />
                    </SwiperSlide>
                ))}
            </Swiper>
            
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
