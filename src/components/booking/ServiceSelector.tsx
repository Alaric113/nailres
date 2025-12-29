import React, { useState, useEffect, useRef } from 'react';
import { useServices } from '../../hooks/useServices';
import { useServiceCategories } from '../../hooks/useServiceCategories';
import type { Service } from '../../types/service';
import { useAuthStore } from '../../store/authStore';
import LoadingSpinner from '../common/LoadingSpinner';
import CartSidebar from './CartSidebar';
import MobileCartBar from './MobileCartBar';
import ServiceOptionsSheet from './ServiceOptionsSheet';
// Removed ChevronDownIcon import as it's no longer used

interface ServiceSelectorProps {
  initialCategory?: string | null;
  onNext: () => void;
}

const ServiceSelector: React.FC<ServiceSelectorProps> = ({ onNext, initialCategory }) => {
  const { services, isLoading, error } = useServices();
  const { categories } = useServiceCategories();
  const { userProfile } = useAuthStore();
  
  const [activeCategory, setActiveCategory] = useState<string>('');
  const [selectedService, setSelectedService] = useState<Service | null>(null); // For Options Sheet
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  // Scroll Refs
  const categoryRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const containerRef = useRef<HTMLDivElement>(null);

  // Initialize active category
  useEffect(() => {
    if (categories.length > 0 && !activeCategory) {
      setActiveCategory(categories[0].name);
    }
  }, [categories, activeCategory]);

  // Handle initial category scroll
  useEffect(() => {
    if (initialCategory && categories.length > 0 && !isLoading) {
      // Small timeout to ensure refs are bound
      setTimeout(() => {
        scrollToCategory(initialCategory);
      }, 300);
    }
  }, [initialCategory, categories, isLoading]);

  // Handle manual scroll to category
  const scrollToCategory = (categoryName: string) => {
    setActiveCategory(categoryName);
    const element = categoryRefs.current[categoryName];
    const container = containerRef.current;
    
    if (element && container) {
      // Get element position relative to container
      const elementTop = element.offsetTop;
      // We don't need a huge offset since the header is OUTSIDE the scroll container.
      // But maybe a small padding for aesthetics.
      const offset = 80; 
      
      container.scrollTo({
        top: elementTop - offset,
        behavior: 'smooth'
      });
    }
  };

  // Scroll Spy using IntersectionObserver
  useEffect(() => {
    const container = containerRef.current;
    if (!container || isLoading || categories.length === 0) return;

    const observerOptions = {
      root: container,
      rootMargin: '-20% 0px -60% 0px', // Active region in the middle-top
      threshold: 0
    };

    const observerCallback: IntersectionObserverCallback = (entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          // Find which category this element belongs to
          const categoryName = Object.keys(categoryRefs.current).find(key => 
            categoryRefs.current[key] === entry.target
          );
          if (categoryName) {
            setActiveCategory(categoryName);
          }
        }
      });
    };

    const observer = new IntersectionObserver(observerCallback, observerOptions);

    Object.values(categoryRefs.current).forEach(el => {
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [categories, isLoading]);

  if (isLoading) {
    return <div className="flex justify-center p-4"><LoadingSpinner /></div>;
  }

  if (error) {
    return <p className="text-red-500">{error}</p>;
  }

  const getPriceForUser = (service: Service) => {
    if (userProfile?.role === 'platinum' && service.platinumPrice) {
      return { price: service.platinumPrice, isPlatinum: true, originalPrice: service.price };
    }
    return { price: service.price, isPlatinum: false };
  };

  const groupedServices = services
    .filter(s => s.available)
    .reduce((acc, service) => {
      const category = service.category || '其他';
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(service);
      return acc;
    }, {} as Record<string, Service[]>);


  // 確保分類順序
  const sortedCategories = Object.keys(groupedServices).sort((a, b) => {
    const indexA = categories.findIndex(c => c.name === a);
    const indexB = categories.findIndex(c => c.name === b);
    if (indexA === -1 && indexB === -1) return a.localeCompare(b);
    if (indexA === -1) return 1;
    if (indexB === -1) return -1;
    return indexA - indexB;
  });
  
  const handleServiceClick = (service: Service) => {
      setSelectedService(service);
      setIsSheetOpen(true);
  };

    return (
      <div className="flex bg-[#FAF9F6] h-full overflow-hidden relative ">
        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0 relative">
            
            {/* Category Tabs - Static in Flex Column */}
            <div className="bg-[#FAF9F6] z-30 shadow-sm border-b border-gray-200 overflow-x-auto no-scrollbar flex-none">
                <div className="flex px-4 items-center h-14 space-x-6 whitespace-nowrap">
                    {sortedCategories.map(category => (
                        <button
                            key={category}
                            onClick={() => scrollToCategory(category)}
                            className={`
                                h-full relative px-1 font-medium text-sm transition-colors
                                ${activeCategory === category 
                                    ? 'text-[#2C2825] font-bold' 
                                    : 'text-gray-400 hover:text-gray-600'
                                }
                            `}
                        >
                            {category}
                            {activeCategory === category && (
                                <div className="absolute bottom-0 left-0 w-full h-0.5 bg-[#2C2825]" />
                            )}
                        </button>
                    ))}
                </div>
            </div>

            {/* Scrollable Service List */}
            <div className="flex-1 overflow-y-auto pb-24" ref={containerRef}>
                <div className="max-w-3xl mx-auto p-4 space-y-8">
                    {sortedCategories.map(category => (
                        <div 
                            key={category} 
                            ref={(el) => { categoryRefs.current[category] = el; }}
                            className="scroll-mt-24 pb-8 border-b border-gray-100 last:border-0"
                        >
                            <div className="flex items-center gap-4 mb-6 px-2">
                                <h3 className="text-2xl font-sans font-bold text-primary-dark tracking-wide">
                                    {category}
                                </h3>
                                <div className="h-px bg-primary/20 flex-1"></div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {groupedServices[category].map(service => {
                                    const { price, isPlatinum, originalPrice } = getPriceForUser(service);
                                    return (
                                        <div 
                                            key={service.id}
                                            onClick={() => handleServiceClick(service)}
                                            className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-all cursor-pointer flex gap-4 group"
                                        >
                                            {/* Text Content */}
                                            <div className="flex-1 min-w-0 flex flex-col justify-between">
                                                <div>
                                                    <h4 className="font-bold text-text-main text-lg mb-1 group-hover:text-primary transition-colors">
                                                        {service.name}
                                                    </h4>
                                                    <p className="text-xs text-gray-400 line-clamp-2 mb-2">
                                                        {service.duration} 分鐘
                                                    </p>
                                                </div>
                                                <div className="flex items-baseline gap-2">
                                                    {isPlatinum && (
                                                        <span className="text-xs text-gray-400 line-through">NT${originalPrice}</span>
                                                    )}
                                                    <span className={`text-lg font-serif font-bold ${isPlatinum ? 'text-accent' : 'text-text-main'}`}>
                                                        ${price}<span className="text-xs"> 起</span>
                                                    </span>
                                                </div>
                                            </div>

                                            {/* Image */}
                                            {service.imageUrl ? (
                                                <div className="w-24 h-24 rounded-lg bg-gray-100 overflow-hidden shrink-0">
                                                    <img src={service.imageUrl} alt={service.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                                </div>
                                            ) : (
                                                <div className="w-24 h-24 rounded-lg  flex items-center justify-center text-gray-300 shrink-0">
                                                    
                                                </div>
                                            )}
                                            
                                            {/* Add Button Mockup (optional visual cue) */}
                                            <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity bg-white hover:bg-gray-50 rounded-full p-1.5 shadow-sm border border-gray-100">
                                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 text-primary">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                                                </svg>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>

        {/* Sidebar Cart (Desktop) */}
        <div className="hidden lg:block w-96 shrink-0 h-full relative z-30">
            <CartSidebar onNext={onNext} />
        </div>

        {/* Mobile Floating Bar */}
        <div className="lg:hidden">
            <MobileCartBar onNext={onNext} />
        </div>

        {/* Options Sheet */}
        <ServiceOptionsSheet 
            isOpen={isSheetOpen} 
            onClose={() => setIsSheetOpen(false)} 
            service={selectedService} 
        />

      </div>
    );
  };
export default ServiceSelector;