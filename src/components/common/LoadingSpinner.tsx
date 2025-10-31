interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  text?: string;
  fullScreen?: boolean;
  color?: 'pink' | 'indigo' | 'teal' | 'purple';
}

const LoadingSpinner = ({ 
  size = 'md', 
  text, 
  fullScreen = false,
  color = 'pink'
}: LoadingSpinnerProps) => {
  const sizeClasses = {
    sm: 'w-8 h-8 border-2',
    md: 'w-12 h-12 border-3',
    lg: 'w-16 h-16 border-4',
    xl: 'w-24 h-24 border-4'
  };

  const colorClasses = {
    pink: 'border-pink-500',
    indigo: 'border-indigo-600',
    teal: 'border-teal-500',
    purple: 'border-purple-600'
  };

  const spinner = (
    <div className="flex flex-col items-center justify-center gap-4">
      {/* Main Spinner */}
      <div className="relative">
        {/* Outer ring */}
        <div className={`${sizeClasses[size]} border-gray-200 rounded-full`}></div>
        {/* Spinning part */}
        <div 
          className={`absolute inset-0 ${sizeClasses[size]} ${colorClasses[color]} border-t-transparent rounded-full animate-spin`}
        ></div>
        {/* Inner pulse */}
        <div className={`absolute inset-0 ${sizeClasses[size]} ${colorClasses[color]} rounded-full opacity-20 animate-ping`}></div>
      </div>

      {/* Loading Text */}
      {text && (
        <div className="text-center">
          <p className="text-gray-600 font-medium animate-pulse">{text}</p>
        </div>
      )}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        {spinner}
      </div>
    );
  }

  return spinner;
};

export default LoadingSpinner;