import React, { useEffect } from 'react';
import { ToastMessage } from '../types';

interface ToastProps {
  toast: ToastMessage;
  onClose: (id: string) => void;
}

export const Toast: React.FC<ToastProps> = ({ toast, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose(toast.id);
    }, 5000);
    return () => clearTimeout(timer);
  }, [toast.id, onClose]);

  const bgColors = {
    info: 'bg-twitch-surface border-twitch-light',
    success: 'bg-green-900 border-green-500',
    warning: 'bg-yellow-900 border-yellow-500',
    error: 'bg-red-900 border-red-500',
  };

  return (
    <div className={`mb-3 p-4 rounded-md border-l-4 shadow-lg flex items-start justify-between min-w-[300px] animate-fade-in-up ${bgColors[toast.type]}`}>
      <div>
        <h4 className="font-bold text-sm text-white mb-1">{toast.title}</h4>
        <p className="text-xs text-gray-300">{toast.message}</p>
      </div>
      <button 
        onClick={() => onClose(toast.id)}
        className="text-gray-400 hover:text-white ml-4"
      >
        ✕
      </button>
    </div>
  );
};
