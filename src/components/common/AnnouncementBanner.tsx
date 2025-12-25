import React from 'react';

const AnnouncementBanner: React.FC = () => {
  const announcementText = "歡迎加入 TREERING | 註冊即贈50 元禮金，單筆滿1,000元再贈送一點!!!";

  return (
    <>
      <div
        className="fixed font-serif top-[64px] left-0 right-0 z-40 bg-primary text-text-inverse text-sm font-medium shadow-sm overflow-hidden flex items-center tracking-wide"
        style={{ height: '48px' }}
      >
        {/* Marquee container with animation */}
        <div className="whitespace-nowrap animate-marquee flex items-center">
          {/* Render the text twice for a seamless loop */}
          <span className="py-3 px-6">{announcementText}</span>
          <span className="py-3 px-6">{announcementText}</span>
        </div>
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
          /* The animation duration can be adjusted based on text length */
          animation: marquee 30s linear infinite;
        }

        /* 支援使用者偏好設定 */
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
