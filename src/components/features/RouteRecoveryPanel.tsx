'use client';

import Link from 'next/link';
import { useEffect, useRef } from 'react';
import { PageContainer } from '@/components/layout/PageContainer';

type RecoveryAction = (() => void) | undefined;

export function getRouteRecoveryAction(retry?: () => void, reset?: () => void): RecoveryAction {
  return retry ?? reset;
}

interface RouteRecoveryPanelProps {
  title: string;
  description: string;
  retry?: () => void;
  reset?: () => void;
}

export function RouteRecoveryPanel({ title, description, retry, reset }: RouteRecoveryPanelProps) {
  const headingRef = useRef<HTMLHeadingElement>(null);
  const recoveryAction = getRouteRecoveryAction(retry, reset);

  useEffect(() => {
    headingRef.current?.focus();
  }, []);

  return (
    <PageContainer maxWidth="narrow">
      <section
        aria-labelledby="route-recovery-title"
        className="rounded-xl border border-border bg-surface-elevated p-6 sm:p-8"
      >
        <div role="status" aria-live="polite" aria-atomic="true">
          <p className="text-xs font-semibold uppercase tracking-wider text-accent">Route recovery</p>
          <h1
            ref={headingRef}
            id="route-recovery-title"
            tabIndex={-1}
            className="mt-3 text-2xl font-bold tracking-tight text-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/70 sm:text-3xl"
          >
            {title}
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-slate-300">{description}</p>
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          {recoveryAction && (
            <button
              type="button"
              onClick={recoveryAction}
              className="rounded-md border border-accent/40 bg-accent/10 px-4 py-2.5 text-sm font-semibold text-accent transition-colors hover:border-accent/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/70"
            >
              Try again
            </button>
          )}

          <nav aria-label="Wiki recovery links" className="flex flex-wrap gap-3">
            <Link
              href="/"
              className="rounded-md border border-border px-4 py-2.5 text-sm font-semibold text-slate-200 transition-colors hover:border-accent/40 hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/70"
            >
              Wiki home
            </Link>
            <Link
              href="/docs"
              className="rounded-md border border-border px-4 py-2.5 text-sm font-semibold text-slate-200 transition-colors hover:border-accent/40 hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/70"
            >
              Browse the source map
            </Link>
            <Link
              href="/search"
              className="rounded-md border border-border px-4 py-2.5 text-sm font-semibold text-slate-200 transition-colors hover:border-accent/40 hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/70"
            >
              Search the wiki
            </Link>
          </nav>
        </div>
      </section>
    </PageContainer>
  );
}
