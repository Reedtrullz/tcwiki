import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface PageContainerProps {
  children: ReactNode;
  className?: string;
  maxWidth?: 'default' | 'narrow';
}

export function PageContainer({ children, className, maxWidth = 'default' }: PageContainerProps) {
  const widths = {
    default: 'max-w-7xl',
    narrow: 'max-w-4xl',
  };

  return (
    <div className={cn(`pt-[52px] py-16 px-6 ${widths[maxWidth]} mx-auto`, className)}>
      {children}
    </div>
  );
}
