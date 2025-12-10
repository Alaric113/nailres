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
      {sortedCategories.map((category) => (
        <div key={category} className="border border-secondary-dark/30 rounded-xl overflow-hidden transition-all duration-300">
          <button
            onClick={() => handleCategoryClick(category)}
            className="w-full p-4 text-left flex justify-between items-center bg-white hover:bg-secondary-light transition-colors"
          >
            <h3 className="text-lg font-serif font-bold text-text-main tracking-wide">{category}</h3>
            <ChevronDownIcon
              className={`w-5 h-5 text-text-light transition-transform duration-300 ${
                openCategory === category ? 'rotate-180 text-primary' : ''
              }`}
            />
          </button>
          <div
            className="transition-all duration-500 ease-in-out overflow-hidden"
            style={{ maxHeight: openCategory === category ? '1000px' : '0px' }}
          >
            <div className="p-4 bg-secondary-light/30 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3  gap-4">
              {groupedServices[category].map((service) => (
                <div
                  key={service.id}
                  onClick={() => onServiceToggle(service)}
                  className={`p-3 border rounded-xl cursor-pointer transition-all flex flex-row items-center bg-white relative overflow-hidden group ${
                    selectedServiceIds.includes(service.id) 
                      ? 'border-primary ring-1 ring-primary bg-primary/5' 
                      : 'border-secondary-dark/30 hover:border-primary/50 hover:shadow-sm'
                  }`}
                >
                  {/* Selection Indicator */}
                  <div className={`absolute top-0 right-0 p-1 rounded-bl-lg transition-all ${selectedServiceIds.includes(service.id) ? 'bg-primary' : 'bg-transparent'}`}>
                     {selectedServiceIds.includes(service.id) && (
                       <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                         <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                       </svg>
                     )}
                  </div>

                  {service.imageUrl && (
                    <img className="h-16 w-16 rounded-lg object-cover mr-3 shadow-sm" src={service.imageUrl} alt={service.name} />
                  )}
                  <div className="flex-grow">
                    <h4 className={`font-medium text-base mb-1 ${selectedServiceIds.includes(service.id) ? 'text-primary-dark' : 'text-text-main'}`}>{service.name}</h4>
                    <div className="text-sm text-text-light flex flex-wrap items-center gap-x-3 gap-y-1 pt-1 border-t border-dashed border-secondary-dark/30">
                      {(() => {
                        const { price, isPlatinum, originalPrice } = getPriceForUser(service);
                        return (
                          <>
                            <div className="flex items-baseline gap-1">
                              {isPlatinum && <span className="line-through text-xs text-gray-400">NT${originalPrice}</span>}
                              <span className={`font-bold ${isPlatinum ? 'text-accent' : 'text-text-main'}`}>NT${price}</span>
                            </div>
                            <span className="text-xs text-gray-300">|</span>
                            <span className="text-xs">{service.duration} min</span>
                          </>
                        );
                      })()}

                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default ServiceSelector;