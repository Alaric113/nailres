import React, { useState, useEffect } from 'react';
import { useServices } from '../../hooks/useServices';
import type { Service } from '../../types/service';
import { useAuthStore } from '../../store/authStore';
import LoadingSpinner from '../common/LoadingSpinner';

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
        <div key={category} className="border border-gray-200 rounded-lg overflow-hidden">
          <button
            onClick={() => handleCategoryClick(category)}
            className="w-full p-4 text-left flex justify-between items-center bg-white hover:bg-gray-50 transition-colors"
          >
            <h3 className="text-xl font-bold text-gray-700">{category}</h3>
            <svg
              className={`w-6 h-6 text-gray-500 transition-transform duration-300 ${
                openCategory === category ? 'rotate-180' : ''
              }`}
              fill="none" viewBox="0 0 24 24" stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          <div
            className="transition-all duration-500 ease-in-out overflow-hidden"
            style={{ maxHeight: openCategory === category ? '1000px' : '0px' }}
          >
            <div className="p-4 bg-gray-50/50 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {groupedServices[category].map((service) => (
                <div
                  key={service.id}
                  onClick={() => onServiceToggle(service)}
                  className={`p-3 border rounded-lg cursor-pointer transition-all flex flex-row bg-white ${
                    selectedServiceIds.includes(service.id) ? 'border-pink-500 ring-2 ring-pink-500' : 'border-gray-200 hover:border-pink-300'
                  }`}
                >
                  <img className="h-14 w-14 rounded-md object-cover mr-2" src={service.imageUrl || 'https://via.placeholder.j6/150'} alt={service.name} />
                  <div>
                    <h4 className="font-semibold text-lg flex-grow">{service.name}</h4>
                    <div className="text-sm text-gray-600 flex items-center gap-2 mt-2 pt-2 border-t border-gray-100">
                      {(() => {
                        const { price, isPlatinum, originalPrice } = getPriceForUser(service);
                        return (
                          <>
                            <span>價格:</span>
                            {isPlatinum && <span className="line-through text-gray-400">${originalPrice}</span>}
                            <span className={`font-bold ${isPlatinum ? 'text-yellow-600' : 'text-gray-800'}`}>${price}</span>
                            <span>|</span>
                            <span>時長: {service.duration} 分鐘</span>
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