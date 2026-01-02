import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

interface ServiceHighlight {
   title: string;
   description: string;
   price: string | number;
   link: string;
   imglink?: string;
   highlights: string[];
}

interface Category extends ServiceHighlight { }

interface ServiceHighlightsProps {
   categories: Category[];
}

const ServiceHighlights: React.FC<ServiceHighlightsProps> = ({ categories }) => {
   // Distinct background colors for the cards
   const bgColors = [
      'bg-[#2C2825]', // Deepest Dark
      'bg-[#3E3935]', // Medium Dark
      'bg-[#504945]'  // Lighter Dark
   ];

   return (
      <section id="services" className="min-h-screen w-full snap-start flex flex-col bg-[#FAF9F6] relative overflow-hidden pt-16 pb-12 md:pt-24 md:pb-20">

         {/* Editorial Title */}
         <div className="container mx-auto px-6 mb-8 md:mb-12">
            <motion.div
               initial={{ opacity: 0, y: 30 }}
               whileInView={{ opacity: 1, y: 0 }}
               transition={{ duration: 0.8 }}
               className="flex flex-col items-start border-t border-[#2C2825] pt-4"
            >
               <span className="text-[10px] md:text-xs font-bold tracking-[0.2em] text-[#8A8175] uppercase mb-1">Our expertise</span>
               <h2 className="text-4xl md:text-6xl font-serif text-[#2C2825] leading-none">
                  Services <span className="italic font-light text-[#8A8175]">&</span> Craft
               </h2>
            </motion.div>
         </div>

         {/* Cards Container */}
         <div className="container mx-auto px-6 grid grid-cols-3 md:grid-cols-3 lg:grid-cols-3 gap-4 md:gap-6 w-full">
            {categories.map((category, index) => (
               <Link
                  to={category.link}
                  key={category.title}
                  className={`group relative flex flex-col justify-between  ${bgColors[index % bgColors.length]} transition-all duration-500 hover:-translate-y-2 h-[420px] md:h-auto md:aspect-[3/4]`}
               >
                  {/* Service Image (Top of Card) */}
                  <div className="w-full h-32 md:h-40 overflow-hidden rounded-sm mb-6 relative opacity-80 group-hover:opacity-100 transition-opacity duration-500">
                     <img src={category.imglink} alt={category.title} className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-700" loading="lazy" />
                  </div>

                  {/* Number & Title */}
                  <div className='px-6'>
                     <div className="flex items-center gap-3 text-[#D4C5B0] opacity-80 mb-2">


                        <span className="text-xs tracking-[0.2em] uppercase truncate">{category.description}</span>
                     </div>

                     {/* Reduced text size to prevent wrapping on small screens, ensuring card height is consistent */}
                     <h3 className="text-2xl md:text-3xl text-[#FAF9F6] font-medium tracking-wide mb-3 whitespace-nowrap">
                        {category.title}
                     </h3>

                     {/* Tags */}
                     <div className="flex flex-wrap gap-2 opacity-80 group-hover:opacity-100 transition-opacity mb-4">
                        {category.highlights.slice(0, 2).map(tag => (
                           <span key={tag} className="px-2 py-1 rounded-full border border-[#D4C5B0]/30 text-[#D4C5B0] text-[10px] tracking-wider font-light">
                              {tag}
                           </span>
                        ))}
                     </div>
                  </div>

                  {/* Bottom: Price & Action */}
                  <div className="mt-auto p-6 pt-4 border-t border-[#FAF9F6]/20 flex flex-col items-start justify-between w-full">
                     <span className="font-serif italic text-lg text-[#FAF9F6] mb-2">
                        NT$ <span className="not-italic font-sans">{category.price} +</span>
                     </span>
                     <span className="text-[#D4C5B0] text-xs tracking-widest group-hover:translate-x-2 transition-transform duration-300 flex items-center gap-2">
                        EXPLORE <span className="text-lg">→</span>
                     </span>
                  </div>

                  {/* Interactive Hover Overlay (Desktop) */}
                  <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
               </Link>
            ))}
         </div>
      </section>
   );
};

export default ServiceHighlights;