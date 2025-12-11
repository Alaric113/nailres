import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircleIcon, XCircleIcon, InformationCircleIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

interface ToastNotificationProps {
  message: string;
  type: ToastType;
  id: string; // Unique ID for each toast
}

const ToastNotification: React.FC<ToastNotificationProps> = ({ message, type }) => {
  const baseClasses = "fixed top-4 right-4 p-4 rounded-lg shadow-lg flex items-center space-x-3 z-50 pointer-events-auto";

  const typeClasses = {
    success: "bg-green-500 text-white",
    error: "bg-red-500 text-white",
    info: "bg-blue-500 text-white",
    warning: "bg-yellow-500 text-white",
  };

  const Icon = ({ type }: { type: ToastType }) => {
    switch (type) {
      case 'success': return <CheckCircleIcon className="h-6 w-6" />;
      case 'error': return <XCircleIcon className="h-6 w-6" />;
      case 'info': return <InformationCircleIcon className="h-6 w-6" />;
      case 'warning': return <ExclamationTriangleIcon className="h-6 w-6" />;
      default: return null;
    }
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -50, x: 50 }}
      animate={{ opacity: 1, y: 0, x: 0 }}
      exit={{ opacity: 0, y: -50, transition: { duration: 0.2 } }}
      className={`${baseClasses} ${typeClasses[type]}`}
    >
      <Icon type={type} />
      <span className="font-medium">{message}</span>
    </motion.div>
  );
};

export default ToastNotification;