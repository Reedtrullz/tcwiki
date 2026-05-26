'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { Search, Menu, X } from 'lucide-react';

const navItems = [
  { name: 'Protocol', href: '/protocol' },
  { name: 'Network', href: '/network' },
  { name: 'Economics', href: '/economics' },
  { name: 'Ecosystem', href: '/ecosystem' },
  { name: 'Governance', href: '/governance' },
  { name: 'Statistics', href: '/stats' },
  { name: 'RUNE', href: '/rune' },
  { name: 'TCY', href: '/tcy' },
  { name: 'Docs', href: '/docs' },
];

export default function Header() {
  const [isOpen, setIsOpen] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Global ⌘K / Ctrl+K to open search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setShowSearch(true);
        // Focus will be handled by autoFocus on the input
      }
      if (e.key === 'Escape' && showSearch) {
        setShowSearch(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showSearch]);

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
              THORChain<span className="text-slate-500 font-normal"> Wiki</span>
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="px-3 py-1.5 text-sm text-slate-400 hover:text-slate-100 hover:bg-slate-800/50 rounded-md transition-colors"
              >
                {item.name}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowSearch(!showSearch)}
              className="p-2 text-slate-400 hover:text-slate-100 rounded-md hover:bg-slate-800/50 transition-colors"
            >
              <Search className="h-4 w-4" />
            </button>
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="md:hidden p-2 text-slate-400 hover:text-slate-100 rounded-md"
            >
              {isOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            </button>
          </div>
        </div>
      </div>

      {showSearch && (
        <div className="border-t border-border px-6 py-3 bg-surface-elevated">
          <form onSubmit={handleSearch} className="max-w-2xl mx-auto">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search the wiki..."
                className="w-full pl-9 pr-4 py-2 bg-surface border border-border rounded-md text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-accent/50 transition-colors"
                autoFocus
              />
            </div>
          </form>
        </div>
      )}

      {isOpen && (
        <div className="md:hidden border-t border-border bg-surface-elevated">
          <nav className="px-4 py-2 space-y-0.5">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="block px-3 py-2 text-sm text-slate-400 hover:text-slate-100 hover:bg-slate-800/50 rounded-md transition-colors"
                onClick={() => setIsOpen(false)}
              >
                {item.name}
              </Link>
            ))}
          </nav>
        </div>
      )}
    </header>
  );
}
