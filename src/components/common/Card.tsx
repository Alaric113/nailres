import React from 'react';

export interface CardProps {
  children: React.ReactNode;
  variant?: 'default' | 'elevated' | 'outlined';
  hoverable?: boolean;
  clickable?: boolean;
  onClick?: () => void;
  header?: React.ReactNode;
  footer?: React.ReactNode;
  image?: string;
  imageAlt?: string;
  className?: string;
}

const Card: React.FC<CardProps> = ({
  children,
  variant = 'default',
  hoverable = false,
  clickable = false,
  onClick,
  header,
  footer,
  image,
  imageAlt = '',
  className = '',
}) => {
  // Base styles
  const baseStyles = 'bg-white rounded-2xl transition-all duration-200 tap-highlight-none';
  
  // Variant styles
  const variantStyles = {
    default: 'border border-secondary-dark',
    elevated: 'shadow-soft',
    outlined: 'border-2 border-primary/20',
  };
  
  // Interactive styles
  const interactiveStyles = hoverable || clickable
    ? 'hover:shadow-medium'
    : '';
  
  const cursorStyles = clickable ? 'cursor-pointer' : '';
  
  // Focus styles for clickable cards
  const focusStyles = clickable ? 'focus-ring' : '';
  
  // Combine all styles
  const combinedStyles = `${baseStyles} ${variantStyles[variant]} ${interactiveStyles} ${cursorStyles} ${focusStyles} ${className}`;
  
  // Wrapper component - div or button based on clickability
  const Wrapper = clickable ? 'button' : 'div';
  const wrapperProps = clickable
    ? {
        onClick,
        type: 'button' as const,
        className: `${combinedStyles} w-full text-left`,
      }
    : {
        className: combinedStyles,
      };
  
  return (
    <Wrapper {...wrapperProps}>
      {image && (
        <div className="relative w-full h-48 overflow-hidden rounded-t-2xl">
          <img
            src={image}
            alt={imageAlt}
            className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
            loading="lazy"
          />
        </div>
      )}
      
      {header && (
        <div className="px-6 py-4 border-b border-secondary-dark">
          {header}
        </div>
      )}
      
      <div className="p-6">
        {children}
      </div>
      
      {footer && (
        <div className="px-6 py-4 border-t border-secondary-dark bg-secondary-light rounded-b-2xl">
          {footer}
        </div>
      )}
    </Wrapper>
  );
};

export default Card;
