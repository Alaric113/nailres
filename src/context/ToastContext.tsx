import React, { createContext, useContext, useState, useCallback } from 'react';
import type { ReactNode } from 'react';
import { v4 as uuidv4 } from 'uuid';
import ToastNotification, { type ToastType } from '../components/common/ToastNotification';
import { AnimatePresence } from 'framer-motion';

interface Toast {
  id: string;
  message: string;
  type: ToastType;
  duration?: number; // Milliseconds
}

interface ToastContextType {
  showToast: (message: string, type?: ToastType, duration?: number) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((message: string, type: ToastType = 'info', duration: number = 3000) => {
    const id = uuidv4();
    const newToast: Toast = { id, message, type, duration };
    setToasts((prevToasts) => [...prevToasts, newToast]);

    setTimeout(() => {
      setToasts((prevToasts) => prevToasts.filter((toast) => toast.id !== id));
    }, duration);
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="fixed top-20 right-0 p-4 z-[9999] flex flex-col-reverse items-end space-y-3 space-y-reverse">
        <AnimatePresence>
          {toasts.map((toast) => (
            <ToastNotification key={toast.id} {...toast} />
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (context === undefined) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};
