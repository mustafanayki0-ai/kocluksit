import { cn } from '@/lib/utils';

type Variant = 'brand' | 'accent' | 'fire' | 'ink' | 'success' | 'warning';
type Size = 'sm' | 'md';

const variantClasses: Record<Variant, string> = {
  brand:
    'bg-slate-50 text-slate-700 border border-slate-200',
  accent:
    'bg-emerald-50 text-emerald-700 border border-emerald-200',
  fire: 'bg-orange-50 text-orange-700 border border-orange-200',
  ink: 'bg-slate-100 text-slate-700 border border-slate-200',
  success:
    'bg-emerald-50 text-emerald-700 border border-emerald-200',
  warning:
    'bg-orange-50 text-orange-700 border border-orange-200',
};

const sizeClasses: Record<Size, string> = {
  sm: 'px-2 py-0.5 text-[10px]',
  md: 'px-2.5 py-1 text-xs',
};

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: Variant;
  size?: Size;
}

export function Badge({
  variant = 'ink',
  size = 'md',
  className,
  children,
  ...props
}: BadgeProps) {
  return (
    <span
      className={cn('badge', variantClasses[variant], sizeClasses[size], className)}
      {...props}
    >
      {children}
    </span>
  );
}
