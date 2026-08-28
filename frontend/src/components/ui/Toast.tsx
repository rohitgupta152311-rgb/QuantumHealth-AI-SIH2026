import React from 'react';
import { AlertTriangle, CheckCircle, Info, X, XCircle } from 'lucide-react';
import type { ToastMessage } from '../../types';

interface ToastProps extends ToastMessage {
  onClose: (id: string) => void;
}

export const Toast: React.FC<ToastProps> = ({ id, type, message, onClose }) => {
  const icons = {
    success: <CheckCircle className="text-green-400" />,
    error: <XCircle className="text-red-400" />,
    info: <Info className="text-blue-400" />,
    warning: <AlertTriangle className="text-yellow-400" />,
  };

  const bgs = {
    success: 'bg-green-500/10 border-green-500/20',
    error: 'bg-red-500/10 border-red-500/20',
    info: 'bg-blue-500/10 border-blue-500/20',
    warning: 'bg-yellow-500/10 border-yellow-500/20',
  };

  return (
    <div className={`pointer-events-auto flex w-full max-w-md rounded-lg border shadow-lg ${bgs[type]}`}>
      <div className="flex w-0 flex-1 items-center p-4">
        <div className="flex-shrink-0">{icons[type]}</div>
        <div className="ml-3 flex-1 text-sm font-medium text-gray-200">{message}</div>
      </div>
      <div className="flex border-l border-gray-700/50">
        <button
          onClick={() => onClose(id)}
          className="flex w-full items-center justify-center rounded-none rounded-r-lg border border-transparent p-4 text-sm font-medium text-gray-400 hover:text-gray-300"
        >
          <X className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
};
