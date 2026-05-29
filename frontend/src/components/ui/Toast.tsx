import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { CheckCircle, XCircle, AlertCircle, Info, X } from 'lucide-react';
import { cn } from '@/utils/cn';

type ToastType = 'success' | 'error' | 'warning' | 'info';

interface Toast {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
}

interface ToastContextType {
  toast: (type: ToastType, title: string, message?: string) => void;
  success: (title: string, message?: string) => void;
  error: (title: string, message?: string) => void;
  warning: (title: string, message?: string) => void;
  info: (title: string, message?: string) => void;
}

const ToastContext = createContext<ToastContextType | null>(null);

const icons = { success: CheckCircle, error: XCircle, warning: AlertCircle, info: Info };
const styles = {
  success: 'border-emerald-500/30 bg-emerald-500/10',
  error: 'border-red-500/30 bg-red-500/10',
  warning: 'border-yellow-500/30 bg-yellow-500/10',
  info: 'border-neon-blue/30 bg-neon-blue/10',
};
const iconStyles = {
  success: 'text-emerald-400', error: 'text-red-400',
  warning: 'text-yellow-400', info: 'text-neon-blue',
};

export const ToastProvider = ({ children }: { children: ReactNode }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const remove = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback((type: ToastType, title: string, message?: string) => {
    const id = Date.now().toString();
    setToasts((prev) => [...prev, { id, type, title, message }]);
    setTimeout(() => remove(id), 4000);
  }, [remove]);

  const success = useCallback((t: string, m?: string) => toast('success', t, m), [toast]);
  const error = useCallback((t: string, m?: string) => toast('error', t, m), [toast]);
  const warning = useCallback((t: string, m?: string) => toast('warning', t, m), [toast]);
  const info = useCallback((t: string, m?: string) => toast('info', t, m), [toast]);

  return (
    <ToastContext.Provider value={{ toast, success, error, warning, info }}>
      {children}
      <div className="fixed top-4 right-4 z-[100] flex flex-col gap-3 pointer-events-none">
        {toasts.map((t) => {
          const Icon = icons[t.type];
          return (
            <div
              key={t.id}
              className={cn('pointer-events-auto flex items-start gap-3 p-4 rounded-xl border backdrop-blur-md shadow-glass min-w-[300px] max-w-sm animate-slide-up', styles[t.type])}
            >
              <Icon className={cn('shrink-0 mt-0.5', iconStyles[t.type])} size={18} />
              <div className="flex-1">
                <p className="font-semibold text-white text-sm">{t.title}</p>
                {t.message && <p className="text-gray-400 text-xs mt-0.5">{t.message}</p>}
              </div>
              <button onClick={() => remove(t.id)} className="shrink-0 text-gray-500 hover:text-white transition-colors">
                <X size={16} />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
};
