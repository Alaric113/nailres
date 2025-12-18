import React from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Pagination, EffectFade, Autoplay, Navigation } from 'swiper/modules';
import { motion } from 'framer-motion';
import BeforeAfterSlider from '../BeforeAfterSlider';

import 'swiper/css';
import 'swiper/css/pagination';
// import 'swiper/css/effect-fade'; // Potentially causing build issues
import 'swiper/css/navigation';

interface PortfolioSectionProps {
  beforeAfter: { before: string; after: string };
  galleryImages: string[]; // Combined lash/brow/nail images or just lashes as per logic
  isLoading: boolean;
}

const PortfolioSection: React.FC<PortfolioSectionProps> = ({ beforeAfter, galleryImages, isLoading }) => {
  return (
    <section id="portfolio" className="min-h-screen py-20 bg-secondary text-text-main snap-start flex flex-col justify-center relative overflow-hidden">
      
      {/* Decorative bg */}
      <div className="absolute top-1/2 left-0 w-full h-1/2 bg-gradient-to-t from-white/40 to-transparent pointer-events-none"></div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Section Header */}
        <motion.div 
           initial={{ opacity: 0, y: 30 }}
           whileInView={{ opacity: 1, y: 0 }}
           transition={{ duration: 0.8 }}
           className="text-center mb-16"
        >
          <h2 className="text-4xl sm:text-5xl font-serif font-medium mb-4 text-text-main">
            Transformation
          </h2>
          <div className="w-16 h-0.5 bg-primary mx-auto opacity-60 mb-6"></div>
          <p className="max-w-2xl mx-auto text-text-light font-light text-sm sm:text-base leading-relaxed">
            見證美麗的蛻變。我們專注於每一個細節，為您打造最自然的精緻感。
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          
          {/* Left Column: Before/After */}
          <motion.div 
             initial={{ opacity: 0, x: -50 }}
             whileInView={{ opacity: 1, x: 0 }}
             transition={{ duration: 0.8 }}
             className="w-full max-w-xl mx-auto lg:max-w-none"
          >
            <div className="relative rounded-2xl overflow-hidden shadow-2xl border-4 border-white">
              {isLoading ? (
                 <div className="h-[400px] bg-secondary-dark/20 animate-pulse flex items-center justify-center">
                   <span className="text-text-light/50">Loading...</span>
                 </div>
              ) : (
                <BeforeAfterSlider
                  beforeImage={beforeAfter.before}
                  afterImage={beforeAfter.after}
                />
              )}
              <div className="absolute bottom-4 left-4 bg-black/60 backdrop-blur-sm text-white px-3 py-1 rounded-full text-xs tracking-wider">
                BEFORE / AFTER
              </div>
            </div>
            <p className="mt-4 text-center text-xs tracking-widest text-text-light/80 uppercase">
              Drag slider to compare
            </p>
          </motion.div>

          {/* Right Column: Gallery Slider */}
          <motion.div 
             initial={{ opacity: 0, x: 50 }}
             whileInView={{ opacity: 1, x: 0 }}
             transition={{ duration: 0.8, delay: 0.2 }}
             className="w-full"
          >
             <div className="mb-8 text-center lg:text-left">
                <h3 className="text-2xl font-serif text-primary-dark mb-2">Curated Works</h3>
                <p className="text-sm text-text-main/70">精選近期作品展示</p>
             </div>

            {isLoading ? (
               <div className="h-80 bg-secondary-dark/20 animate-pulse rounded-xl"></div>
            ) : galleryImages.length > 0 ? (
              <Swiper
                modules={[EffectFade, Pagination, Autoplay, Navigation]}
                effect={'fade'}
                fadeEffect={{ crossFade: true }}
                pagination={{ 
                  clickable: true,
                  bulletActiveClass: 'swiper-pagination-bullet-active !bg-primary',
                }}
                navigation={true}
                autoplay={{
                  delay: 4000,
                  disableOnInteraction: false,
                }}
                loop={true}
                className="w-full rounded-xl shadow-lg aspect-[4/3] lg:aspect-[3/2]"
              >
                {galleryImages.map((src: string, index: number) => (
                  <SwiperSlide key={index}>
                    <div className="w-full h-full relative group">
                      <img 
                        src={src} 
                        alt={`Work ${index}`} 
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-black/10 group-hover:bg-transparent transition-colors duration-500"></div>
                    </div>
                  </SwiperSlide>
                ))}
              </Swiper>
            ) : (
              <div className="h-80 flex items-center justify-center bg-white/50 rounded-xl border border-dashed border-secondary-dark">
                <p className="text-text-light">暫無作品展示</p>
              </div>
            )}
          </motion.div>

        </div>
      </div>
    </section>
  );
};

export default PortfolioSection;