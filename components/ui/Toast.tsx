'use client';

import { createContext, useCallback, useContext, useEffect, useState, ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { CheckCircle2, XCircle, AlertTriangle, Info, X } from 'lucide-react';

export type ToastVariant = 'success' | 'error' | 'warning' | 'info';

export interface ToastItem {
  id: string;
  title: string;
  description?: string;
  variant: ToastVariant;
  duration?: number;
}

interface ToastContextValue {
  toasts: ToastItem[];
  toast: (t: Omit<ToastItem, 'id'>) => string;
  success: (title: string, description?: string) => string;
  error: (title: string, description?: string) => string;
  warning: (title: string, description?: string) => string;
  info: (title: string, description?: string) => string;
  dismiss: (id: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const VARIANT_STYLES: Record<ToastVariant, string> = {
  success:
    'bg-emerald-50/95 text-emerald-900 border-emerald-200 shadow-emerald-500/10',
  error:
    'bg-red-50/95 text-red-900 border-red-200 shadow-red-500/10',
  warning:
    'bg-amber-50/95 text-amber-900 border-amber-200 shadow-amber-500/10',
  info: 'bg-sky-50/95 text-sky-900 border-sky-200 shadow-sky-500/10',
};

const VARIANT_ICONS: Record<ToastVariant, typeof CheckCircle2> = {
  success: CheckCircle2,
  error: XCircle,
  warning: AlertTriangle,
  info: Info,
};

const VARIANT_ICON_COLORS: Record<ToastVariant, string> = {
  success: 'text-emerald-500',
  error: 'text-red-500',
  warning: 'text-amber-500',
  info: 'text-sky-500',
};

let toastIdCounter = 0;
const nextId = () => `toast-${++toastIdCounter}-${Date.now()}`;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const dismiss = useCallback((id: string) => {
    setToasts((cur) => cur.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback<ToastContextValue['toast']>((t) => {
    const id = nextId();
    const duration = t.duration ?? 4000;
    setToasts((cur) => [...cur, { ...t, id }]);
    if (duration > 0) {
      setTimeout(() => dismiss(id), duration);
    }
    return id;
  }, [dismiss]);

  const success = useCallback((title: string, description?: string) => toast({ title, description, variant: 'success' }), [toast]);
  const error = useCallback((title: string, description?: string) => toast({ title, description, variant: 'error' }), [toast]);
  const warning = useCallback((title: string, description?: string) => toast({ title, description, variant: 'warning' }), [toast]);
  const info = useCallback((title: string, description?: string) => toast({ title, description, variant: 'info' }), [toast]);

  return (
    <ToastContext.Provider value={{ toasts, toast, success, error, warning, info, dismiss }}>
      {children}
      <div className="fixed z-[100] top-4 right-4 sm:top-6 sm:right-6 flex flex-col gap-3 w-[calc(100%-2rem)] sm:w-96 pointer-events-none">
        {toasts.map((t) => {
          const Icon = VARIANT_ICONS[t.variant];
          return (
            <div
              key={t.id}
              role="status"
              className={cn(
                'pointer-events-auto flex gap-3 items-start border rounded-xl px-4 py-3 shadow-lg backdrop-blur-md animate-[fadeIn_0.18s_ease-out,slideInRight_0.22s_ease-out]',
                VARIANT_STYLES[t.variant]
              )}
            >
              <Icon className={cn('w-5 h-5 mt-0.5 flex-shrink-0', VARIANT_ICON_COLORS[t.variant])} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold leading-snug">{t.title}</p>
                {t.description && (
                  <p className="mt-0.5 text-xs opacity-90 leading-relaxed">{t.description}</p>
                )}
              </div>
              <button
                type="button"
                onClick={() => dismiss(t.id)}
                className="opacity-70 hover:opacity-100 transition-opacity p-0.5 -mr-1 rounded-md"
                aria-label="Kapat"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}
