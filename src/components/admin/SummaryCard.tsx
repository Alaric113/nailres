import { Link } from 'react-router-dom';
import type { ReactNode } from 'react';

interface SummaryCardProps {
  title: string;
  value: string | number;
  unit?: string;
  linkTo?: string;
  onClick?: () => void;
  icon?: ReactNode;
  color?: string; // This will now apply to the card's accent area
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
  color = 'bg-primary', // Default primary color
  urgent = false,
  subtext
}: SummaryCardProps) => {
  const cardContent = (
    <div className={`
      relative h-full flex flex-col justify-between p-5 rounded-xl
      ${urgent ? 'bg-gradient-to-br from-white via-white to-red-50' : 'bg-white'}
      transition-all duration-300
    `}>
      {/* Icon and Title */}
      <div className="flex items-center justify-between mb-4">
        {/* Icon */}
        {icon && (
          <div className={`p-3 rounded-full text-white ${color} shadow-lg transition-transform group-hover:scale-105`}>
            {icon}
          </div>
        )}
        <h3 className="text-sm font-serif font-bold text-text-light tracking-wide uppercase text-right">
          {title}
        </h3>
      </div>

      {/* Value and Unit */}
      {value !== '' && (
        <div className="flex flex-col items-end mt-auto">
          <div className="flex items-baseline gap-1">
            <span className={`text-4xl font-sans font-bold tracking-tight ${urgent ? 'text-red-600' : 'text-text-main'}`}>
              {value}
            </span>
            {unit && (
              <span className="text-sm text-text-light font-medium ml-1">
                {unit}
              </span>
            )}
          </div>
          {subtext && (
            <p className="text-xs text-text-light/80 mt-1 text-right">
              {subtext}
            </p>
          )}
        </div>
      )}

      {/* Action Indicator */}
      {(linkTo || onClick) && (
        <div className={`mt-4 pt-3 border-t ${urgent ? 'border-red-200' : 'border-secondary-light/60'} flex items-center justify-end opacity-60 group-hover:opacity-100 transition-opacity`}>
          <span className="text-[10px] font-medium text-text-light tracking-wider mr-2">
            {onClick ? 'CONFIGURE' : 'VIEW DETAILS'}
          </span>
          <svg 
            className={`w-3 h-3 ${urgent ? 'text-red-500' : 'text-primary'} group-hover:translate-x-1 transition-transform`} 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </div>
      )}

      {/* Urgent Badge */}
      {urgent && (
        <div className="absolute top-2 left-2 z-10">
          <span className="flex items-center gap-1 px-2.5 py-1 bg-red-500 text-white text-[10px] font-bold rounded-full animate-pulse tracking-wider shadow-md">
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            URGENT
          </span>
        </div>
      )}
    </div>
  );

  const containerClasses = `
    block h-full rounded-2xl border 
    ${urgent ? 'border-red-300 shadow-lg' : 'border-secondary-dark/30 hover:border-primary/40'} 
    hover:shadow-md transition-all duration-300 overflow-hidden
  `;

  if (onClick) {
    return (
      <button
        onClick={onClick}
        className={`${containerClasses} w-full text-left focus:outline-none focus:ring-2 focus:ring-red-200`}
      >
        {cardContent}
      </button>
    );
  }

  if (linkTo) {
    return (
      <Link
        to={linkTo}
        className={`${containerClasses} focus:outline-none focus:ring-2 ${urgent ? 'focus:ring-red-200' : 'focus:ring-primary/20'}`}
      >
        {cardContent}
      </Link>
    );
  }

  return (
    <div className={containerClasses}>
      {cardContent}
    </div>
  );
};

export default SummaryCard;