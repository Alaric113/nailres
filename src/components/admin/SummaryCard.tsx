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
  color = 'bg-primary',
  urgent = false,
  subtext
}: SummaryCardProps) => {
  const cardContent = (
    <div className="relative h-full flex flex-col overflow-hidden group">
      {/* Urgent Badge */}
      {urgent && (
        <div className="absolute top-3 right-3 z-10">
          <span className="flex items-center gap-1 px-2 py-0.5 bg-accent text-white text-[10px] font-medium rounded-full animate-pulse tracking-wider">
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            ACTION
          </span>
        </div>
      )}
      
      {/* Card Body */}
      <div className="p-5 bg-white flex-grow flex flex-col justify-between transition-colors duration-300">
        <div className="flex items-start justify-between mb-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <div className={`w-1.5 h-1.5 rounded-full ${color}`}></div>
              <h3 className="text-sm font-serif font-bold text-text-light tracking-wide uppercase">
                {title}
              </h3>
            </div>
            
            {value !== '' && (
              <div className="flex items-baseline gap-1 mt-1">
                <span className="text-3xl font-sans font-bold text-text-main tracking-tight">
                  {value}
                </span>
                {unit && (
                  <span className="text-xs text-text-light font-medium ml-1">
                    {unit}
                  </span>
                )}
              </div>
            )}
            {subtext && (
              <p className="text-xs text-text-light/80 mt-1 truncate">
                {subtext}
              </p>
            )}
          </div>
          
          {/* Icon */}
          {icon && (
            <div className={`text-text-light/30 group-hover:text-primary transition-colors duration-300 p-2 bg-secondary-light/50 rounded-lg`}>
              {icon}
            </div>
          )}
        </div>

        {/* Action Indicator */}
        {(linkTo || onClick) && (
          <div className="mt-4 pt-3 border-t border-secondary-light/60 flex items-center justify-between opacity-60 group-hover:opacity-100 transition-opacity">
            <span className="text-[10px] font-medium text-text-light tracking-wider">
              {onClick ? 'CONFIGURE' : 'VIEW DETAILS'}
            </span>
            <svg 
              className="w-3 h-3 text-primary group-hover:translate-x-1 transition-transform" 
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

  const containerClasses = "block h-full rounded-xl border border-secondary-dark/30 hover:border-primary/40 hover:shadow-md transition-all duration-300 bg-white overflow-hidden";

  if (onClick) {
    return (
      <button
        onClick={onClick}
        className={`${containerClasses} w-full text-left focus:outline-none focus:ring-2 focus:ring-primary/20`}
      >
        {cardContent}
      </button>
    );
  }

  if (linkTo) {
    return (
      <Link
        to={linkTo}
        className={`${containerClasses} focus:outline-none focus:ring-2 focus:ring-primary/20`}
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