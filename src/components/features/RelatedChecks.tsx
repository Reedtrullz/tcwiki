import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { cn } from '@/lib/utils';

export interface RelatedCheck {
  label: string;
  href: string;
  description: string;
  badge?: string;
}

interface RelatedChecksProps {
  checks: RelatedCheck[];
  className?: string;
  id?: string;
  title?: string;
  description?: string;
  badgeLabel?: string;
}

export function RelatedChecks({
  checks,
  className,
  id,
  title = 'Related Checks',
  description = 'Use these before turning current dashboard values into a broader claim.',
  badgeLabel = 'current-only',
}: RelatedChecksProps) {
  const headingId = id ? `${id}-heading` : 'related-checks-heading';

  return (
    <section id={id} className={cn('rounded-lg border border-border bg-surface-elevated p-4', className)} aria-labelledby={headingId}>
      <div className="mb-3 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 id={headingId} className="text-sm font-semibold text-slate-100">{title}</h2>
          <p className="mt-1 max-w-3xl text-xs leading-relaxed text-slate-400">{description}</p>
        </div>
        <Badge variant="info" className="self-start">{badgeLabel}</Badge>
      </div>
      <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-4">
        {checks.map((check) => (
          <Link
            key={check.href}
            href={check.href}
            className="group flex min-w-0 items-start justify-between gap-3 rounded-md border border-border bg-surface px-3 py-3 transition-colors hover:border-accent/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/60"
          >
            <span className="min-w-0">
              <span className="flex flex-wrap items-center gap-2">
                <span className="text-sm font-semibold text-slate-200 transition-colors group-hover:text-accent">{check.label}</span>
                {check.badge && <Badge>{check.badge}</Badge>}
              </span>
              <span className="mt-1 block text-xs leading-relaxed text-slate-400">{check.description}</span>
            </span>
            <ArrowRight className="mt-0.5 h-4 w-4 shrink-0 text-slate-500 transition-colors group-hover:text-accent" aria-hidden="true" />
          </Link>
        ))}
      </div>
    </section>
  );
}
