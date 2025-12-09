// A simple CSS/Scroll based slider for now. 
// Can upgrade to Swiper later if needed, but keeping it lightweight.
import { useRef } from 'react';

const PromoSlider = () => {
  const scrollRef = useRef<HTMLDivElement>(null);

  const promos = [
    { id: 1, title: 'Summer Sale', color: 'bg-orange-100', text: '夏日美甲季 85折' },
    { id: 2, title: 'New Arrival', color: 'bg-blue-100', text: '新款凝膠上市' },
    { id: 3, title: 'Member Day', color: 'bg-pink-100', text: '會員日點數雙倍' },
  ];

  return (
    <div className="mb-6">
      <div className="flex gap-4 overflow-x-auto custom-scrollbar pb-2 snap-x snap-mandatory" ref={scrollRef}>
        {promos.map(promo => (
          <div 
            key={promo.id} 
            className={`flex-shrink-0 w-[85%] sm:w-[60%] h-40 rounded-2xl ${promo.color} snap-center flex items-center justify-center relative overflow-hidden`}
          >
            {/* Placeholder Visuals */}
            <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-white/20 rounded-full blur-xl"></div>
            <h3 className="text-2xl font-serif font-bold text-gray-800 opacity-60 z-10">
              {promo.text}
            </h3>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PromoSlider;
