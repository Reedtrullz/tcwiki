'use client';
import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';

// One route-level listener serves TOCs, shared links and history. Native details
// remain reader-controlled once the explicit destination has been revealed.
export function AnchorNavigation() {
  const pathname = usePathname();
  const [unavailable, setUnavailable] = useState(false);
  useEffect(() => {
    let pending: number | undefined;
    let observer: MutationObserver | undefined;
    let destination = `${window.location.pathname}${window.location.hash}`;
    const stop = () => { window.clearTimeout(pending); observer?.disconnect(); observer = undefined; };
    const navigate = () => {
      destination = `${window.location.pathname}${window.location.hash}`;
      stop();
      setUnavailable(false);
      if (!window.location.hash || window.location.pathname !== pathname) return;
      let id: string;
      try { id = decodeURIComponent(window.location.hash.slice(1)); }
      catch { setUnavailable(true); return; }
      const reveal = () => {
        const target = document.getElementById(id);
        if (!target) return false;
        let parent: HTMLElement | null = target;
        while (parent) {
          if (parent instanceof HTMLDetailsElement) parent.open = true;
          parent = parent.parentElement;
        }
        if (!target.getClientRects().length) return false;
        if (!target.hasAttribute('tabindex') && !target.matches('a[href], button, input, select, textarea, summary, [contenteditable="true"]')) target.tabIndex = -1;
        target.focus({ preventScroll: true });
        window.scrollTo({ top: Math.max(0, target.getBoundingClientRect().top + window.scrollY - 88), behavior: 'auto' });
        stop();
        return true;
      };
      if (reveal()) return;
      observer = new MutationObserver(reveal);
      observer.observe(document.getElementById('main') ?? document.body, { childList: true, subtree: true });
      pending = window.setTimeout(() => { stop(); if (!reveal()) setUnavailable(true); }, 5000);
    };
    const onClick = (event: MouseEvent) => {
      if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const link = event.target instanceof Element ? event.target.closest('a[href]') : null;
      if (!(link instanceof HTMLAnchorElement) || link.target === '_blank' || link.hasAttribute('download')) return;
      const url = new URL(link.href);
      if (url.origin === window.location.origin && url.pathname === pathname && url.hash) {
        stop(); pending = window.setTimeout(navigate, 0);
      }
    };
    // Query writers emit synthetic popstate for URL readers. Keep editing focus.
    const onHistory = (event: PopStateEvent) => {
      if (event.isTrusted && `${window.location.pathname}${window.location.hash}` !== destination) navigate();
    };
    const onManualScroll = () => stop();
    const onKeyDown = (event: KeyboardEvent) => { if (event.key !== 'Enter') stop(); };
    window.addEventListener('hashchange', navigate);
    window.addEventListener('popstate', onHistory);
    document.addEventListener('click', onClick);
    document.addEventListener('pointerdown', onManualScroll);
    document.addEventListener('keydown', onKeyDown);
    window.addEventListener('wheel', onManualScroll, { passive: true });
    window.addEventListener('touchmove', onManualScroll, { passive: true });
    pending = window.setTimeout(navigate, 0);
    return () => {
      stop();
      window.removeEventListener('hashchange', navigate);
      window.removeEventListener('popstate', onHistory);
      document.removeEventListener('click', onClick);
      document.removeEventListener('pointerdown', onManualScroll);
      document.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('wheel', onManualScroll);
      window.removeEventListener('touchmove', onManualScroll);
    };
  }, [pathname]);
  return unavailable ? <div role="alert" className="fixed inset-x-4 top-16 z-40 mx-auto flex max-w-xl items-center justify-between gap-4 rounded border border-border bg-surface-elevated p-3 text-sm text-slate-200">The linked section is unavailable in this view. Check the page state or choose another section.<button type="button" onClick={() => setUnavailable(false)} className="text-accent underline" aria-label="Dismiss section navigation message">Dismiss</button></div> : null;
}
