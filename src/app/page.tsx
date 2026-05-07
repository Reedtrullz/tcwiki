'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import MidgardAPI from '@/lib/api/midgard';
import { NetworkStats, Pool } from '@/lib/types';
import { ECOSYSTEM_PROJECTS, RESEARCH_REPORTS } from '@/lib/data/static';
import { Activity, TrendingUp, Shield, Layers } from 'lucide-react';

export default function HomePage() {
  const [networkData, setNetworkData] = useState<NetworkStats | null>(null);
  const [topPools, setTopPools] = useState<Pool[]>([]);
  const [poolCount, setPoolCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const fetchData = async () => {
      try {
        const [network, pools] = await Promise.all([
          MidgardAPI.getNetworkData(),
          MidgardAPI.getPools(),
        ]);
        if (!cancelled) {
          setNetworkData(network);
          setTopPools(pools.slice(0, 5));
          setPoolCount(pools.length);
          setLoading(false);
        }
      } catch {
        if (!cancelled) setLoading(false);
      }
    };
    fetchData();
    const interval = setInterval(fetchData, 60000);
    return () => { cancelled = true; clearInterval(interval); };
  }, []);

  const runePooled = networkData ? Math.round(parseInt(networkData.totalPooledRune) / 1e8).toLocaleString() : '…';
  const bondingApy = networkData ? (parseFloat(networkData.bondingAPY) * 100).toFixed(2) : '…';
  const activeNodes = networkData?.activeNodeCount ?? '…';

  return (
    <div className="pt-[52px]">
      {/* Hero */}
      <section className="py-20 px-6 max-w-7xl mx-auto">
        <h1 className="text-4xl sm:text-5xl font-bold tracking-tight mb-4">
          THORChain Wiki
        </h1>
        <p className="text-lg text-slate-400 max-w-2xl">
          Community-maintained encyclopedia of the THORChain protocol —
          architecture, economics, governance, ecosystem, and live network data.
        </p>
      </section>

      {/* Network stats strip */}
      <section className="px-6 max-w-7xl mx-auto mb-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <StatCard
            icon={<Layers className="h-4 w-4" />}
            label="Pooled RUNE"
            value={`${runePooled}`}
            unit="RUNE"
          />
          <StatCard
            icon={<TrendingUp className="h-4 w-4" />}
            label="Bonding APY"
            value={bondingApy}
            unit="%"
          />
          <StatCard
            icon={<Shield className="h-4 w-4" />}
            label="Active Nodes"
            value={String(activeNodes)}
          />
          <StatCard
            icon={<Activity className="h-4 w-4" />}
            label="Pools"
            value={String(poolCount)}
          />
        </div>
      </section>

      {/* Explore topics */}
      <section className="px-6 max-w-7xl mx-auto mb-16">
        <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-5">Explore</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { title: 'Protocol', desc: 'Architecture, cross-chain mechanics, TSS, vaults, and supported chains.', href: '/protocol' },
            { title: 'Network', desc: 'Node types, churning, bond requirements, and security model.', href: '/network' },
            { title: 'Economics', desc: 'RUNE tokenomics, CLP formula, fees, and the Incentive Pendulum.', href: '/economics' },
            { title: 'Governance', desc: 'ADRs, protocol milestones, security incidents, and research.', href: '/governance' },
          ].map((t) => (
            <Link
              key={t.href}
              href={t.href}
              className="block p-5 rounded-lg bg-surface-elevated border border-border hover:border-accent/30 transition-colors group"
            >
              <h3 className="text-sm font-semibold mb-1.5 group-hover:text-accent transition-colors">{t.title}</h3>
              <p className="text-xs text-slate-500 leading-relaxed">{t.desc}</p>
            </Link>
          ))}
        </div>
      </section>

      {/* Ecosystem preview */}
      <section className="px-6 max-w-7xl mx-auto mb-16">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Ecosystem</h2>
          <Link href="/ecosystem" className="text-xs text-slate-500 hover:text-slate-300 transition-colors">View all →</Link>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
          {ECOSYSTEM_PROJECTS.slice(0, 8).map((p) => (
            <a
              key={p.id}
              href={p.url}
              target="_blank"
              rel="noopener noreferrer"
              className="block p-4 rounded-lg bg-surface-elevated border border-border hover:border-accent/20 transition-colors group"
            >
              <p className="text-sm font-medium group-hover:text-accent transition-colors">{p.name}</p>
              <p className="text-[11px] text-slate-500 mt-1">{p.category}</p>
            </a>
          ))}
        </div>
      </section>

      {/* Research */}
      <section className="px-6 max-w-7xl mx-auto mb-16">
        <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-5">Research</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {RESEARCH_REPORTS.map((r) => (
            <a
              key={r.id}
              href={r.url}
              target="_blank"
              rel="noopener noreferrer"
              className="block p-5 rounded-lg bg-surface-elevated border border-border hover:border-accent/20 transition-colors"
            >
              <p className="text-[11px] text-slate-500 mb-1">{r.date} · {r.source}</p>
              <h3 className="text-sm font-semibold mb-2">{r.title}</h3>
              <p className="text-xs text-slate-500 leading-relaxed line-clamp-2">{r.summary}</p>
            </a>
          ))}
        </div>
      </section>

      {/* Quick links */}
      <section className="px-6 max-w-7xl mx-auto pb-20">
        <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-5">Quick Links</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {[
            { label: 'THORChain Docs', href: 'https://docs.thorchain.org' },
            { label: 'Developer Docs', href: 'https://dev.thorchain.org' },
            { label: 'Midgard API', href: 'https://midgard.thorchain.network/v2/doc' },
            { label: 'RuneScan Explorer', href: 'https://runescan.io' },
          ].map((l) => (
            <a
              key={l.href}
              href={l.href}
              target="_blank"
              rel="noopener noreferrer"
              className="block p-4 rounded-lg bg-surface-elevated border border-border hover:border-accent/20 text-sm text-slate-400 hover:text-slate-200 transition-colors text-center"
            >
              {l.label}
            </a>
          ))}
        </div>
      </section>
    </div>
  );
}

function StatCard({ icon, label, value, unit }: { icon: React.ReactNode; label: string; value: string; unit?: string }) {
  return (
    <div className="p-5 rounded-lg bg-surface-elevated border border-border">
      <div className="flex items-center gap-2 text-accent mb-3">{icon}<span className="text-[11px] text-slate-400 uppercase tracking-wider">{label}</span></div>
      <p className="text-2xl font-bold tracking-tight">
        {value}
        {unit && <span className="text-sm font-normal text-slate-500 ml-1">{unit}</span>}
      </p>
    </div>
  );
}
