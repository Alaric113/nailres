import { useState } from 'react';
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
    const [selectedVariantIndex, setSelectedVariantIndex] = useState(0);

    const handleBuy = () => {
        if (!pass.variants || pass.variants.length === 0) return;
        
        const variant = pass.variants[selectedVariantIndex];
        const text = `你好，我想購買會員方案：${pass.name} ${variant ? `- ${variant.name} ($${variant.price})` : ''}`;
        // Using the LINE ID found in StoreInfoPage: @985jirte
        // https://line.me/R/oaMessage/{LINE_ID}/?text={message}
        const url = `https://line.me/R/oaMessage/@985jirte/?text=${encodeURIComponent(text)}`;
        window.open(url, '_blank');
    };

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
                                <button
                                    key={idx}
                                    onClick={() => setSelectedVariantIndex(idx)}
                                    className={`flex-1 min-w-[100px] flex flex-col justify-center items-center p-3 rounded-xl border text-center shrink-0 transition-all duration-200 ${
                                        selectedVariantIndex === idx 
                                        ? 'bg-[#9F9586] border-[#9F9586] text-white shadow-md ring-2 ring-[#9F9586]/20' 
                                        : 'bg-gray-50 border-gray-100 text-gray-600 hover:bg-gray-100'
                                    }`}
                                >
                                    <span className={`font-bold text-sm mb-1 w-full break-words ${selectedVariantIndex === idx ? 'text-white' : 'text-gray-800'}`}>
                                        {variant.name}
                                    </span>
                                    <div className="flex flex-col items-center">
                                        {variant.originalPrice !== undefined && variant.originalPrice > 0 && (
                                            <span className={`text-xs line-through mb-0.5 ${selectedVariantIndex === idx ? 'text-white/70' : 'text-gray-400'}`}>
                                                ${variant.originalPrice}
                                            </span>
                                        )}
                                        <span className={`font-bold text-lg ${selectedVariantIndex === idx ? 'text-white' : 'text-[#9F9586]'}`}>
                                            ${variant.price}
                                        </span>
                                    </div>
                                </button>
                            ))
                        ) : (
                            <div className="text-sm text-gray-500 py-2 w-full text-center">暫無價格資訊</div>
                        )}
                    </div>
                </div>

                {/* Features List Grouped */}
                <div className="space-y-4 flex-1">
                    {/* Services Group */}
                    {pass.contentItems.some(i => i.category === '服務') && (
                        <div>
                             <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">服務項目</p>
                             <ul className="flex flex-col gap-2">
                                {pass.contentItems.filter(i => i.category === '服務').map((item, idx) => (
                                    <li key={idx} className="flex justify-between items-center px-3 py-2 rounded-lg bg-gray-50 border border-gray-200 shadow-sm text-sm text-gray-700">
                                         <span className="font-medium">{item.name}</span>
                                         {item.quantity && item.quantity > 0 && (
                                             <span className="text-[#9F9586] font-bold bg-white px-2 py-0.5 rounded border border-gray-100 shadow-sm text-xs">x{item.quantity}</span>
                                         )}
                                    </li>
                                ))}
                             </ul>
                        </div>
                    )}

                    {/* Benefits Group */}
                    {pass.contentItems.some(i => i.category === '權益') && (
                        <div>
                             <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">專屬權益</p>
                             <ul className="grid grid-cols-2 gap-2">
                                {pass.contentItems.filter(i => i.category === '權益').map((item, idx) => (
                                    <li key={idx} className="flex items-center gap-2 px-2 py-1.5 rounded-lg bg-indigo-50/50 border border-indigo-100 text-xs text-indigo-900">
                                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 text-indigo-400 flex-shrink-0">
                                          <path fillRule="evenodd" d="M16.403 12.652a3 3 0 000-5.304 3 3 0 00-3.75-3.751 3 3 0 00-5.305 0 3 3 0 00-3.751 3.75 3 3 0 000 5.305 3 3 0 003.75 3.751 3 3 0 005.305 0 3 3 0 003.751-3.751zM11 10a1 1 0 11-2 0 1 1 0 012 0z" clipRule="evenodd" />
                                        </svg>
                                        <span className="font-medium truncate">{item.name}</span>
                                    </li>
                                ))}
                             </ul>
                        </div>
                    )}
                </div>

                {pass.note && (
                    <div className="pt-3 border-t border-gray-100">
                         <span className="font-bold block text-xs text-gray-400 mb-1">備註</span>
                        <p className="text-xs text-gray-500 leading-relaxed whitespace-pre-line">
                            {pass.note}
                        </p>
                    </div>
                )}
            </div>

            {/* Action Button - Sticky at Bottom of Card Content */}
            <div className="mt-4 pt-2 shrink-0">
                <button 
                    onClick={handleBuy}
                    disabled={!pass.variants || pass.variants.length === 0}
                    className="w-full py-3 bg-[#1a1a1a] text-white rounded-xl text-sm font-bold shadow-lg hover:bg-black transition-colors active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2"
                >
                   <span>購買此方案</span>
                   {pass.variants && pass.variants[selectedVariantIndex] && (
                       <span className="bg-white/20 px-2 py-0.5 rounded text-xs">
                           ${pass.variants[selectedVariantIndex].price}
                       </span>
                   )}
                </button>
                <p className="text-[10px] text-gray-400 text-center mt-2">
                    點擊後將開啟 LINE 由專人為您服務
                </p>
            </div>
        </div>
    );
};

export default MemberPassCarousel;
