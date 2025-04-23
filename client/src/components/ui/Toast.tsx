import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useTheme } from '../theme/ThemeProvider';

// Toast types
export type ToastType = 'success' | 'error' | 'warning' | 'info';

// Toast item interface
interface ToastItem {
  id: string;
  message: string;
  type: ToastType;
  duration: number;
}

// Toast context
export const ToastContext = React.createContext<{
  showToast: (message: string, type?: ToastType, duration?: number) => void;
}>({
  showToast: () => {},
});

// Toast provider
export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  
  // Show toast
  const showToast = (
    message: string,
    type: ToastType = 'info',
    duration: number = 3000
  ) => {
    const id = Math.random().toString(36).substring(2, 9);
    const newToast = { id, message, type, duration };
    setToasts((prevToasts) => [...prevToasts, newToast]);
    
    // Auto remove
    setTimeout(() => {
      removeToast(id);
    }, duration);
  };
  
  // Remove toast
  const removeToast = (id: string) => {
    setToasts((prevToasts) => prevToasts.filter((toast) => toast.id !== id));
  };
  
  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {createPortal(
        <ToastContainer toasts={toasts} removeToast={removeToast} />,
        document.body
      )}
    </ToastContext.Provider>
  );
};

// Toast container
const ToastContainer: React.FC<{
  toasts: ToastItem[];
  removeToast: (id: string) => void;
}> = ({ toasts, removeToast }) => {
  if (toasts.length === 0) return null;
  
  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
      {toasts.map((toast) => (
        <ToastMessage
          key={toast.id}
          toast={toast}
          onClose={() => removeToast(toast.id)}
        />
      ))}
    </div>
  );
};

// Toast message
const ToastMessage: React.FC<{
  toast: ToastItem;
  onClose: () => void;
}> = ({ toast, onClose }) => {
  const { colors } = useTheme();
  const [isExiting, setIsExiting] = useState(false);
  
  // Handle animation
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsExiting(true);
    }, toast.duration - 300);
    
    return () => clearTimeout(timer);
  }, [toast.duration]);
  
  // Get toast style based on type
  const getToastStyle = () => {
    switch (toast.type) {
      case 'success':
        return {
          background: `linear-gradient(135deg, ${colors.background.card}, rgba(12, 223, 154, 0.1))`,
          borderLeft: `4px solid ${colors.success}`,
          icon: (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-6 w-6 text-green-500"
            >
              <path d="M22 11.08V12a10 10 0 11-5.93-9.14"></path>
              <polyline points="22 4 12 14.01 9 11.01"></polyline>
            </svg>
          )
        };
      case 'error':
        return {
          background: `linear-gradient(135deg, ${colors.background.card}, rgba(255, 94, 94, 0.1))`,
          borderLeft: `4px solid ${colors.error}`,
          icon: (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-6 w-6 text-red-500"
            >
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="15" y1="9" x2="9" y2="15"></line>
              <line x1="9" y1="9" x2="15" y2="15"></line>
            </svg>
          )
        };
      case 'warning':
        return {
          background: `linear-gradient(135deg, ${colors.background.card}, rgba(255, 179, 71, 0.1))`,
          borderLeft: `4px solid ${colors.warning}`,
          icon: (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-6 w-6 text-yellow-500"
            >
              <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"></path>
              <line x1="12" y1="9" x2="12" y2="13"></line>
              <line x1="12" y1="17" x2="12.01" y2="17"></line>
            </svg>
          )
        };
      case 'info':
      default:
        return {
          background: `linear-gradient(135deg, ${colors.background.card}, rgba(12, 190, 223, 0.1))`,
          borderLeft: `4px solid ${colors.info}`,
          icon: (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-6 w-6 text-blue-500"
            >
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="16" x2="12" y2="12"></line>
              <line x1="12" y1="8" x2="12.01" y2="8"></line>
            </svg>
          )
        };
    }
  };
  
  const style = getToastStyle();
  
  return (
    <div
      className={`flex items-center p-4 rounded-lg shadow-lg max-w-md transition-all duration-300 ${
        isExiting ? 'opacity-0 translate-x-6' : 'opacity-100'
      }`}
      style={{
        background: style.background,
        borderLeft: style.borderLeft
      }}
    >
      <div className="flex-shrink-0 mr-3">{style.icon}</div>
      <div className="flex-grow mr-2">
        <p className="text-sm font-medium text-white">{toast.message}</p>
      </div>
      <button
        onClick={onClose}
        className="flex-shrink-0 p-1 rounded-full hover:bg-gray-700 transition-colors"
      >
        <svg
          className="w-4 h-4 text-gray-400"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <line x1="18" y1="6" x2="6" y2="18"></line>
          <line x1="6" y1="6" x2="18" y2="18"></line>
        </svg>
      </button>
    </div>
  );
};

// Export a hook to use the toast
export const useToast = () => {
  const context = React.useContext(ToastContext);
  if (context === undefined) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

// Default export - combined component with provider for simpler usage
const Toast: React.FC = () => {
  return null; // The actual toasts are rendered via portal
};

export default Toast;