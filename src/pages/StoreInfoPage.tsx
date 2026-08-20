import React, { useMemo, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { BuildingStorefrontIcon, PaperAirplaneIcon } from '@heroicons/react/24/solid';
import { MapPinIcon, ClockIcon, DocumentDuplicateIcon, CheckIcon } from '@heroicons/react/24/outline';
import { renderToString } from 'react-dom/server';
import { useAuthStore } from '../store/authStore';
import { isLiffBrowser } from '../lib/liff';

// Component to fix map rendering issues (grey tiles) by triggering a resize check
const MapFix = () => {
  const map = useMap();
  useEffect(() => {
    const timer = setTimeout(() => {
      map.invalidateSize();
    }, 100);
    return () => clearTimeout(timer);
  }, [map]);
  return null;
};

// Clean vector social icons
const SocialSVGs = {
  Instagram: () => (
    <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
    </svg>
  ),
  LINE: () => (
    <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
      <path d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.627-.63h2.386c.349 0 .63.285.63.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.629-.631.629-.346 0-.626-.285-.626-.629V8.108c0-.27.173-.51.43-.595.06-.023.136-.033.194-.033.195 0 .375.104.495.254l2.462 3.33v-2.954c0-.345.282-.63.63-.63.345 0 .63.285.63.63v4.773zm-6.741 0c0 .344-.282.629-.631.629-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.627-.63.349 0 .631.285.631.63v4.771zm-2.466.629H3.917c-.345 0-.63-.285-.63-.629V8.108c0-.345.285-.63.63-.63.348 0 .63.285.63.63v4.141h1.756c.348 0 .629.283.629.63 0 .344-.281.629-.629.629M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.078 9.436-6.975C23.176 14.393 24 12.458 24 10.314" />
    </svg>
  ),
  Facebook: () => (
    <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
      <path d="M9 8H6v4h3v12h5V12h3.642L18 8h-4V6.333C14 5.374 14.5 5 15.5 5H18V0h-3.808C10.595 0 9 1.582 9 4.615V8z" />
    </svg>
  ),
  TikTok: () => (
    <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
      <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.24 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z" />
    </svg>
  ),
  Apple: () => (
    <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
      <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.85c.66-.8 1.11-1.92.99-3.04-.96.04-2.12.64-2.8 1.44-.59.69-1.11 1.83-.97 2.91 1.07.08 2.13-.54 2.78-1.31z" />
    </svg>
  ),
  Google: () => (
    <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
      <path d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z" />
    </svg>
  ),
};

const StoreInfoPage: React.FC = () => {
  const { currentUser } = useAuthStore();
  const position: [number, number] = [25.081264, 121.47417];
  const [showAppSelection, setShowAppSelection] = useState(false);
  const [copied, setCopied] = useState(false);
  const isLiff = isLiffBrowser();

  const heightClass = isLiff 
    ? 'h-[100dvh]' 
    : (!currentUser 
        ? 'h-[calc(100dvh-112px)]'
        : 'h-[calc(100dvh-144px)] md:h-[calc(100dvh-64px)]');

  const handleCopyAddress = () => {
    navigator.clipboard.writeText('新北市蘆洲區中山一路176號');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleNavigate = () => {
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    if (isIOS) {
      setShowAppSelection(true);
    } else {
      const destination = `${position[0]},${position[1]}`;
      window.open(`https://www.google.com/maps/dir/?api=1&destination=${destination}`, '_blank');
    }
  };

  const openMapApp = (type: 'google' | 'apple') => {
    const destination = `${position[0]},${position[1]}`;
    if (type === 'google') {
       window.open(`https://www.google.com/maps/dir/?api=1&destination=${destination}`, '_blank');
    } else {
       window.open(`http://maps.apple.com/?daddr=${destination}`, '_blank');
    }
    setShowAppSelection(false);
  };

  // Create custom icon
  const customIcon = useMemo(() => {
    return L.divIcon({
      className: 'custom-icon',
      html: renderToString(
        <div className="relative flex flex-col items-center justify-center -translate-x-1/2 -translate-y-full">
           <div className="relative">
             <div className="bg-[#9F9586] text-white p-2.5 rounded-full shadow-lg border-2 border-white relative z-10">
               <BuildingStorefrontIcon className="w-5 h-5" />
             </div>
             {/* Pulse effect */}
             <div className="absolute top-0 left-0 w-full h-full bg-[#9F9586] rounded-full animate-ping opacity-75 z-0"></div>
           </div>
           {/* Triangle pointer */}
           <div className="w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[8px] border-t-[#9F9586] -mt-0.5 relative z-10"></div>
        </div>
      ),
      iconSize: [40, 40],
      iconAnchor: [20, 40],
      popupAnchor: [0, -45],
    });
  }, []);

  return (
    <div className={`${heightClass} bg-[#FAF9F6] text-[#2C2825] overflow-hidden flex flex-col relative`}>
      {/* Map App Selection Modal */}
      <AnimatePresence>
        {showAppSelection && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowAppSelection(false)}
              className="absolute inset-0 bg-black/40 z-[2000] backdrop-blur-sm"
            />
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl z-[2001] p-6 pb-12 shadow-2xl max-w-lg mx-auto"
            >
              <h3 className="text-center font-serif text-xl text-[#2C2825] mb-6 font-bold">
                選擇導航應用程式
              </h3>
              <div className="flex flex-col gap-3">
                <button 
                  onClick={() => openMapApp('apple')}
                  className="flex items-center justify-center gap-3 w-full bg-[#2C2825] text-white p-4 rounded-xl active:scale-95 transition-transform font-bold"
                >
                  <SocialSVGs.Apple />
                  <span>Apple Maps</span>
                </button>
                <button 
                  onClick={() => openMapApp('google')}
                  className="flex items-center justify-center gap-3 w-full bg-white border border-[#2C2825]/10 text-[#2C2825] p-4 rounded-xl active:scale-95 transition-transform hover:bg-gray-50 font-bold"
                >
                  <SocialSVGs.Google />
                  <span>Google Maps</span>
                </button>
                <button 
                  onClick={() => setShowAppSelection(false)}
                  className="mt-2 text-[#8A8175] text-sm py-2 text-center"
                >
                  取消
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* --- Map Section (Top 50%) --- */}
      <div className="h-[50%] w-full relative z-0 shrink-0 group">
        <MapContainer 
          center={position} 
          zoom={17} 
          scrollWheelZoom={true} 
          className="w-full h-full outline-none"
        >
            <MapFix />
            <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
                url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
            />
            <Marker position={position} icon={customIcon}>
                <Popup className="font-serif">
                   <div className="text-center p-1">
                     <h3 className="font-bold text-[#2C2825]">TreeRing 希亞美學</h3>
                     <p className="text-xs text-[#8A8175] mt-0.5">新北市蘆洲區中山一路176號</p>
                   </div>
                </Popup>
            </Marker>
        </MapContainer>
        
        {/* Navigation FAB */}
        <motion.button
          onClick={handleNavigate}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="absolute bottom-10 right-6 z-[1002] bg-[#2C2825] text-white px-4 py-3 rounded-full shadow-xl flex items-center gap-2 hover:bg-[#8A8175] transition-colors cursor-pointer"
        >
           <PaperAirplaneIcon className="w-5 h-5" />
           <span className="font-bold tracking-wide text-sm">路線導航</span>
        </motion.button>
        
        {/* Gradient Overlay for seamless transition */}
        <div className="absolute bottom-0 left-0 w-full h-16 bg-gradient-to-t from-[#FAF9F6] to-transparent pointer-events-none z-[1000]" />
      </div>

      {/* --- Content Section (Bottom Sheet Card) --- */}
      <motion.div 
         initial={{ opacity: 0, y: 30 }}
         animate={{ opacity: 1, y: 0 }}
         transition={{ duration: 0.8 }}
         className="flex-1 -mt-8 relative z-[1001] bg-white rounded-t-[2.5rem] shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.1)] border-t border-[#2C2825]/5 flex flex-col overflow-y-auto"
      >
         <div className="flex-1 px-6 sm:px-8 pt-6 sm:pt-8 pb-10 flex flex-col justify-between max-w-xl mx-auto w-full">
             
             {/* Header */}
             <div className="text-center shrink-0">
                <h2 className="text-2xl font-serif text-[#2C2825] mb-2 tracking-wide font-bold">
                  Store Info
                </h2>
                <div className="w-10 h-0.5 bg-[#8A8175] mx-auto opacity-40"></div>
             </div>

             {/* Info Rows */}
             <div className="flex flex-col gap-5 shrink-0 mt-4">
                {/* Address */}
                <div className="flex items-start gap-3.5">
                   <div className="w-10 h-10 rounded-full bg-[#FAF9F6] border border-[#EFECE5] flex items-center justify-center shrink-0 text-[#9F9586]">
                      <MapPinIcon className="w-5 h-5" />
                   </div>
                   <div className="text-left flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h3 className="font-serif text-sm font-bold text-[#2C2825] mb-0.5">Address</h3>
                        <button
                          onClick={handleCopyAddress}
                          className="text-[11px] font-bold text-[#9F9586] hover:text-[#2C2825] flex items-center gap-1 transition-colors px-2 py-0.5 rounded-md hover:bg-[#FAF9F6]"
                        >
                          {copied ? (
                            <>
                              <CheckIcon className="w-3.5 h-3.5 text-emerald-600" />
                              <span className="text-emerald-600">已複製地址</span>
                            </>
                          ) : (
                            <>
                              <DocumentDuplicateIcon className="w-3.5 h-3.5" />
                              <span>複製地址</span>
                            </>
                          )}
                        </button>
                      </div>
                      <p className="text-[#8A8175] text-sm leading-snug">新北市蘆洲區中山一路176號</p>
                      <p className="text-[12px] text-[#8A8175]/60 mt-0.5">徐匯中學捷運站 步行約 9 分鐘</p>
                   </div>
                </div>

                {/* Hours */}
                <div className="flex items-start gap-3.5">
                   <div className="w-10 h-10 rounded-full bg-[#FAF9F6] border border-[#EFECE5] flex items-center justify-center shrink-0 text-[#9F9586]">
                      <ClockIcon className="w-5 h-5" />
                   </div>
                   <div className="text-left">
                      <h3 className="font-serif text-sm font-bold text-[#2C2825] mb-0.5">Open Hours</h3>
                      <p className="text-[#8A8175] text-sm">週一至週日 10:00 - 20:00</p>
                      <p className="text-[12px] text-[#8A8175]/60 mt-0.5">採專屬預約制服務</p>
                   </div>
                </div>
             </div>

             {/* Socials */}
             <div className="pt-5 border-t border-[#2C2825]/5 shrink-0 mt-4">
                 <div className="flex flex-col justify-center items-center px-4">
                    <span className="font-serif text-sm text-[#2C2825] mb-3 font-bold tracking-wide">追蹤我們</span>
                    <div className="flex gap-4">
                      {[
                        { name: 'Instagram', url: 'https://www.instagram.com/treering_83/', icon: SocialSVGs.Instagram },
                        { name: 'LINE', url: 'https://page.line.me/985jirte', icon: SocialSVGs.LINE },
                        { name: 'Facebook', url: 'https://www.facebook.com/share/19Z1mqXuKG/?mibextid=wwXIfr', icon: SocialSVGs.Facebook },
                        { name: 'TikTok', url: 'https://www.tiktok.com/@treering_83?is_from_webapp=1&sender_device=pc', icon: SocialSVGs.TikTok },
                      ].map((social) => {
                        const Icon = social.icon;
                        return (
                          <a 
                            key={social.name}
                            href={social.url} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="w-12 h-12 rounded-full border border-[#2C2825]/10 flex items-center justify-center text-[#2C2825] hover:bg-[#2C2825] hover:text-white transition-all duration-300 shadow-sm active:scale-95"
                            title={social.name}
                            aria-label={social.name}
                          >
                             <Icon />
                          </a>
                        );
                      })}
                    </div>
                 </div>
             </div>

         </div>
      </motion.div>
    </div>
  );
};

export default StoreInfoPage;
