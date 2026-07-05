'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState, useEffect, useRef, useCallback } from 'react';
import { Search, Menu, X, ChevronDown } from 'lucide-react';
import { JOURNEY_LINKS, NAV_ITEMS, TASK_INTENT_GUIDES } from '@/lib/content/registry';

export default function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [showGuides, setShowGuides] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [panelPathname, setPanelPathname] = useState(pathname);
  const searchButtonRef = useRef<HTMLButtonElement>(null);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const guidesButtonRef = useRef<HTMLButtonElement>(null);
  const lastTriggerRef = useRef<HTMLButtonElement | null>(null);
  const isOpenForPath = isOpen && panelPathname === pathname;
  const showSearchForPath = showSearch && panelPathname === pathname;
  const showGuidesForPath = showGuides && panelPathname === pathname;
  const isCurrentHref = (href: string) => (
    href === '/' ? pathname === href : pathname === href || pathname.startsWith(`${href}/`)
  );
  const pathForHref = (href: string) => href.split(/[?#]/)[0] || href;
  const isCurrentLink = (href: string) => isCurrentHref(pathForHref(href));
  const navLinkClassName = (href: string) => {
    const current = isCurrentLink(href);
    return [
      'rounded-md border px-3 py-1.5 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/60',
      current
        ? 'border-accent/25 bg-accent/10 text-accent'
        : 'border-transparent text-slate-400 hover:bg-slate-800/50 hover:text-slate-100',
    ].join(' ');
  };
  const panelLinkClassName = (href: string) => {
    const current = isCurrentLink(href);
    return [
      'rounded-lg border px-3 py-2 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/60',
      current
        ? 'border-accent/30 bg-accent/10'
        : 'border-border bg-surface hover:border-accent/30',
    ].join(' ');
  };
  const mobileLinkClassName = (href: string) => {
    const current = isCurrentLink(href);
    return [
      'block rounded-md px-3 py-2 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/60',
      current
        ? 'bg-accent/10 text-accent'
        : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-100',
    ].join(' ');
  };

  const closePanels = useCallback((restoreFocus = false) => {
    setIsOpen(false);
    setShowSearch(false);
    setShowGuides(false);
    if (restoreFocus) {
      window.requestAnimationFrame(() => lastTriggerRef.current?.focus());
    }
  }, []);

  // Global ⌘K / Ctrl+K to open search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        lastTriggerRef.current = searchButtonRef.current;
        setPanelPathname(pathname);
        setIsOpen(false);
        setShowGuides(false);
        setShowSearch(true);
        // Focus will be handled by autoFocus on the input
      }
      if (e.key === 'Escape' && (showSearchForPath || isOpenForPath || showGuidesForPath)) {
        e.preventDefault();
        closePanels(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showSearchForPath, isOpenForPath, showGuidesForPath, closePanels, pathname]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedQuery = searchQuery.trim();
    if (trimmedQuery) {
      closePanels(false);
      setSearchQuery('');
      router.push(`/search?q=${encodeURIComponent(trimmedQuery)}`);
    }
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-surface/95 backdrop-blur-sm border-b border-border">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex items-center justify-between h-[52px]">
          <Link href="/" className="flex items-center gap-2.5 shrink-0">
            <div className="w-7 h-7 rounded bg-accent/20 flex items-center justify-center">
              <span className="text-accent text-sm font-bold font-mono">⬡</span>
            </div>
            <span className="text-sm font-semibold tracking-tight">
              THORChain<span className="text-slate-400 font-normal"> Wiki</span>
            </span>
          </Link>

          <nav aria-label="Primary navigation" className="hidden lg:flex items-center gap-1">
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                aria-current={isCurrentHref(item.href) ? 'page' : undefined}
                className={navLinkClassName(item.href)}
              >
                {item.name}
              </Link>
            ))}
            <button
              ref={guidesButtonRef}
              type="button"
              onClick={() => {
                lastTriggerRef.current = guidesButtonRef.current;
                setPanelPathname(pathname);
                setIsOpen(false);
                setShowSearch(false);
                setShowGuides((value) => panelPathname === pathname ? !value : true);
              }}
              aria-expanded={showGuidesForPath}
              aria-controls="desktop-guides-panel"
              className={[
                'inline-flex items-center gap-1 rounded-md border px-3 py-1.5 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/60',
                showGuidesForPath
                  ? 'border-accent/25 bg-accent/10 text-accent'
                  : 'border-transparent text-slate-400 hover:bg-slate-800/50 hover:text-slate-100',
              ].join(' ')}
            >
              Guides
              <ChevronDown className={`h-3.5 w-3.5 transition-transform ${showGuidesForPath ? 'rotate-180' : ''}`} />
            </button>
          </nav>

          <div className="flex items-center gap-2">
            <button
              ref={searchButtonRef}
              type="button"
              onClick={() => {
                lastTriggerRef.current = searchButtonRef.current;
                setPanelPathname(pathname);
                setIsOpen(false);
                setShowGuides(false);
                setShowSearch((value) => panelPathname === pathname ? !value : true);
              }}
              aria-label={showSearchForPath ? 'Close search' : 'Open search'}
              aria-expanded={showSearchForPath}
              aria-controls="site-search-panel"
              className="p-2 text-slate-400 hover:text-slate-100 rounded-md hover:bg-slate-800/50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/60"
            >
              <Search className="h-4 w-4" />
            </button>
            <button
              ref={menuButtonRef}
              type="button"
              onClick={() => {
                lastTriggerRef.current = menuButtonRef.current;
                setPanelPathname(pathname);
                setShowSearch(false);
                setShowGuides(false);
                setIsOpen((value) => panelPathname === pathname ? !value : true);
              }}
              aria-label={isOpenForPath ? 'Close navigation menu' : 'Open navigation menu'}
              aria-expanded={isOpenForPath}
              aria-controls="mobile-navigation"
              className="lg:hidden p-2 text-slate-400 hover:text-slate-100 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/60"
            >
              {isOpenForPath ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            </button>
          </div>
        </div>
      </div>

      {showSearchForPath && (
        <div id="site-search-panel" className="border-t border-border px-6 py-3 bg-surface-elevated">
          <form role="search" aria-label="Site search" onSubmit={handleSearch} className="max-w-2xl mx-auto">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <label htmlFor="site-search" className="sr-only">Search the wiki</label>
              <input
                id="site-search"
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search the wiki..."
                className="w-full pl-9 pr-11 py-2 bg-surface border border-border rounded-md text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/50 transition-colors"
                autoFocus
              />
              <button
                type="submit"
                aria-label="Submit site search"
                className="absolute right-1 top-1/2 -translate-y-1/2 rounded p-1.5 text-slate-400 transition-colors hover:bg-slate-800/70 hover:text-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/60"
              >
                <Search className="h-4 w-4" />
              </button>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {TASK_INTENT_GUIDES.map((guide) => (
                <Link
                  key={guide.id}
                  href={guide.href}
                  className="rounded-md border border-border px-2.5 py-1 text-xs text-slate-400 hover:border-accent/30 hover:text-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/60"
                  onClick={() => closePanels(false)}
                >
                  {guide.label}
                </Link>
              ))}
            </div>
          </form>
        </div>
      )}

      {showGuidesForPath && (
        <div id="desktop-guides-panel" className="hidden max-h-[calc(100vh-52px)] overflow-y-auto border-t border-border bg-surface-elevated px-6 py-3 lg:block">
          <nav aria-label="Guide links" className="mx-auto grid max-w-7xl gap-4 xl:grid-cols-[0.95fr_1.35fr]">
            <section aria-labelledby="desktop-reader-paths">
              <p id="desktop-reader-paths" className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                Reader Paths
              </p>
              <div className="grid grid-cols-2 gap-2 xl:grid-cols-3">
                {JOURNEY_LINKS.map((journey) => (
                  <Link
                    key={journey.href}
                    href={journey.href}
                    aria-current={isCurrentLink(journey.href) ? 'page' : undefined}
                    className={panelLinkClassName(journey.href)}
                    onClick={() => closePanels(false)}
                  >
                    <span className={`text-xs font-semibold ${isCurrentLink(journey.href) ? 'text-accent' : 'text-slate-200'}`}>{journey.label}</span>
                    <span className="mt-1 block text-[11px] leading-relaxed text-slate-400">{journey.description}</span>
                  </Link>
                ))}
              </div>
            </section>
            <section aria-labelledby="desktop-common-tasks">
              <p id="desktop-common-tasks" className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                Common Tasks
              </p>
              <div className="grid grid-cols-2 gap-2 xl:grid-cols-3">
                {TASK_INTENT_GUIDES.map((guide) => (
                  <Link
                    key={guide.id}
                    href={guide.href}
                    aria-current={isCurrentLink(guide.href) ? 'page' : undefined}
                    className={panelLinkClassName(guide.href)}
                    onClick={() => closePanels(false)}
                  >
                    <span className={`text-xs font-semibold ${isCurrentLink(guide.href) ? 'text-accent' : 'text-slate-200'}`}>{guide.label}</span>
                    <span className="mt-1 block text-[11px] leading-relaxed text-slate-400">{guide.description}</span>
                  </Link>
                ))}
              </div>
            </section>
          </nav>
        </div>
      )}

      {isOpenForPath && (
        <div id="mobile-navigation" className="max-h-[calc(100vh-52px)] overflow-y-auto overscroll-contain border-t border-border bg-surface-elevated lg:hidden">
          <nav aria-label="Mobile navigation" className="px-4 py-2 space-y-0.5">
            <p className="px-3 pb-1 pt-2 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
              Sections
            </p>
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                aria-current={isCurrentHref(item.href) ? 'page' : undefined}
                className={mobileLinkClassName(item.href)}
                onClick={() => closePanels(false)}
              >
                {item.name}
              </Link>
            ))}
            <div className="my-2 border-t border-border" />
            <p className="px-3 pb-1 pt-2 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
              Reader Paths
            </p>
            {JOURNEY_LINKS.map((journey) => (
              <Link
                key={journey.href}
                href={journey.href}
                aria-current={isCurrentLink(journey.href) ? 'page' : undefined}
                className={mobileLinkClassName(journey.href)}
                onClick={() => closePanels(false)}
              >
                {journey.label}
              </Link>
            ))}
            <div className="my-2 border-t border-border" />
            <p className="px-3 pb-1 pt-2 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
              Common Tasks
            </p>
            {TASK_INTENT_GUIDES.map((guide) => (
              <Link
                key={guide.id}
                href={guide.href}
                aria-current={isCurrentLink(guide.href) ? 'page' : undefined}
                className={mobileLinkClassName(guide.href)}
                onClick={() => closePanels(false)}
              >
                {guide.label}
              </Link>
            ))}
          </nav>
        </div>
      )}
    </header>
  );
}
