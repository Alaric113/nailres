import React, { useState, useEffect } from 'react';
import { useServices } from '../../hooks/useServices';
import type { Service } from '../../types/service';
import { useAuthStore } from '../../store/authStore';
import LoadingSpinner from '../common/LoadingSpinner';
import { ChevronDownIcon } from '@heroicons/react/24/outline';

interface ServiceSelectorProps {
  onServiceToggle: (service: Service) => void;
  selectedServiceIds: string[];
  initialCategory?: string | null;
}

const ServiceSelector: React.FC<ServiceSelectorProps> = ({ onServiceToggle, selectedServiceIds, initialCategory }) => {
  const { services, isLoading, error } = useServices();
  const { userProfile } = useAuthStore();
  const [openCategory, setOpenCategory] = useState<string | null>(initialCategory || null);

  useEffect(() => {
    if (initialCategory) {
      setOpenCategory(initialCategory);
    }
  }, [initialCategory]);

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
  const categoryOrder = ['美睫', '霧眉', '美甲'];
  const sortedCategories = Object.keys(groupedServices).sort((a, b) => {
    const indexA = categoryOrder.indexOf(a);
    const indexB = categoryOrder.indexOf(b);
    if (indexA === -1 && indexB === -1) return a.localeCompare(b);
    if (indexA === -1) return 1;
    if (indexB === -1) return -1;
    return indexA - indexB;
  });

  const handleCategoryClick = (category: string) => {
    setOpenCategory(prev => (prev === category ? null : category));
  };

    return (
      <div className="space-y-4">
        {sortedCategories.map((category) => {
          const categoryServices = groupedServices[category];
          const selectedCount = categoryServices.filter(s => selectedServiceIds.includes(s.id)).length;
          const isCategoryActive = selectedCount > 0;
          const isOpen = openCategory === category;
  
          return (
            <div 
              key={category} 
              className={`border rounded-2xl overflow-hidden transition-all duration-300 shadow-sm ${
                isCategoryActive ? 'border-primary/50' : 'border-secondary'
              }`}
            >
              <button
                onClick={() => handleCategoryClick(category)}
                className={`w-full p-5 text-left flex justify-between items-center transition-all duration-300 ${
                   isOpen 
                     ? 'bg-secondary text-text-main shadow-inner' 
                     : isCategoryActive 
                        ? 'bg-secondary-light hover:bg-secondary' 
                        : 'bg-white hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <h3 className={`text-lg font-serif font-bold tracking-wide ${isOpen ? 'text-text-main' : 'text-text-main'}`}>
                    {category}
                  </h3>
                  {selectedCount > 0 && (
                    <span className="flex items-center justify-center min-w-[1.5rem] h-6 px-2 rounded-full bg-primary text-white text-xs font-bold shadow-sm">
                      {selectedCount}
                    </span>
                  )}
                </div>
                <ChevronDownIcon
                  className={`w-5 h-5 transition-transform duration-300 ${
                    isOpen ? 'rotate-180 text-primary-dark' : 'text-gray-400'
                  }`}
                />
              </button>
              <div
                className="transition-all duration-500 ease-in-out overflow-hidden bg-secondary-light/30"
                style={{ maxHeight: isOpen ? '1200px' : '0px' }}
              >
                <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {categoryServices.map((service) => {
                    const isSelected = selectedServiceIds.includes(service.id);
                    const { price, isPlatinum, originalPrice } = getPriceForUser(service);
  
                    return (
                      <div
                        key={service.id}
                        onClick={() => onServiceToggle(service)}
                        className={`
                          relative flex flex-row items-center p-3 rounded-xl cursor-pointer transition-all duration-200 border
                          ${isSelected 
                            ? 'bg-white border-primary ring-2 ring-primary/20 shadow-md transform scale-[1.01]' 
                            : 'bg-white border-transparent shadow-sm hover:shadow-md hover:border-secondary-dark/50'
                          }
                        `}
                      >
                        {/* Selection Checkmark Badge */}
                        <div className={`
                          absolute top-3 right-3 w-5 h-5 rounded-full flex items-center justify-center transition-all duration-200
                          ${isSelected ? 'bg-primary scale-100 opacity-100' : 'bg-gray-100 scale-90 opacity-0'}
                        `}>
                           <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                             <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                           </svg>
                        </div>
  
                        {service.imageUrl && (
                          <div className="flex-shrink-0 mr-4">
                             <img 
                               className="h-20 w-20 rounded-lg object-cover shadow-sm bg-gray-100" 
                               src={service.imageUrl} 
                               alt={service.name} 
                             />
                          </div>
                        )}
                        
                        <div className="flex-grow min-w-0 py-1">
                          <h4 className={`font-medium text-base mb-1.5 truncate ${isSelected ? 'text-primary-dark font-bold' : 'text-text-main'}`}>
                            {service.name}
                          </h4>
                          
                          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                            <div className="flex items-baseline gap-1.5">
                              {isPlatinum && (
                                <span className="line-through text-xs text-gray-400">
                                  NT${originalPrice}
                                </span>
                              )}
                              <span className={`text-lg font-bold font-serif ${isPlatinum ? 'text-accent' : 'text-text-main'}`}>
                                NT${price}
                              </span>
                            </div>
                            <span className="text-gray-300 text-xs">|</span>
                            <span className="text-xs text-gray-500 font-medium bg-gray-100 px-2 py-0.5 rounded-full">
                              {service.duration} 分鐘
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    );
  };
export default ServiceSelector;