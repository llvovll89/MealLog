import { createContext } from 'react';

export type ToastType = 'success' | 'error' | 'info' | 'warning';
export const ToastContext = createContext<{addToast: (type: ToastType, message: string) => void} | null>(null);
