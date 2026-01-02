import React from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Pagination, EffectFade, Autoplay, Navigation } from 'swiper/modules';
import { motion } from 'framer-motion';
import BeforeAfterSlider from '../BeforeAfterSlider';

import 'swiper/css';
import 'swiper/css/pagination';
import 'swiper/css/navigation';

interface PortfolioSectionProps {
  beforeAfter: { before: string; after: string };
  galleryImages: string[];
  isLoading: boolean;
}

const PortfolioSection: React.FC<PortfolioSectionProps> = ({ beforeAfter, galleryImages, isLoading }) => {
  return (
    <>
      {/* --- SECTION 1: RECENT WORKS (GALLERY) --- */}
      <section id="recent-works" className="min-h-screen py-20 bg-[#FAF9F6] text-[#2C2825] snap-start flex flex-col justify-center relative overflow-hidden">

        <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10 flex flex-col h-full justify-center">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-10"
          >
            <span className="text-xs font-bold tracking-[0.2em] text-[#8A8175] uppercase mb-2 block">Our Gallery</span>
            <h2 className="text-4xl sm:text-5xl font-serif font-medium text-[#2C2825]">
              Curated Works
            </h2>
            <p className="mt-4 text-[#8A8175] font-light">精選近期作品展示</p>
          </motion.div>

          {/* Gallery Swiper */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="w-full max-w-5xl mx-auto"
          >
            {isLoading ? (
              <div className="h-[50vh] bg-stone-200 animate-pulse rounded-xl"></div>
            ) : galleryImages.length > 0 ? (
              <Swiper
                modules={[EffectFade, Pagination, Autoplay, Navigation]}
                effect={'fade'}
                fadeEffect={{ crossFade: true }}
                pagination={{
                  clickable: true,
                  bulletActiveClass: 'swiper-pagination-bullet-active !bg-[#2C2825]',
                }}
                navigation={true}
                autoplay={{
                  delay: 4000,
                  disableOnInteraction: false,
                }}
                loop={true}
                className="w-full rounded-xl shadow-2xl aspect-[4/5] md:aspect-[3/2] max-h-[60vh]"
              >
                {galleryImages.map((src: string, index: number) => (
                  <SwiperSlide key={index}>
                    <div className="w-full h-full relative group">
                      <img
                        src={src}
                        alt={`Work ${index}`}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                      <div className="absolute inset-0 bg-black/10 group-hover:bg-transparent transition-colors duration-500"></div>
                    </div>
                  </SwiperSlide>
                ))}
              </Swiper>
            ) : (
              <div className="h-[50vh] flex items-center justify-center bg-white/50 rounded-xl border border-dashed border-[#8A8175]">
                <p className="text-[#8A8175]">暫無作品展示</p>
              </div>
            )}
          </motion.div>
        </div>
      </section>

      {/* --- SECTION 2: TRANSFORMATION (BEFORE/AFTER) --- */}
      <section id="transformation" className="min-h-screen py-20 bg-[#2C2825] text-[#FAF9F6] snap-start flex flex-col justify-center relative overflow-hidden">

        <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10 flex flex-col h-full justify-center">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-12"
          >
            <h2 className="text-4xl sm:text-5xl font-serif font-medium mb-4 text-[#FAF9F6]">
              Transformation
            </h2>
            <div className="w-16 h-0.5 bg-[#D4C5B0] mx-auto opacity-60 mb-6"></div>
            <p className="max-w-2xl mx-auto text-[#D4C5B0] font-light text-sm sm:text-base leading-relaxed">
              見證美麗的蛻變。我們專注於每一個細節，為您打造最自然的精緻感。
            </p>
          </motion.div>

          {/* Before/After Slider */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="w-full max-w-2xl mx-auto"
          >
            <div className="relative rounded-2xl overflow-hidden shadow-2xl border-4 border-[#FAF9F6]/10">
              {isLoading ? (
                <div className="h-[50vh] bg-white/5 animate-pulse flex items-center justify-center">
                  <span className="text-white/50">Loading...</span>
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
            <p className="mt-4 text-center text-xs tracking-widest text-[#D4C5B0]/70 uppercase">
              Drag slider to compare
            </p>
          </motion.div>
        </div>
      </section>
    </>
  );
};

export default PortfolioSection;