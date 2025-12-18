import React from 'react';
import { motion } from 'framer-motion';

const StoreInfoPage: React.FC = () => {
  return (
    <div className="h-[100dvh] bg-[#FAF9F6] text-[#2C2825] overflow-hidden flex flex-col relative">
      {/* --- Map Section (Top) --- */}
      <div className="h-[42%] w-full relative z-0 shrink-0">
        <iframe
          title="TreeRing Studio Location"
          src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3613.597658285587!2d121.46937747605963!3d25.081699977789396!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3442a89049755555%3A0x1234567890abcdef!2zMjQ35paw5YyX5biA6JiG5r0u5Y2A5rCR5qC96LevNjjpg9UxNuiZnzHmq18!5e0!3m2!1szh-TW!2stw!4v1700000000000!5m2!1szh-TW!2stw"
          width="100%"
          height="100%"
          style={{ border: 0, filter: 'grayscale(100%) contrast(1.2) opacity(0.9)' }}
          allowFullScreen={true}
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
        ></iframe>
        <div className="absolute bottom-0 left-0 w-full h-16 bg-gradient-to-t from-[#FAF9F6] to-transparent pointer-events-none" />
      </div>

      {/* --- Content Section --- */}
      <motion.div 
         initial={{ opacity: 0, y: 30 }}
         animate={{ opacity: 1, y: 0 }}
         transition={{ duration: 0.8 }}
         className="flex-1 -mt-8 relative z-10 bg-white rounded-t-[2.5rem] shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.1)] border-t border-[#2C2825]/5 flex flex-col"
      >
         <div className="flex-1 px-8 pt-8 pb-24 flex flex-col justify-between">
             
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
                      <p className="text-[10px] text-[#8A8175]/60 mt-1">三民高中捷運站2號出口 步行5分鐘</p>
                   </div>
                </div>

                {/* Hours */}
                <div className="flex items-start gap-4">
                   <div className="w-10 h-10 rounded-full bg-[#FAF9F6] flex items-center justify-center text-lg shrink-0 text-[#2C2825]">
                      🕐
                   </div>
                   <div className="text-left">
                      <h3 className="font-serif text-base text-[#2C2825] mb-1">Open Hours</h3>
                      <p className="text-[#8A8175] text-sm">每日 10:00 - 19:00</p>
                   </div>
                </div>
             </div>

             {/* Socials */}
             <div className="pt-6 border-t border-[#2C2825]/5 shrink-0 mt-2">
                 <div className="flex justify-between items-center px-4">
                    <span className="font-serif text-sm text-[#2C2825]">Follow Us</span>
                    <div className="flex gap-4">
                      {[
                        { name: 'Instagram', url: 'https://www.instagram.com/treering_83/', icon: '📷' },
                        { name: 'Facebook', url: 'https://www.facebook.com/share/19Z1mqXuKG/?mibextid=wwXIfr', icon: '👍' },
                        { name: 'TikTok', url: 'https://www.tiktok.com/@treering_83?is_from_webapp=1&sender_device=pc', icon: '🎵' },
                        { name: 'LINE', url: 'https://page.line.me/985jirte', icon: '💬' },
                      ].map((social) => (
                        <a 
                          key={social.name}
                          href={social.url} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="w-10 h-10 rounded-full border border-[#2C2825]/10 flex items-center justify-center hover:bg-[#2C2825] hover:text-white transition-all duration-300"
                        >
                           <span className="text-lg">{social.icon}</span>
                        </a>
                      ))}
                    </div>
                 </div>
             </div>

             {/* Copyright */}
             <div className="text-center mt-2">
                <p className="text-[10px] text-[#8A8175]/50 tracking-widest uppercase">
                  &copy; 2024 TreeRing Studio
                </p>
             </div>
         </div>
      </motion.div>
    </div>
  );
};

export default StoreInfoPage;
