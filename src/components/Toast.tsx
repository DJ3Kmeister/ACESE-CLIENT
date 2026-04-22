import type { ToastMessage } from '../types';
import { CheckCircle, XCircle, Info } from 'lucide-react';

interface ToastProps {
  message: ToastMessage;
}

export function Toast({ message }: ToastProps) {
  const styles = {
    success: 'bg-green-50 border-green-400 text-green-800',
    error: 'bg-red-50 border-red-400 text-red-800',
    info: 'bg-blue-50 border-blue-400 text-blue-800',
  };

  const icons = {
    success: <CheckCircle size={18} className="text-green-500" />,
    error: <XCircle size={18} className="text-red-500" />,
    info: <Info size={18} className="text-blue-500" />,
  };

  return (
    <div className={`flex items-center gap-2 px-4 py-3 rounded-lg border shadow-lg min-w-[280px] max-w-sm animate-slide-down ${styles[message.type]}`}>
      {icons[message.type]}
      <span className="text-sm font-medium">{message.text}</span>
    </div>
  );
}
