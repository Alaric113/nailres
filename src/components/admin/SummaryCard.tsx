import React from 'react';
import { Link } from 'react-router-dom';

interface SummaryCardProps {
  title: string;
  value: string | number;
  unit: string;
  icon: React.ReactNode;
  color: string; // e.g., 'bg-yellow-500'
  linkTo?: string;
  onClick?: () => void;
}

const SummaryCard: React.FC<SummaryCardProps> = ({ title, value, unit, linkTo, icon, color, onClick }) => {
  const content = (
    <div className="p-4 bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow h-full">
      <div className="flex items-center">
        <div className={`p-3 rounded-full text-white ${color}`}>
          {icon}
        </div>
        <div className="ml-4">
          <p className="text-sm font-medium text-gray-500">{title}</p>
          <p className="text-2xl font-bold text-gray-900">
            {value} <span className="text-base font-medium text-gray-600">{unit}</span>
          </p>
        </div>
      </div>
    </div>
  );

  if (linkTo) {
    return <Link to={linkTo} className="block">{content}</Link>;
  }

  return <button onClick={onClick} className="w-full text-left">{content}</button>;
};

export default SummaryCard;