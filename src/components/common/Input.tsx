import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      error,
      helperText,
      leftIcon,
      rightIcon,
      fullWidth = false,
      type = 'text',
      className = '',
      id,
      ...props
    },
    ref
  ) => {
    const [showPassword, setShowPassword] = useState(false);
    const [isFocused, setIsFocused] = useState(false);
    
    const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`;
    const isPassword = type === 'password';
    const actualType = isPassword && showPassword ? 'text' : type;
    
    // Base styles
    const containerStyles = fullWidth ? 'w-full' : '';
    const inputBaseStyles = 'w-full px-4 py-2.5 text-base bg-white border rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed tap-highlight-none';
    
    // State-dependent styles
    const borderStyles = error 
      ? 'border-red-500' 
      : isFocused 
        ? 'border-primary' 
        : 'border-secondary-dark';
    
    // Padding adjustments for icons
    const paddingStyles = `${leftIcon ? 'pl-11' : ''} ${rightIcon || isPassword ? 'pr-11' : ''}`;
    
    const combinedInputStyles = `${inputBaseStyles} ${borderStyles} ${paddingStyles} ${className}`;
    
    return (
      <div className={containerStyles}>
        {label && (
          <label 
            htmlFor={inputId}
            className={`block text-sm font-medium mb-1.5 transition-colors ${
              error ? 'text-red-600' : 'text-text-main'
            }`}
          >
            {label}
          </label>
        )}
        
        <div className="relative">
          {leftIcon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-text-light pointer-events-none">
              {leftIcon}
            </div>
          )}
          
          <input
            ref={ref}
            id={inputId}
            type={actualType}
            className={combinedInputStyles}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            aria-invalid={error ? 'true' : 'false'}
            aria-describedby={error ? `${inputId}-error` : helperText ? `${inputId}-helper` : undefined}
            {...props}
          />
          
          {isPassword && (
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-text-light hover:text-primary transition-colors focus-ring-inset p-1 rounded"
              aria-label={showPassword ? '隱藏密碼' : '顯示密碼'}
              tabIndex={-1}
            >
              {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          )}
          
          {!isPassword && rightIcon && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-text-light pointer-events-none">
              {rightIcon}
            </div>
          )}
        </div>
        
        {error && (
          <p id={`${inputId}-error`} className="mt-1.5 text-sm text-red-600">
            {error}
          </p>
        )}
        
        {!error && helperText && (
          <p id={`${inputId}-helper`} className="mt-1.5 text-sm text-text-light">
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

export default Input;
