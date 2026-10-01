import { useContext } from 'react';
import { ToastContext } from '../context/toast';

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToast must be used within ToastProvider');
  return {
    success: (message: string) => context.addToast('success', message),
    error: (message: string) => context.addToast('error', message),
    info: (message: string) => context.addToast('info', message),
    warning: (message: string) => context.addToast('warning', message),
  };
};
