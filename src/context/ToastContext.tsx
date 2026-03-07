import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';

type ToastType = 'success' | 'error' | 'info' | 'warning';

interface ToastItem {
  id: string;
  type: ToastType;
  message: string;
}

interface ToastContextValue {
  addToast: (type: ToastType, message: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const ICONS: Record<ToastType, string> = {
  success: '✅',
  error: '❌',
  info: 'ℹ️',
  warning: '⚠️',
};

const BG: Record<ToastType, string> = {
  success: 'bg-green-600',
  error: 'bg-red-600',
  info: 'bg-gray-700',
  warning: 'bg-yellow-500',
};

const ToastContainer = ({
  toasts,
  onDismiss,
}: {
  toasts: ToastItem[];
  onDismiss: (id: string) => void;
}) => {
  if (toasts.length === 0) return null;
  return (
    <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-2 pointer-events-none">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`${BG[t.type]} text-white px-4 py-3 rounded-xl shadow-md flex items-center gap-2 text-sm font-medium animate-slide-up pointer-events-auto max-w-xs cursor-pointer`}
          onClick={() => onDismiss(t.id)}
        >
          <span>{ICONS[t.type]}</span>
          <span className="flex-1">{t.message}</span>
        </div>
      ))}
    </div>
  );
};

export const ToastProvider = ({ children }: { children: ReactNode }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const addToast = useCallback((type: ToastType, message: string) => {
    const id = crypto.randomUUID();
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3000);
  }, []);

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}
      <ToastContainer toasts={toasts} onDismiss={dismiss} />
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return {
    success: (msg: string) => ctx.addToast('success', msg),
    error: (msg: string) => ctx.addToast('error', msg),
    info: (msg: string) => ctx.addToast('info', msg),
    warning: (msg: string) => ctx.addToast('warning', msg),
  };
};
