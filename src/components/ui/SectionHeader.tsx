import { cn } from '@/lib/utils';

interface SectionHeaderProps {
  children: React.ReactNode;
  className?: string;
}

export function SectionHeader({ children, className }: SectionHeaderProps) {
  return (
    <h2
      className={cn('text-sm font-semibold text-slate-400 uppercase tracking-wider mb-5', className)}
    >
      {children}
    </h2>
  );
}
