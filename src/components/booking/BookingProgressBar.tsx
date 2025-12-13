import { motion } from 'framer-motion';
import { CheckIcon } from '@heroicons/react/24/solid';

interface BookingProgressBarProps {
  currentStep: number;
  totalSteps: number; // NEW PROP
  onStepClick?: (step: number) => void;
}

const BookingProgressBar: React.FC<BookingProgressBarProps> = ({ currentStep, totalSteps, onStepClick }) => {
  // Generate steps dynamically based on totalSteps
  const steps = Array.from({ length: totalSteps }, (_, i) => ({
    id: i + 1,
    name: i + 1 === 1 ? '選擇服務' : i + 1 === 2 ? '選擇設計師' : i + 1 === 3 ? '日期時間' : '確認預約',
  }));

  return (
    <div className="w-full px-4 pt-6 pb-2">
      <div className="relative flex items-center justify-between">
        {/* Progress Line Background */}
        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-gray-200 rounded-full z-0" />
        
        {/* Active Progress Line */}
        <motion.div 
          className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-[#9F9586] rounded-full z-0"
          initial={{ width: '0%' }}
          animate={{ 
            width: `${((currentStep - 1) / (totalSteps - 1)) * 100}%` 
          }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
        />

        {steps.map((step) => {
          const isCompleted = currentStep > step.id;
          const isActive = currentStep === step.id;
          const isClickable = step.id < currentStep;

          return (
            <div key={step.id} className="relative z-10 flex flex-col items-center">
              <motion.button
                onClick={() => isClickable && onStepClick && onStepClick(step.id)}
                disabled={!isClickable}
                className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-colors duration-300
                  ${isActive || isCompleted 
                    ? 'bg-[#9F9586] border-[#9F9586] text-white' 
                    : 'bg-white border-gray-300 text-gray-400'
                  } ${isClickable ? 'cursor-pointer hover:opacity-80' : 'cursor-default'}`}
                initial={false}
                animate={{ scale: isActive ? 1.1 : 1 }}
                whileTap={isClickable ? { scale: 0.95 } : {}}
              >
                {isCompleted ? (
                  <CheckIcon className="w-5 h-5" />
                ) : (
                  <span className="text-sm font-medium">{step.id}</span>
                )}
              </motion.button>
              
              <span className={`absolute top-9 text-[10px] whitespace-nowrap font-medium transition-colors duration-300
                ${isActive || isCompleted ? 'text-[#9F9586]' : 'text-gray-400'}`}>
                {step.name}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default BookingProgressBar;