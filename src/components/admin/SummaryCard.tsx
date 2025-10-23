import React from 'react';
import { Link } from 'react-router-dom';

interface SummaryCardProps {
  title: string;
  value: string | number;
  unit: string;
  linkTo: string;
  icon: React.ReactNode;
  color: string; // e.g., 'bg-yellow-500'
}

const SummaryCard: React.FC<SummaryCardProps> = ({ title, value, unit, linkTo, icon, color }) => {
  return (
    <Link to={linkTo} className="block p-4 bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow">
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
    </Link>
  );
};

export default SummaryCard;