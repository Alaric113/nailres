import type { SeasonPass } from '../../types/seasonPass';

// Swiper imports
import { Swiper, SwiperSlide } from 'swiper/react';
import { EffectCoverflow, Pagination } from 'swiper/modules';

// Swiper styles
import 'swiper/swiper-bundle.css';
// Custom styles for pagination position
const paginationStyles = `
  .swiper-pagination {
    bottom: 20px !important;
  }
  .swiper-pagination-bullet {
    width: 6px;
    height: 6px;
    background: #d1d5db;
    opacity: 1;
    transition: all 0.3s;
  }
  .swiper-pagination-bullet-active {
    width: 24px;
    border-radius: 4px;
    background: #9F9586;
  }
`;

interface MemberPassCarouselProps {
  passes: SeasonPass[];
}

const MemberPassCarousel = ({ passes }: MemberPassCarouselProps) => {
  return (
    <div className="relative w-full h-full flex flex-col items-center pb-8">
      <style>{paginationStyles}</style>
      <Swiper
        modules={[EffectCoverflow, Pagination]}
        effect={'coverflow'}
        grabCursor={true}
        centeredSlides={true}
        slidesPerView={'auto'} // Allows card to determine its own width
        coverflowEffect={{
          rotate: 0,
          stretch: 0,
          depth: 100,
          modifier: 2.5,
          slideShadows: false,
        }}
        pagination={{ clickable: true }}
        className="w-full h-full py-4"
        style={{ paddingBottom: '50px' }} // Space for pagination
      >
        {passes.map((pass) => (
          // SwiperSlide needs specific width constraints to work with slidesPerView='auto'
          <SwiperSlide key={pass.id} className="!w-[85vw] !max-w-md !h-full flex items-center justify-center">
             <CarouselCard pass={pass} />
          </SwiperSlide>
        ))}
      </Swiper>
    </div>
  );
};

const CarouselCard = ({ pass }: { pass: SeasonPass }) => {
    return (
        <div 
            className="relative bg-white rounded-3xl shadow-xl overflow-hidden border border-[#EFECE5] w-full flex flex-col h-[calc(100dvh-180px)] max-h-[650px] transition-all duration-500"
        >
            {/* Full Cover Image Area (16:9) */}
            <div className="relative w-full aspect-video shrink-0 bg-gray-100">
                {pass.imageUrl ? (
                    <>
                        <img src={pass.imageUrl} alt={pass.name} className="absolute inset-0 w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                    </>
                ) : (
                    <div className={`absolute inset-0 bg-gradient-to-br ${pass.color}`}></div>
                )}

                {/* Header Content Overlay */}
                <div className="absolute top-0 left-0 right-0 p-4 flex justify-between items-start z-10">
                    <h3 className="text-2xl font-serif font-bold text-white tracking-wide text-shadow-md">{pass.name}</h3>
                    <p className="text-white/90 shrink-0 text-xs mt-1 font-medium bg-white/20 backdrop-blur-md px-2 py-0.5 rounded-full border border-white/20">
                        效期: {pass.duration}
                    </p>
                </div>
            </div>

            {/* Content Section - Flex 1 to fill remaining height */}
            <div className="flex-1 p-4 bg-white overflow-y-auto hidden-scrollbar flex flex-col">
                {/* Pricing - Always Visible at Top of Content */}
                <div className="mb-2 shrink-0">
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">方案價格</p>
                    <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
                        {pass.variants && pass.variants.length > 0 ? (
                            pass.variants.map((variant, idx) => (
                                <div key={idx} className="flex-1 min-w-[80px] flex flex-col justify-center items-center bg-gray-50 p-3 rounded-xl border border-gray-100 text-center shrink-0">
                                    <span className="font-bold text-gray-800 text-sm mb-1 w-full break-words">{variant.name}</span>
                                    <div className="flex flex-col items-center">
                                        {variant.originalPrice !== undefined && variant.originalPrice > 0 && (
                                            <span className="text-xs text-gray-400 line-through">
                                                ${variant.originalPrice}
                                            </span>
                                        )}
                                        <span className="font-bold text-[#9F9586] text-lg">${variant.price}</span>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="text-sm text-gray-500 py-2 w-full text-center">暫無價格資訊</div>
                        )}
                    </div>
                </div>

                {/* Features List - Scrollable if too long */}
                <div className="space-y-3 flex-1">
                    <div className="pb-2">
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">包含內容</p>
                        <ul className="flex flex-wrap gap-2">
                            {pass.contentItems.map((item, idx) => (
                                <li key={idx} className="inline-flex items-center px-3 py-1.5 rounded-lg bg-gray-50 text-sm text-gray-700 border border-gray-200 shadow-sm">
                                    {item}
                                </li>
                            ))}
                        </ul>
                    </div>
                    
                    {pass.note && (
                        <div className="pt-3 border-t border-gray-100">
                             <span className="font-bold block text-xs text-gray-400 mb-1">備註</span>
                            <p className="text-xs text-gray-500 leading-relaxed">
                                {pass.note}
                            </p>
                        </div>
                    )}
                </div>

                {/* Action Button - Sticky at Bottom of Card Content if needed, but here just static at bottom block */}
                <div className="mt-4 pt-2 shrink-0">
                    <button className="w-full py-3 bg-[#1a1a1a] text-white rounded-xl text-sm font-bold shadow-lg hover:bg-black transition-colors active:scale-[0.98]">
                       立即購買
                    </button>
                </div>
            </div>
        </div>
    );
};

export default MemberPassCarousel;
