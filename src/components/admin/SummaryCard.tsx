import { Link } from 'react-router-dom';
import type { ReactNode } from 'react';

interface SummaryCardProps {
  title: string;
  value: string | number;
  unit?: string;
  linkTo?: string;
  onClick?: () => void;
  icon?: ReactNode;
  color?: string;
  urgent?: boolean;
  subtext?: string;
}

const SummaryCard = ({ 
  title, 
  value, 
  unit = '', 
  linkTo, 
  onClick, 
  icon, 
  color = 'bg-gray-500',
  urgent = false,
  subtext
}: SummaryCardProps) => {
  const cardContent = (
    <div className="overflow-hidden group h-full flex flex-col">
      {/* Urgent Badge */}
      {urgent && (
        <div className="absolute top-2 right-2 z-10">
          <span className="flex items-center gap-1 px-2 py-1 bg-red-500 text-white text-xs font-bold rounded-full animate-pulse">
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            注意
          </span>
        </div>
      )}

      {/* Color Bar */}
      <div className={`h-1.5 ${color} rounded-t-xl`}></div>
      
      {/* Card Body */}
      <div className="p-4 sm:p-5 bg-white flex-grow flex flex-col justify-between">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <p className="text-lg font-medium text-gray-600 mb-1 leading-tight">
              {title}
            </p>
            {value !== '' && (
              <div className="flex items-baseline gap-1">
                <span className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900">
                  {value}
                </span>
                {unit && (
                  <span className="text-sm sm:text-base text-gray-500 font-medium">
                    {unit}
                  </span>
                )}
              </div>
            )}
            {subtext && (
              <p className="text-xs text-gray-500 mt-1">
                {subtext}
              </p>
            )}
          </div>
          
          {/* Icon */}
          {icon && (
            <div className={`${color} p-3 rounded-xl text-white flex-shrink-0 group-hover:scale-110 transition-transform duration-300`}>
              {icon}
            </div>
          )}
        </div>

        {/* Action Indicator */}
        {(linkTo || onClick) && (
          <div className="flex items-center justify-between pt-3 border-t border-gray-100">
            <span className="text-xs font-medium text-gray-500 group-hover:text-gray-700 transition-colors">
              {onClick ? '點擊設定' : '查看詳情'}
            </span>
            <svg 
              className="w-4 h-4 text-gray-400 group-hover:text-gray-600 group-hover:translate-x-1 transition-all" 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </div>
        )}
      </div>
    </div>
  );

  if (onClick) {
    return (
      <button
        onClick={onClick}
        className="block w-full h-full text-left rounded-xl shadow-md hover:shadow-xl border-2 border-gray-100 hover:border-gray-200 transition-all duration-300 transform hover:-translate-y-1 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:ring-offset-2"
      >
        {cardContent}
      </button>
    );
  }

  if (linkTo) {
    return (
      <Link
        to={linkTo}
        className="block h-full rounded-xl shadow-md hover:shadow-xl border-2 border-gray-100 hover:border-gray-200 transition-all duration-300 transform hover:-translate-y-1 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:ring-offset-2"
      >
        {cardContent}
      </Link>
    );
  }

  return (
    <div className="h-full rounded-xl shadow-md border-2 border-gray-100">
      {cardContent}
    </div>
  );
};

export default SummaryCard;