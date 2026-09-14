import type { ReactNode } from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

type Variant = 'primary' | 'secondary' | 'accent' | 'ghost';
type Size = 'sm' | 'md' | 'lg';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  children: ReactNode;
  asLink?: boolean;
  href?: string;
}

const sizeClasses: Record<Size, string> = {
  sm: 'px-3.5 py-2 text-sm rounded-lg',
  md: 'px-5 py-2.5 rounded-xl',
  lg: 'px-7 py-3.5 text-lg rounded-xl',
};

const variantClasses: Record<Variant, string> = {
  primary: 'btn-primary',
  secondary: 'btn-secondary',
  accent: 'btn-accent',
  ghost: 'btn-ghost',
};

export function Button({
  variant = 'primary',
  size = 'md',
  children,
  className,
  asLink = false,
  href,
  ...props
}: ButtonProps) {
  const classes = cn(variantClasses[variant], sizeClasses[size], className);

  if (asLink && href) {
    return (
      <Link href={href} className={classes}>
        {children}
      </Link>
    );
  }

  return (
    <button className={classes} {...props}>
      {children}
    </button>
  );
}
