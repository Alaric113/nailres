import React from 'react';
import { useServices } from '../../hooks/useServices';
import type { Service } from '../../types/service';
import { useAuthStore } from '../../store/authStore';
import LoadingSpinner from '../common/LoadingSpinner';

interface ServiceSelectorProps {
  onServiceSelect: (service: Service) => void;
  selectedServiceId?: string | null;
}

const ServiceSelector: React.FC<ServiceSelectorProps> = ({ onServiceSelect, selectedServiceId }) => {
  const { services, isLoading, error } = useServices();
  const { userProfile } = useAuthStore();

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

  return (
    <div className="space-y-3">
      {services.filter(s => s.available).map((service) => (
        <div
          key={service.id}
          onClick={() => onServiceSelect(service)}
          className={`p-4 border rounded-lg cursor-pointer transition-all ${
            selectedServiceId === service.id ? 'bg-pink-100 border-pink-500 ring-2 ring-pink-500' : 'bg-white border-gray-200 hover:border-pink-300'
          }`}
        >
          <h3 className="font-semibold text-lg">{service.name}</h3>
          <div className="text-sm text-gray-600 flex items-center gap-2">
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
      ))}
    </div>
  );
};

export default ServiceSelector;