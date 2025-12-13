import React from 'react';
import { Loader2 } from 'lucide-react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      children,
      variant = 'primary',
      size = 'md',
      isLoading = false,
      leftIcon,
      rightIcon,
      fullWidth = false,
      className = '',
      disabled,
      ...props
    },
    ref
  ) => {
    // Base styles
    const baseStyles = 'inline-flex items-center justify-center font-medium rounded-xl transition-all duration-200 focus-ring tap-highlight-none disabled:opacity-50 disabled:cursor-not-allowed';
    
    // Variant styles
    const variantStyles = {
      primary: 'bg-primary text-white hover:bg-primary-dark active:scale-95 shadow-soft hover:shadow-medium',
      secondary: 'bg-secondary text-text-main hover:bg-secondary-dark active:scale-95 shadow-soft',
      outline: 'bg-transparent border-2 border-primary text-primary hover:bg-primary hover:text-white active:scale-95',
      ghost: 'bg-transparent text-primary hover:bg-primary/10 active:bg-primary/20',
    };
    
    // Size styles
    const sizeStyles = {
      sm: 'px-3 py-2 text-sm min-h-[36px]',
      md: 'px-4 py-2.5 text-base min-h-[44px]',
      lg: 'px-6 py-3 text-lg min-h-[52px]',
    };
    
    // Width styles
    const widthStyles = fullWidth ? 'w-full' : '';
    
    // Combine all styles
    const combinedStyles = `${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${widthStyles} ${className}`;
    
    return (
      <button
        ref={ref}
        className={combinedStyles}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading && (
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
        )}
        {!isLoading && leftIcon && (
          <span className="mr-2 flex items-center">{leftIcon}</span>
        )}
        {children}
        {!isLoading && rightIcon && (
          <span className="ml-2 flex items-center">{rightIcon}</span>
        )}
      </button>
    );
  }
);

Button.displayName = 'Button';

export default Button;
