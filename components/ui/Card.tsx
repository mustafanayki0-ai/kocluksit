import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface CardProps {
  children: ReactNode;
  className?: string;
  hover?: boolean;
  as?: 'div' | 'section' | 'article';
}

export function Card({ children, className, hover = false, as: Tag = 'div' }: CardProps) {
  return (
    <Tag className={cn(hover ? 'card-surface-hover' : 'card-surface', 'noise-bg', className)}>
      {children}
    </Tag>
  );
}

interface CardHeaderProps {
  children: ReactNode;
  className?: string;
}

export function CardHeader({ children, className }: CardHeaderProps) {
  return (
    <div className={cn('px-6 py-5 border-b border-slate-200', className)}>
      {children}
    </div>
  );
}

interface CardBodyProps {
  children: ReactNode;
  className?: string;
}

export function CardBody({ children, className }: CardBodyProps) {
  return <div className={cn('p-6', className)}>{children}</div>;
}

interface CardFooterProps {
  children: ReactNode;
  className?: string;
}

export function CardFooter({ children, className }: CardFooterProps) {
  return (
    <div className={cn('px-6 py-4 border-t border-slate-200', className)}>
      {children}
    </div>
  );
}
