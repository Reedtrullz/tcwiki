'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect, useRef, useCallback } from 'react';
import { Search, Menu, X } from 'lucide-react';
import { JOURNEY_LINKS, NAV_ITEMS } from '@/lib/content/registry';

export default function Header() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [panelPathname, setPanelPathname] = useState(pathname);
  const searchButtonRef = useRef<HTMLButtonElement>(null);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const lastTriggerRef = useRef<HTMLButtonElement | null>(null);
  const isOpenForPath = isOpen && panelPathname === pathname;
  const showSearchForPath = showSearch && panelPathname === pathname;
  const isCurrentHref = (href: string) => (
    href === '/' ? pathname === href : pathname === href || pathname.startsWith(`${href}/`)
  );

  const closePanels = useCallback((restoreFocus = false) => {
    setIsOpen(false);
    setShowSearch(false);
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
        setShowSearch(true);
        // Focus will be handled by autoFocus on the input
      }
      if (e.key === 'Escape' && (showSearchForPath || isOpenForPath)) {
        e.preventDefault();
        closePanels(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showSearchForPath, isOpenForPath, closePanels, pathname]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      window.location.href = `/search?q=${encodeURIComponent(searchQuery)}`;
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
                className="px-3 py-1.5 text-sm text-slate-400 hover:text-slate-100 hover:bg-slate-800/50 rounded-md transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/60"
              >
                {item.name}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <button
              ref={searchButtonRef}
              type="button"
              onClick={() => {
                lastTriggerRef.current = searchButtonRef.current;
                setPanelPathname(pathname);
                setIsOpen(false);
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
              {JOURNEY_LINKS.map((journey) => (
                <Link
                  key={journey.href}
                  href={journey.href}
                  className="rounded-md border border-border px-2.5 py-1 text-xs text-slate-400 hover:border-accent/30 hover:text-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/60"
                  onClick={() => closePanels(false)}
                >
                  {journey.label}
                </Link>
              ))}
            </div>
          </form>
        </div>
      )}

      {isOpenForPath && (
        <div id="mobile-navigation" className="max-h-[calc(100vh-52px)] overflow-y-auto overscroll-contain border-t border-border bg-surface-elevated lg:hidden">
          <nav aria-label="Mobile navigation" className="px-4 py-2 space-y-0.5">
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                aria-current={isCurrentHref(item.href) ? 'page' : undefined}
                className="block px-3 py-2 text-sm text-slate-400 hover:text-slate-100 hover:bg-slate-800/50 rounded-md transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/60"
                onClick={() => closePanels(false)}
              >
                {item.name}
              </Link>
            ))}
            <div className="my-2 border-t border-border" />
            {JOURNEY_LINKS.map((journey) => (
              <Link
                key={journey.href}
                href={journey.href}
                className="block px-3 py-2 text-sm text-slate-400 hover:text-slate-100 hover:bg-slate-800/50 rounded-md transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/60"
                onClick={() => closePanels(false)}
              >
                {journey.label}
              </Link>
            ))}
          </nav>
        </div>
      )}
    </header>
  );
}
