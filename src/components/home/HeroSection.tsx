import React from 'react';
import { Link } from 'react-router-dom';

interface HeroSectionProps {
  heroImage: string;
}

const HeroSection: React.FC<HeroSectionProps> = ({ heroImage }) => {
  return (
    <header className="relative h-screen min-h-[600px] flex items-center justify-center text-center text-white overflow-hidden snap-start snap-always">
      {/* Background Image with Parallax-like feel */}
      <div
        className="absolute inset-0 bg-cover bg-center transition-transform duration-1000 ease-out scale-105"
        style={{
          backgroundImage: heroImage ? `url(${heroImage})` : "bg-secondary", // Fallback color if no image
          filter: 'brightness(0.85) saturate(0.9)', // Slightly desaturated for natural look
        }}
      ></div>

      {/* Gradient Overlay - Earth Tones */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-secondary/20"></div>

      {/* Content */}
      <div className="relative z-10 px-4 sm:px-8 flex flex-col items-center">
        <h1
          className="text-5xl sm:text-7xl md:text-8xl font-serif tracking-tight mb-6 text-white opacity-90"
          style={{ textShadow: '0 4px 20px rgba(0,0,0,0.3)' }}
        >
          HELLO <br />
          <span className="tracking-widest">TREERING</span>
        </h1>

        <div className="w-24 h-1 bg-primary/80 mb-8 rounded-full backdrop-blur-sm"></div>

        <p className="max-w-xl mx-auto text-lg sm:text-xl md:text-2xl text-secondary-light font-light tracking-wide mb-10 leading-relaxed drop-shadow-md">
          EYELASH EXTENSION & BEAUTY SALON
        </p>

        <Link
          to="/booking"
          className="inline-block bg-white/90 hover:bg-white text-primary-dark font-serif font-medium rounded-full py-3 px-10 text-lg shadow-lg backdrop-blur-sm transition-all duration-300 hover:scale-105 hover:shadow-xl active:scale-95"
        >
          立即預約
        </Link>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 animate-bounce">
        <svg
          className="w-8 h-8 text-white/60"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="1.5"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path d="M19 14l-7 7m0 0l-7-7m7 7V3"></path>
        </svg>
      </div>
    </header>
  );
};

export default HeroSection;