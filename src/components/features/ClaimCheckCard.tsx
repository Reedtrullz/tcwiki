import Link from 'next/link';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { cn } from '@/lib/utils';

type BadgeVariant = 'default' | 'success' | 'warning' | 'danger' | 'info';

export interface ClaimCheckCardProps {
  /** Visible badge label */
  badge?: string;
  /** Badge color variant */
  badgeVariant?: BadgeVariant;
  /** Card title / claim name */
  title: string;
  /** What this claim type is used for */
  use: string;
  /** What to verify before claiming */
  verify?: string;
  /** What NOT to claim */
  avoid: string;
  /** Link destination */
  href: string;
  /** Link label */
  linkLabel: string;
  /** Legacy anchor ID (for governance-page hidden anchors) */
  anchorId?: string;
  /** Optional id on the Card root */
  id?: string;
  /** Additional class on the Card root */
  className?: string;
}

/**
 * Reusable claim-check card for Protocol, Governance, and RUNE pages.
 *
 * - Default (RUNE) layout: 3-column grid of Use For / Verify / Do Not Claim.
 * - compact: list-style layout for <details> wrappers (Governance, Protocol).
 */
export function ClaimCheckCard({
  badge,
  badgeVariant = 'default',
  title,
  use: useText,
  verify,
  avoid,
  href,
  linkLabel,
  anchorId,
  id,
  className,
}: ClaimCheckCardProps) {
  return (
    <Card id={id} padding="sm" className={cn('border-border', className)}>
      {anchorId ? <span id={anchorId} className="sr-only" aria-hidden="true" /> : null}
      <div className="flex flex-wrap items-center gap-2 mb-2">
        {badge ? <Badge variant={badgeVariant}>{badge}</Badge> : null}
        <h3 className="text-sm font-semibold text-slate-100">{title}</h3>
      </div>
      <dl className="grid gap-3 text-xs leading-relaxed text-slate-400 sm:grid-cols-3">
        <div>
          <dt className="font-semibold uppercase tracking-wider text-slate-500">Use For</dt>
          <dd className="mt-1">{useText}</dd>
        </div>
        {verify ? (
          <div>
            <dt className="font-semibold uppercase tracking-wider text-slate-500">Verify</dt>
            <dd className="mt-1">{verify}</dd>
          </div>
        ) : null}
        <div>
          <dt className="font-semibold uppercase tracking-wider text-amber-300">Do Not Claim</dt>
          <dd className="mt-1">{avoid}</dd>
        </div>
      </dl>
      <Link href={href} className="mt-3 inline-flex text-xs font-semibold text-accent underline-offset-4 hover:underline">
        {linkLabel}
      </Link>
    </Card>
  );
}

