import { cn } from '@/lib/utils';

interface SectionHeaderProps extends React.HTMLAttributes<HTMLHeadingElement> {
  children: React.ReactNode;
}

export function SectionHeader({ children, className, ...props }: SectionHeaderProps) {
  return (
    <h2
      className={cn('text-sm font-semibold text-slate-400 uppercase tracking-wider mb-5', className)}
      {...props}
    >
      {children}
    </h2>
  );
}
