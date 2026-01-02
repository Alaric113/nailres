import React, { useMemo, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { BuildingStorefrontIcon, PaperAirplaneIcon } from '@heroicons/react/24/solid';
import { renderToString } from 'react-dom/server';
import { useAuthStore } from '../store/authStore';

import { isLiffBrowser } from '../lib/liff';

// Component to fix map rendering issues (grey tiles) by triggering a resize check
const MapFix = () => {
  const map = useMap();
  useEffect(() => {
    // Invalidate size after a short delay to ensure container dimensions are set
    const timer = setTimeout(() => {
      map.invalidateSize();
    }, 100);
    return () => clearTimeout(timer);
  }, [map]);
  return null;
};

const StoreInfoPage: React.FC = () => {
  const { currentUser } = useAuthStore();
  const position: [number, number] = [25.08800, 121.47539]; // Coordinates from previous iframe
  const [showAppSelection, setShowAppSelection] = useState(false);
  const isLiff = isLiffBrowser();

  const heightClass = isLiff 
    ? 'h-[100dvh]' 
    : (!currentUser 
        ? 'h-[calc(100dvh-112px)]'
        : 'h-[calc(100dvh-144px)] md:h-[calc(100dvh-64px)]');

  const handleNavigate = () => {
    // Simple iOS detection
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
             <div className="bg-[#9F9586] text-white p-2 rounded-full shadow-lg border-2 border-white relative z-10">
               <BuildingStorefrontIcon className="w-6 h-6" />
             </div>
             {/* Pulse effect - Centered behind the head */}
             <div className="absolute top-0 left-0 w-full h-full bg-[#9F9586] rounded-full animate-ping opacity-75 z-0"></div>
           </div>
           {/* Triangle pointing down */}
           <div className="w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[8px] border-t-[#9F9586] mt-[-1px] relative z-10"></div>
        </div>
      ),
      iconSize: [40, 40],
      iconAnchor: [20, 40], // Anchor at bottom center
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
              className="absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl z-[2001] p-6 pb-12 shadow-2xl"
            >
              <h3 className="text-center font-serif text-xl text-[#2C2825] mb-6">選擇導航應用程式</h3>
              <div className="flex flex-col gap-3">
                <button 
                  onClick={() => openMapApp('apple')}
                  className="flex items-center justify-center gap-3 w-full bg-[#2C2825] text-white p-4 rounded-xl active:scale-95 transition-transform"
                >
                  <i className="fa-brands fa-apple text-2xl"></i>
                  <span className="font-bold">Apple Maps</span>
                </button>
                <button 
                  onClick={() => openMapApp('google')}
                  className="flex items-center justify-center gap-3 w-full bg-white border border-[#2C2825]/10 text-[#2C2825] p-4 rounded-xl active:scale-95 transition-transform hover:bg-gray-50"
                >
                  <i className="fa-brands fa-google text-2xl"></i>
                  <span className="font-bold">Google Maps</span>
                </button>
                <button 
                  onClick={() => setShowAppSelection(false)}
                  className="mt-2 text-[#8A8175] text-sm py-2"
                >
                  取消
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* --- Map Section (Top) --- */}
      <div className="h-[50%] w-full relative z-0 shrink-0 group">
        <MapContainer 
          center={position} 
          zoom={17} 
          scrollWheelZoom={true} 
          className="w-full h-full outline-none"
          // We can set tiles to CartoDB Voyager for a nice clean look close to the design
        >
            <MapFix />
            <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
                url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
            />
            <Marker position={position} icon={customIcon}>
                <Popup className="font-serif">
                   <div className="text-center">
                     <h3 className="font-bold text-[#2C2825]">TreeRing Studio</h3>
                     <p className="text-sm text-[#8A8175]">Here we are!</p>
                   </div>
                </Popup>
            </Marker>
        </MapContainer>
        
        {/* Navigation FAB */}
        <motion.button
          onClick={handleNavigate}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="absolute bottom-10 right-6 z-[1002] bg-[#2C2825] text-white p-4 rounded-full shadow-xl flex items-center gap-2 hover:bg-[#8A8175] transition-colors"
        >
           <PaperAirplaneIcon className="w-6 h-6" />
           <span className="font-bold tracking-wide text-sm  group-hover:block transition-all duration-300">導航</span>
        </motion.button>
        
        {/* Gradient Overlay for seamless transition */}
        <div className="absolute bottom-0 left-0 w-full h-16 bg-gradient-to-t from-[#FAF9F6] to-transparent pointer-events-none z-[1000]" />
      </div>

      {/* --- Content Section --- */}
      <motion.div 
         initial={{ opacity: 0, y: 30 }}
         animate={{ opacity: 1, y: 0 }}
         transition={{ duration: 0.8 }}
         className="flex-1 -mt-8 relative z-[1001] bg-white rounded-t-[2.5rem] shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.1)] border-t border-[#2C2825]/5 flex flex-col"
      >
         <div className="flex-1 px-8 pt-8 pb-12 flex flex-col justify-between">
             
             {/* Header */}
             <div className="text-center shrink-0">
                <h2 className="text-2xl font-serif text-[#2C2825] mb-2 tracking-wide">
                  Store Info
                </h2>
                <div className="w-10 h-0.5 bg-[#8A8175] mx-auto opacity-40"></div>
             </div>

             {/* Info Rows */}
             <div className="flex flex-col gap-6 shrink-0 mt-4">
                {/* Address */}
                <div className="flex items-start gap-4">
                   <div className="w-10 h-10 rounded-full bg-[#FAF9F6] flex items-center justify-center text-lg shrink-0 text-[#2C2825]">
                      📍
                   </div>
                   <div className="text-left">
                      <h3 className="font-serif text-base text-[#2C2825] mb-1">Address</h3>
                      <p className="text-[#8A8175] text-sm leading-snug">新北市蘆洲區民權路68巷16號1樓</p>
                      <p className="text-[12px] text-[#8A8175]/60 mt-1">三民高中捷運站2號出口 步行5分鐘</p>
                   </div>
                </div>

                {/* Hours */}
                <div className="flex items-start gap-4">
                   <div className="w-10 h-10 rounded-full bg-[#FAF9F6] flex items-center justify-center text-lg shrink-0 text-[#2C2825]">
                      🕐
                   </div>
                   <div className="text-left">
                      <h3 className="font-serif text-base text-[#2C2825] mb-1">Open Hours</h3>
                      <p className="text-[#8A8175] text-sm">每日 10:00 - 20:00</p>
                   </div>
                </div>
             </div>

             {/* Socials */}
             <div className="pt-6 border-t border-[#2C2825]/5 shrink-0 mt-2">
                 <div className="flex flex-col justify-center items-center px-4">
                    <span className="font-serif text-base text-[#2C2825] mb-2">追蹤我們</span>
                    <div className="flex gap-4">
                      {[
                        { name: 'Instagram', url: 'https://www.instagram.com/treering_83/', icon: 'fa-brands fa-instagram' },
                        { name: 'LINE', url: 'https://page.line.me/985jirte', icon: 'fa-brands fa-line' },
                        { name: 'Facebook', url: 'https://www.facebook.com/share/19Z1mqXuKG/?mibextid=wwXIfr', icon: 'fa-brands fa-facebook' },
                        { name: 'TikTok', url: 'https://www.tiktok.com/@treering_83?is_from_webapp=1&sender_device=pc', icon: 'fa-brands fa-tiktok' },
                        
                      ].map((social) => (
                        <a 
                          key={social.name}
                          href={social.url} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="w-14 h-14 rounded-full border border-[#2C2825]/10 flex items-center justify-center hover:bg-[#2C2825] hover:text-white transition-all duration-300"
                        >
                           <i className={`${social.icon} text-3xl`}></i>
                        </a>
                      ))}
                    </div>
                 </div>
             </div>

             
         </div>
      </motion.div>
    </div>
  );
};

export default StoreInfoPage;
