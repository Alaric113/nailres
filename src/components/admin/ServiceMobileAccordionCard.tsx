import React, { useState } from 'react';
import { ChevronDownIcon, ChevronUpIcon, PencilSquareIcon, TrashIcon, EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';
import type { Service } from '../../types/service'; // Adjust path as needed

interface ServiceMobileAccordionCardProps {
  service: Service;
  handleEditClick: (service: Service) => void;
  handleDeleteService: (serviceId: string, serviceName: string) => void;
  handleToggleAvailability: (service: Service) => void;
  isToggling: string | null;
  isDeleting: string | null;
  editingService: Service | null;
}

const ServiceMobileAccordionCard: React.FC<ServiceMobileAccordionCardProps> = ({
  service,
  handleEditClick,
  handleDeleteService,
  handleToggleAvailability,
  isToggling,
  isDeleting,
  editingService,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="bg-white p-4 rounded-xl shadow-sm border border-secondary-dark/50 overflow-hidden">
      {/* Summary Row */}
      <button
        className="flex justify-between items-center w-full focus:outline-none"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center flex-1 min-w-0 pr-2">
          <div className="flex-shrink-0 h-12 w-12 mr-3">
            {service.imageUrl ? (
              <img className="h-12 w-12 rounded-md object-cover border border-secondary-dark/20" src={service.imageUrl} alt={service.name} />
            ) : (
              <div className="h-12 w-12 rounded-md bg-secondary-dark/20 flex items-center justify-center">
                <span className="text-text-light text-xs font-medium">無圖片</span>
              </div>
            )}
          </div>
          <h3 className="font-bold text-lg text-text-main break-words font-serif text-left min-w-0">{service.name}</h3>
        </div>
        {isExpanded ? (
          <ChevronUpIcon className="h-5 w-5 text-gray-500" />
        ) : (
          <ChevronDownIcon className="h-5 w-5 text-gray-500" />
        )}
      </button>

      {/* Expanded Details */}
      {isExpanded && (
        <div className="mt-4 pt-4 border-t border-secondary-light space-y-3">
          <div className="space-y-1 text-sm text-text-light">
            <div><strong className="font-medium text-text-main">分類:</strong> {service.category}</div>
            <div><strong className="font-medium text-text-main">一般價:</strong> ${service.price}</div>
            {service.platinumPrice && (
              <div className="text-accent-hover">
                <strong className="font-medium text-accent">白金價:</strong> ${service.platinumPrice}
              </div>
            )}
            <div><strong className="font-medium text-text-main">時長:</strong> {service.duration} 分鐘</div>
            <div className="flex items-center">
              <strong className="font-medium text-text-main mr-2">狀態:</strong>
              <span className={`px-2 py-1 text-xs font-semibold rounded-full ${service.available ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                {service.available ? '上架中' : '已下架'}
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-2 pt-2 border-t border-secondary-light">
            <button
              onClick={() => handleToggleAvailability(service)}
              disabled={isToggling === service.id}
              className="p-2 rounded-full text-gray-600 hover:bg-secondary-dark/20 transition-colors"
              aria-label={service.available ? '下架服務' : '上架服務'}
            >
              {isToggling === service.id ? (
                '...'
              ) : service.available ? (
                <EyeSlashIcon className="h-5 w-5" />
              ) : (
                <EyeIcon className="h-5 w-5" />
              )}
            </button>
            <button
              onClick={() => handleEditClick(service)}
              disabled={!!editingService || !!isDeleting}
              className="p-2 rounded-full text-primary hover:bg-secondary-dark/20 transition-colors"
              aria-label="編輯服務"
            >
              <PencilSquareIcon className="h-5 w-5" />
            </button>
            <button
              onClick={() => handleDeleteService(service.id, service.name)}
              disabled={isDeleting === service.id || !!editingService}
              className="p-2 rounded-full text-red-500 hover:bg-secondary-dark/20 transition-colors"
              aria-label="刪除服務"
            >
              <TrashIcon className="h-5 w-5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ServiceMobileAccordionCard;
