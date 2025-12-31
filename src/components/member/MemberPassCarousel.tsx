import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { SeasonPass } from '../../types/seasonPass';
import { SparklesIcon, TicketIcon, CheckCircleIcon } from '@heroicons/react/24/outline';

// Swiper imports
import { Swiper, SwiperSlide } from 'swiper/react';
import { Pagination, EffectCoverflow } from 'swiper/modules';
import 'swiper/swiper-bundle.css';

// Custom styles for pagination
const paginationStyles = `
  .swiper-pagination {
    bottom: 16px !important;
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
  if (passes.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-400">
        目前沒有可用的方案
      </div>
    );
  }

  return (
    <div className="relative w-full h-full flex flex-col overflow-hidden">
      <style>{paginationStyles}</style>
      <Swiper
        modules={[Pagination, EffectCoverflow]}
        effect={'coverflow'}
        coverflowEffect={{
          rotate: 0,
          stretch: 0,
          depth: 100,
          modifier: 2.5,
          slideShadows: false,
        }}
        pagination={{ clickable: true }}
        spaceBetween={0}
        slidesPerView={'auto'}
        centeredSlides={true}
        grabCursor={true}
        className="w-full h-full py-4"
        style={{ paddingBottom: '50px' }}
      >
        {passes.map((pass) => (
          <SwiperSlide key={pass.id} className="!w-[85vw] !max-w-md !h-auto flex items-center justify-center">
            <PassCard pass={pass} />
          </SwiperSlide>
        ))}
      </Swiper>
    </div>
  );
};

// ============ Pass Card Component ============
interface PassCardProps {
  pass: SeasonPass;
}

const PassCard = ({ pass }: PassCardProps) => {
  const [selectedVariantIndex, setSelectedVariantIndex] = useState(0);
  const navigate = useNavigate();

  const handleBuy = () => {
    if (!pass.variants || pass.variants.length === 0) return;
    navigate(`/member/purchase/${pass.id}?variant=${selectedVariantIndex}`);
  };
  

  const selectedVariant = pass.variants?.[selectedVariantIndex];
  const services = pass.contentItems?.filter(i => i.category === '服務') || [];
  const benefits = pass.contentItems?.filter(i => i.category === '權益') || [];

  console.log(selectedVariant)
  return (
    <div className="bg-white rounded-3xl overflow-hidden border border-gray-100 w-full flex flex-col h-[calc(100dvh-200px)] max-h-[600px] min-h-[480px]">
      {/* Hero Section with Gradient */}
      <div className="relative shrink-0">
        {/* Background Image or Gradient */}
        <div className="h-32 sm:h-40 relative overflow-hidden">
          {pass.imageUrl ? (
            <>
              <img 
                src={pass.imageUrl} 
                alt={pass.name} 
                className="absolute inset-0 w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black/60" />
            </>
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary-dark to-gray-800" />
          )}
          
          {/* Pass Name & Duration Badge */}
          <div className="absolute inset-0 p-4 flex flex-col justify-between">
            <div className="flex justify-between items-start">
              <div>
                <h2 className="text-2xl sm:text-3xl font-serif font-bold text-white drop-shadow-lg">
                  {pass.name}
                </h2>
              </div>
              <span className="bg-white/20 backdrop-blur-md text-white text-xs font-medium px-3 py-1 rounded-full border border-white/30">
                {pass.duration} 個月
              </span>
            </div>
          </div>
        </div>

        {/* Price Section - Overlapping */}
        <div className="relative -mt-6 mx-4 z-10">
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-4">
            {/* Variant Selector */}
            {pass.variants && pass.variants.length > 0 ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">選擇方案</span>
                  {selectedVariant && (
                    <div className="flex items-baseline gap-1">
                      {selectedVariant.originalPrice !== undefined && selectedVariant.originalPrice > 0 && selectedVariant.originalPrice > selectedVariant.price && (
                        <span className="text-sm text-gray-400 line-through">${selectedVariant.originalPrice}</span>
                      )}
                      <span className="text-2xl font-bold text-primary">${selectedVariant.price}</span>
                    </div>
                  )}
                </div>
                <div className="flex gap-2">
                  {pass.variants.map((variant, idx) => (
                    <button
                      key={idx}
                      onClick={() => setSelectedVariantIndex(idx)}
                      className={`flex-1 py-2.5 px-3 rounded-xl text-sm font-semibold transition-all duration-200 ${
                        selectedVariantIndex === idx
                          ? 'bg-primary text-white shadow-md'
                          : 'bg-gray-50 text-gray-600 hover:bg-gray-100 border border-gray-200'
                      }`}
                    >
                      {variant.name}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <p className="text-center text-gray-400 text-sm py-2">暫無價格資訊</p>
            )}
          </div>
        </div>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {/* Services */}
        {services.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <TicketIcon className="w-4 h-4 text-rose-500" />
              <span className="text-xs font-bold text-gray-500 uppercase tracking-wide">包含服務</span>
            </div>
            <div className="space-y-2">
              {services.map((item, idx) => (
                <div 
                  key={idx} 
                  className="flex items-center justify-between bg-gradient-to-r from-rose-50 to-orange-50 rounded-xl px-4 py-2 border border-rose-100/50"
                >
                  <span className="text-sm font-medium text-gray-800">{item.name}</span>
                  {item.quantity && item.quantity > 0 && (
                    <span className="bg-white text-rose-600 font-bold text-xs px-2.5 py-1 rounded-full shadow-sm border border-rose-200">
                      {item.quantity === -1 ? '無限' : `${item.quantity}次`}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Benefits */}
        {benefits.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <SparklesIcon className="w-4 h-4 text-purple-500" />
              <span className="text-xs font-bold text-gray-500 uppercase tracking-wide">專屬權益</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {benefits.map((item, idx) => (
                <div 
                  key={idx} 
                  className="flex items-center gap-2 bg-purple-50 rounded-xl px-3 py-2.5 border border-purple-100/50"
                >
                  <CheckCircleIcon className="w-4 h-4 text-purple-500 shrink-0" />
                  <span className="text-xs font-medium text-purple-900 truncate">{item.name}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Note */}
        {pass.note && (
          <div className="bg-gray-50 rounded-xl p-3 border border-gray-100">
            <p className="text-xs text-gray-500 leading-relaxed whitespace-pre-line">
              {pass.note}
            </p>
          </div>
        )}
      </div>

      {/* Fixed CTA Button */}
      <div className="shrink-0 p-4 bg-white border-t border-gray-100">
        <button
          onClick={handleBuy}
          disabled={!pass.variants || pass.variants.length === 0}
          className="w-full py-3.5 bg-gradient-to-r from-gray-900 to-gray-800 text-white rounded-2xl font-bold text-sm shadow-lg hover:from-black hover:to-gray-900 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          <span>立即購買</span>
          {selectedVariant && (
            <span className="bg-white/15 px-2.5 py-0.5 rounded-lg text-xs">
              ${selectedVariant.price}
            </span>
          )}
        </button>
      </div>
    </div>
  );
};

export default MemberPassCarousel;
