import React from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, Gift, ArrowRight } from 'lucide-react';
import { useGlobalSettings } from '../../hooks/useGlobalSettings';

const AnnouncementBanner: React.FC = () => {
  const { settings } = useGlobalSettings();

  const defaultText = "歡迎加入 TREERING 希亞美學 ｜ 新朋友註冊即贈 $50 禮金，單筆消費滿 $1,000 再享專屬點數回饋！";
  const announcementText = settings.bookingNotice?.trim() || defaultText;

  return (
    <>
      <div
        className="fixed top-[64px] left-0 right-0 z-40 bg-gradient-to-r from-[#9F9586] via-[#8A8173] to-[#9F9586] text-white text-xs sm:text-sm font-medium shadow-sm overflow-hidden flex items-center tracking-wide border-b border-white/10 group select-none"
        style={{ height: '48px' }}
      >
        <Link
          to="/login"
          className="w-full h-full flex items-center overflow-hidden hover:opacity-95 transition-opacity"
        >
          {/* Marquee container with smooth continuous animation & hover pause */}
          <div className="whitespace-nowrap animate-marquee flex items-center shrink-0 group-hover:[animation-play-state:paused]">
            {/* Render 4 times for seamless infinite loop on any screen width */}
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-3 px-8 shrink-0">
                <span className="flex items-center gap-1.5 font-serif font-bold text-amber-200">
                  <Sparkles className="w-3.5 h-3.5 text-amber-300 animate-pulse shrink-0" />
                  <Gift className="w-3.5 h-3.5 text-amber-300 shrink-0" />
                </span>
                <span className="font-medium tracking-wide">{announcementText}</span>
                <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-white/20 hover:bg-white/30 backdrop-blur-md text-white font-bold transition-colors">
                  <span>立即領取</span>
                  <ArrowRight className="w-3 h-3" />
                </span>
                <span className="text-white/40 font-serif">✦</span>
              </div>
            ))}
          </div>
        </Link>
      </div>

      {/* Custom Styles for the marquee animation */}
      <style>{`
        @keyframes marquee {
          0% {
            transform: translateX(0%);
          }
          100% {
            transform: translateX(-50%);
          }
        }

        .animate-marquee {
          animation: marquee 32s linear infinite;
          will-change: transform;
        }

        @media (prefers-reduced-motion: reduce) {
          .animate-marquee {
            animation-play-state: paused !important;
          }
        }
      `}</style>
    </>
  );
};

export default AnnouncementBanner;
