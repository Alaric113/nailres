import React from 'react';

const Footer: React.FC = () => {
  return (
    <footer id="contact" className="bg-text-main text-secondary-light snap-start">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-12">
          
          {/* Brand Column */}
          <div className="md:col-span-4 space-y-6">
            <h2 className="text-3xl font-serif tracking-wider text-white">TREERING</h2>
            <p className="text-secondary/60 text-sm leading-relaxed max-w-xs">
              我們致力於提供最專業、最細緻的美甲與美睫服務，讓每一位顧客都能帶著滿意的微笑離開。自然、舒適、原生之美。
            </p>
            
          </div>

          {/* Info Column */}
          <div className="md:col-span-4 space-y-6">
            <h3 className="text-lg font-serif text-primary mb-4">Store Info</h3>
            <div className="space-y-4 text-sm text-secondary/80">
              <div className="flex items-start space-x-3">
                <span className="text-primary mt-0.5">📍</span>
                <div>
                  <p className="font-medium text-white">Address</p>
                  <p>新北市蘆洲區民權路68巷16號1樓</p>
                  <p className="text-xs text-secondary/50 mt-1">三民高中捷運站2號出口 步行5分鐘</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <span className="text-primary mt-0.5">🕐</span>
                <div>
                   <p className="font-medium text-white">Open Hours</p>
                   <p>每日 10:00 - 19:00</p>
                </div>
              </div>
            </div>
          </div>

          {/* Social Column */}
          <div className="md:col-span-4 flex flex-col md:items-end space-y-6">
            <h3 className="text-lg font-serif text-primary mb-4 md:text-right">Follow Us</h3>
            <div className="grid grid-cols-2 md:flex  md:flex-col gap-3 md:items-end">
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
                  className="group flex items-center gap-3 text-sm text-secondary/70 hover:text-white transition-colors"
                >
                  <span className="group-hover:translate-x-1 transition-transform duration-300">{social.name}</span>
                  <span className="w-8 h-8 flex items-center justify-center rounded-full bg-white/5 group-hover:bg-primary group-hover:text-white transition-all">
                    {social.icon}
                  </span>
                </a>
              ))}
            </div>
          </div>
          

        </div>
        
      </div>
      <div >
              <p className="text-xs text-secondary/40 text-center pb-4">
                &copy; {new Date().getFullYear()} TreeRing Studio. All Rights Reserved.
              </p>
            </div>
    </footer>
  );
};

export default Footer;