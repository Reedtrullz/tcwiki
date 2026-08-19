'use client';

import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

export interface TocItem {
  id: string;
  label: string;
  level?: 1 | 2;
}

interface PageTableOfContentsProps {
  items: TocItem[];
  className?: string;
}

/**
 * Sticky "On this page" navigation. Renders a scroll-spy list of in-page
 * anchor links so long, single-column pages become navigable instead of one
 * undifferentiated scroll. Add `id` attributes to the matching sections.
 */
export function PageTableOfContents({ items, className }: PageTableOfContentsProps) {
  const [activeId, setActiveId] = useState<string | null>(items[0]?.id ?? null);

  useEffect(() => {
    if (items.length === 0) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) {
          setActiveId(visible[0].target.id);
        }
      },
      { rootMargin: '-72px 0px -65% 0px', threshold: 0 }
    );

    const nodes = items
      .map((item) => document.getElementById(item.id))
      .filter((node): node is HTMLElement => node !== null);
    nodes.forEach((node) => observer.observe(node));

    return () => observer.disconnect();
  }, [items]);

  if (items.length === 0) {
    return null;
  }

  return (
    <nav aria-label="On this page" className={cn('text-xs', className)}>
      <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
        On this page
      </p>
      <ul className="space-y-1 border-l border-border">
        {items.map((item) => {
          const isActive = activeId === item.id;
          return (
            <li key={item.id}>
              <a
                href={`#${item.id}`}
                className={cn(
                  '-ml-px block border-l-2 py-1 leading-relaxed transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/60',
                  item.level === 2 ? 'pl-5' : 'pl-3',
                  isActive
                    ? 'border-accent text-accent'
                    : 'border-transparent text-slate-400 hover:border-accent/40 hover:text-slate-200'
                )}
              >
                {item.label}
              </a>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
