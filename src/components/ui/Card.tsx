import { cn } from '@/lib/utils'; // we'll add a tiny cn helper if not present

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'elevated' | 'bordered';
  hover?: boolean;
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

export function Card({
  className,
  variant = 'elevated',
  hover = false,
  padding = 'md',
  children,
  ...props
}: CardProps) {
  const base = 'rounded-lg border transition-colors';

  const variants = {
    default: 'bg-surface border-border',
    elevated: 'bg-surface-elevated border-border',
    bordered: 'bg-transparent border-border',
  };

  const paddings = {
    none: '',
    sm: 'p-3',
    md: 'p-5',
    lg: 'p-6',
  };

  const hoverStyles = hover ? 'hover:border-accent/30' : '';

  return (
    <div
      className={cn(
        base,
        variants[variant],
        paddings[padding],
        hoverStyles,
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
