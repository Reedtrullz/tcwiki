import { type HTMLAttributes, type ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface ResponsiveVisibilityProps extends HTMLAttributes<HTMLDivElement> {
  /** Show only on desktop (md+). Hidden on mobile. */
  desktop?: boolean;
  /** Show only on mobile (<md). Hidden on md+. */
  mobile?: boolean;
  children: ReactNode;
}

/**
 * Controls viewport-specific visibility using Tailwind responsive breakpoints.
 * Children are always rendered in the DOM; only display is toggled.
 *
 * @example
 * <ResponsiveVisibility mobile><MobileCards/></ResponsiveVisibility>
 * <ResponsiveVisibility desktop><DesktopTable/></ResponsiveVisibility>
 */
export function ResponsiveVisibility({
  desktop,
  mobile,
  className,
  children,
  ...props
}: ResponsiveVisibilityProps) {
  const visibilityClass = desktop
    ? 'hidden md:block'
    : mobile
      ? 'md:hidden'
      : '';

  return (
    <div className={cn(visibilityClass, className)} {...props}>
      {children}
    </div>
  );
}
