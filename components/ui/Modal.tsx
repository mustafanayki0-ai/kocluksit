'use client';

import { useEffect, useRef, type ReactNode } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: ReactNode;
  description?: ReactNode;
  children: ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  hideClose?: boolean;
  footer?: ReactNode;
}

const sizeMap: Record<NonNullable<ModalProps['size']>, string> = {
  sm: 'max-w-md',
  md: 'max-w-xl',
  lg: 'max-w-2xl',
  xl: 'max-w-3xl',
};

export function Modal({
  open,
  onClose,
  title,
  description,
  children,
  size = 'lg',
  hideClose = false,
  footer,
}: ModalProps) {
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4"
    >
      <div
        onClick={onClose}
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-[2px] animate-[fadeIn_.18s_ease-out]"
      />
      <div
        ref={panelRef}
        onClick={(e) => e.stopPropagation()}
        className={cn(
          'relative z-10 w-full bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl border border-slate-200',
          'flex flex-col max-h-[92vh] overflow-hidden',
          'animate-[modalIn_.22s_cubic-bezier(.2,.7,.2,1)]',
          sizeMap[size]
        )}
      >
        {(title || description || !hideClose) && (
          <div className="flex items-start justify-between gap-4 px-5 sm:px-7 py-5 border-b border-slate-100 bg-gradient-to-br from-slate-50 via-white to-white">
            <div className="flex-1 min-w-0">
              {title && (
                <h2 className="font-display font-bold text-lg sm:text-xl text-slate-900 leading-tight">
                  {title}
                </h2>
              )}
              {description && (
                <p className="mt-1 text-sm text-slate-500">{description}</p>
              )}
            </div>
            {!hideClose && (
              <button
                type="button"
                onClick={onClose}
                aria-label="Kapat"
                className="shrink-0 w-9 h-9 rounded-xl flex items-center justify-center text-slate-500 hover:text-slate-800 hover:bg-slate-100 border border-slate-200 transition"
              >
                <X className="w-4.5 h-4.5" strokeWidth={2.2} />
              </button>
            )}
          </div>
        )}

        <div className="relative flex-1 overflow-y-auto overflow-x-hidden px-5 sm:px-7 py-5 sm:py-6">
          {children}
        </div>

        {footer && (
          <div className="px-5 sm:px-7 py-4 border-t border-slate-100 bg-slate-50/60 flex flex-wrap items-center justify-end gap-2">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
