import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { clsx } from 'clsx';

export type ToastVariant = 'info' | 'success' | 'warning' | 'error';

export interface Toast {
  id: string;
  variant: ToastVariant;
  title?: string;
  message: string;
  duration?: number;
}

interface ToastContextValue {
  toasts: Toast[];
  push: (t: Omit<Toast, 'id'>) => string;
  dismiss: (id: string) => void;
  error: (message: string, title?: string) => string;
  success: (message: string, title?: string) => string;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within a ToastProvider');
  return ctx;
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const dismiss = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const push = useCallback((t: Omit<Toast, 'id'>): string => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    setToasts(prev => [...prev, { ...t, id }]);
    return id;
  }, []);

  const error = useCallback((message: string, title?: string) =>
    push({ variant: 'error', message, title, duration: 8000 }), [push]);
  const success = useCallback((message: string, title?: string) =>
    push({ variant: 'success', message, title, duration: 4000 }), [push]);

  return (
    <ToastContext.Provider value={{ toasts, push, dismiss, error, success }}>
      {children}
      <ToastViewport toasts={toasts} dismiss={dismiss} />
    </ToastContext.Provider>
  );
}

function ToastViewport({ toasts, dismiss }: { toasts: Toast[]; dismiss: (id: string) => void }) {
  return (
    <div
      role="region"
      aria-label="Notifications"
      className="fixed top-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none"
    >
      {toasts.map(t => (
        <ToastItem key={t.id} toast={t} dismiss={dismiss} />
      ))}
    </div>
  );
}

function ToastItem({ toast, dismiss }: { toast: Toast; dismiss: (id: string) => void }) {
  useEffect(() => {
    if (!toast.duration) return;
    const handle = setTimeout(() => dismiss(toast.id), toast.duration);
    return () => clearTimeout(handle);
  }, [toast.id, toast.duration, dismiss]);

  return (
    <div
      role={toast.variant === 'error' ? 'alert' : 'status'}
      data-testid={`toast-${toast.variant}`}
      className={clsx(
        'pointer-events-auto p-4 rounded-lg border shadow-lg text-sm flex items-start gap-3',
        toast.variant === 'info' && 'bg-primary-50 border-primary-200 text-primary-800',
        toast.variant === 'success' && 'bg-success-50 border-success-200 text-success-800',
        toast.variant === 'warning' && 'bg-warning-50 border-warning-200 text-warning-800',
        toast.variant === 'error' && 'bg-danger-50 border-danger-200 text-danger-800',
      )}
    >
      <div className="flex-1 min-w-0">
        {toast.title && <div className="font-semibold mb-0.5">{toast.title}</div>}
        <div className="break-words">{toast.message}</div>
      </div>
      <button
        onClick={() => dismiss(toast.id)}
        aria-label="Dismiss notification"
        className="text-current opacity-60 hover:opacity-100 text-lg leading-none"
      >
        ×
      </button>
    </div>
  );
}
