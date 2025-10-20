import { useServices } from '../../hooks/useServices';
import type { Service } from '../../types/service';

interface ServiceSelectorProps {
  selectedServiceId: string | null;
  onServiceSelect: (service: Service) => void;
}

const ServiceSelector = ({ selectedServiceId, onServiceSelect }: ServiceSelectorProps) => {
  const { services, isLoading, error } = useServices();

  if (isLoading) {
    return <div className="text-gray-500">Loading services...</div>;
  }

  if (error) {
    return <div className="text-red-500">{error}</div>;
  }

  return (
    <div>
      <label htmlFor="service" className="block text-sm font-medium text-gray-700">
        Select a Service
      </label>
      <select
        id="service"
        name="service"
        className="w-full px-3 py-2 mt-1 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
        value={selectedServiceId || ''}
        onChange={(e) => {
          const service = services.find(s => s.id === e.target.value);
          if (service) onServiceSelect(service);
        }}
      >
        <option value="" disabled>-- Please choose a service --</option>
        {services.map((service) => (
          <option key={service.id} value={service.id}>
            {service.name} - ${service.price} ({service.duration} min)
          </option>
        ))}
      </select>
    </div>
  );
};

export default ServiceSelector;