import React from 'react';
import { Link } from 'react-router-dom';
import { motion, useScroll, useTransform } from 'framer-motion';

interface HeroSectionProps {
  heroImage: string;
}

const HeroSection: React.FC<HeroSectionProps> = ({ heroImage }) => {
  const { scrollYProgress } = useScroll();
  return (
    <header className="relative h-screen flex flex-col justify-end pb-20 px-6 overflow-hidden snap-start">
      {/* Background Image - Asymmetrical Placement with Parallax */}
      <div className="absolute top-0 right-0 w-[85%] h-[85%] z-0">
         <motion.div 
            className="w-full h-full bg-cover bg-center grayscale-[20%] contrast-[1.1]"
            style={{
              backgroundImage: heroImage ? `url(${heroImage})` : "bg-[#E5E0D8]", 
              y: useTransform(scrollYProgress, [0, 1], ['0%', '20%'])
            }}
         />
         {/* Decorative colored block */}
         <div className="absolute -bottom-8 -left-8 w-32 h-32 bg-[#D4C5B0]/30 -z-10 backdrop-blur-sm" />
      </div>

      {/* Main Content - Overlapping & Asymmetrical */}
      {/* Text Container with Background */}
      <div className="relative z-10 mt-auto ml-2 max-w-lg bg-[#FAF9F6]/80 backdrop-blur-md p-8 rounded-tr-3xl shadow-sm">
        {/* Tiny Label */}
        <p className="text-xs font-bold tracking-[0.3em] text-[#8A8175] mb-4 uppercase flex items-center gap-3">
           <span className="w-8 h-[1px] bg-[#8A8175]"></span>
           Est. 2024
        </p>

        {/* Big Typography */}
        <h1 className="text-6xl sm:text-7xl md:text-8xl font-serif text-[#2C2825] leading-[0.9] tracking-tighter mb-6 mix-blend-multiply">
          The <br/>
          <span className="italic font-light ml-8">Art of</span> <br/>
          Beauty.
        </h1>

        <p className="text-sm sm:text-base text-[#5E5850] font-light max-w-xs leading-relaxed ml-1 mb-10 pl-4 border-l border-[#8A8175]/50">
           重新定義您的美麗日常。<br/>
           專屬客製化美睫、美甲與霧眉設計。
        </p>

        <Link
          to="/dashboard"
          className="group inline-flex items-center gap-3 px-8 py-4 bg-[#2C2825] text-[#FAF9F6] text-sm tracking-widest hover:bg-[#4A4238] transition-all duration-500 rounded-none shadow-[4px_4px_0px_0px_rgba(0,0,0,0.1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none"
        >
          <span>START JOURNEY</span>
          <span className="group-hover:translate-x-1 transition-transform duration-300">→</span>
        </Link>
      </div>

      {/* Vertical Japanese Text Decor */}
      <div className="absolute top-12 left-6 text-[#D4C5B0] text-xs writing-vertical-rl tracking-[0.5em] font-serif hidden sm:block opacity-60">
        美しさの探求
      </div>
    </header>
  );
};

export default HeroSection;