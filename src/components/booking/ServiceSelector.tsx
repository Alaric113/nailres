import React from 'react';
import { useServices } from '../../hooks/useServices';
import type { Service } from '../../types/service';
import LoadingSpinner from '../common/LoadingSpinner';

interface ServiceSelectorProps {
  onServiceSelect: (service: Service) => void;
  selectedServiceId?: string | null;
}

const ServiceSelector: React.FC<ServiceSelectorProps> = ({ onServiceSelect, selectedServiceId }) => {
  const { services, isLoading, error } = useServices();

  if (isLoading) {
    return <div className="flex justify-center p-4"><LoadingSpinner /></div>;
  }

  if (error) {
    return <p className="text-red-500">{error}</p>;
  }

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
          <p className="text-sm text-gray-600">價格: ${service.price} | 時長: {service.duration} 分鐘</p>
        </div>
      ))}
    </div>
  );
};

export default ServiceSelector;