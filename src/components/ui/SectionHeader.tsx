import { cn } from '@/lib/utils';

interface SectionHeaderProps extends React.HTMLAttributes<HTMLHeadingElement> {
  /** `primary` draws the eye as a major content section; `secondary` (default) is a quieter sub-heading. */
  level?: 'primary' | 'secondary';
}

export function SectionHeader({ children, className, level = 'secondary', ...props }: SectionHeaderProps) {
  const styles =
    level === 'primary'
      ? 'text-lg font-semibold text-slate-100 normal-case tracking-normal mb-5'
      : 'text-sm font-semibold text-slate-400 uppercase tracking-wider mb-5';
  return (
    <h2
      className={cn(styles, className)}
      {...props}
    >
      {children}
    </h2>
  );
}
