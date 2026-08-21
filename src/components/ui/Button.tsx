import { cn } from '@/lib/utils';

type ButtonVariant = 'primary' | 'secondary' | 'ghost';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
}

const variantStyles: Record<ButtonVariant, string> = {
  primary: 'bg-accent text-surface hover:bg-accent/85 focus-visible:ring-accent/60',
  secondary: 'border border-border bg-surface-elevated text-slate-200 hover:border-accent/30 hover:text-accent focus-visible:ring-accent/60',
  ghost: 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 focus-visible:ring-accent/60',
};

export function Button({ className, variant = 'secondary', children, ...props }: ButtonProps) {
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2',
        variantStyles[variant],
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}
