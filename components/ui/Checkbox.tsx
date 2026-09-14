import { cn } from '@/lib/utils';

interface CheckboxProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}

export function Checkbox({ label, className, id, checked, ...props }: CheckboxProps) {
  return (
    <label
      className={cn(
        'flex items-start gap-3 cursor-pointer group select-none',
        className
      )}
    >
      <div className="relative mt-0.5 flex-shrslate-0">
        <input
          type="checkbox"
          id={id}
          checked={checked}
          className="peer sr-only"
          {...props}
        />
        <div
          className={cn(
            'w-5 h-5 rounded-md border-2 transition-all duration-200',
            'border-slate-300 bg-white',
            'peer-checked:border-emerald-500 peer-checked:bg-emerald-500',
            'peer-focus-visible:ring-4 peer-focus-visible:ring-emerald-500/20',
            'group-hover:border-slate-400',
            'flex items-center justify-center'
          )}
        >
          <svg
            className={cn(
              'w-3.5 h-3.5 text-white transition-all duration-200',
              checked ? 'opacity-100 scale-100' : 'opacity-0 scale-75'
            )}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={3.5}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
      </div>
      {label && (
        <span
          className={cn(
            'text-sm transition-all duration-200 leading-relaxed',
            checked
              ? 'text-slate-400 line-through'
              : 'text-slate-800 group-hover:text-slate-900'
          )}
        >
          {label}
        </span>
      )}
    </label>
  );
}
