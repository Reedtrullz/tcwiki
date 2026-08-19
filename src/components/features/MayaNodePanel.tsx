'use client';

import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { LiveSourceMeta } from '@/components/ui/LiveSourceMeta';
import { useMayaNetwork, useMayaNodes } from '@/lib/hooks/useMaya';
import type { MayaNode } from '@/lib/types';

function statusColor(status: string | undefined): string {
  switch (status?.toLowerCase()) {
    case 'active': return 'text-green-400';
    case 'standby': return 'text-amber-400';
    case 'whitelisted': return 'text-blue-400';
    case 'ready': return 'text-slate-300';
    case 'disabled': return 'text-red-300';
    default: return 'text-slate-400';
  }
}

function statusBadgeVariant(status: string | undefined): 'success' | 'warning' | 'info' | 'default' | 'danger' {
  switch (status?.toLowerCase()) {
    case 'active': return 'success';
    case 'standby': return 'warning';
    case 'ready': return 'info';
    case 'disabled': return 'danger';
    default: return 'default';
  }
}

function formatBond(bond: string | undefined): string {
  if (!bond) return '—';
  const num = Number(bond);
  if (!Number.isFinite(num)) return '—';
  // CACAO uses 1e8 base units like RUNE
  return (num / 1e8).toLocaleString(undefined, { maximumFractionDigits: 0 });
}

function NodeRow({ node }: { node: MayaNode }) {
  return (
    <div className="flex items-center justify-between gap-3 py-2 first:pt-0 last:pb-0 border-b border-border/50 last:border-0">
      <div className="min-w-0 flex-1">
        <p className="text-xs font-mono text-slate-300 truncate" title={node.nodeAddress}>
          {node.nodeAddress.slice(0, 12)}…{node.nodeAddress.slice(-6)}
        </p>
        {node.version && (
          <p className="text-[11px] text-slate-500 mt-0.5">v{node.version}</p>
        )}
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <span className="text-xs text-slate-400 tabular-nums">{formatBond(node.bond)} CACAO</span>
        <Badge variant={statusBadgeVariant(node.status)}>{node.status ?? 'Unknown'}</Badge>
      </div>
    </div>
  );
}

export function MayaNodePanel() {
  const { data: network, result: networkResult, isLoading: networkLoading } = useMayaNetwork();
  const { data: nodes, result: nodesResult, isLoading: nodesLoading } = useMayaNodes();

  const activeNodes = nodes?.filter((n) => n.isActive) ?? [];

  const isLoading = networkLoading || nodesLoading;
  const hasError = networkResult?.status === 'degraded' && nodesResult?.status === 'degraded';

  return (
    <section id="maya-nodes" className="mb-12 scroll-mt-24" aria-labelledby="maya-nodes-heading">
      <SectionHeader id="maya-nodes-heading">Maya Protocol Nodes</SectionHeader>
      <p className="mb-4 max-w-3xl text-sm leading-relaxed text-slate-400">
        Maya Protocol is a THORChain fork with its own validator set, CACAO native asset,
        and independent chain support. Node data below comes from Maya&apos;s Midgard API.
      </p>

      {hasError && !isLoading && (
        <Card padding="sm" className="mb-4 border-warning/30">
          <p className="text-xs text-amber-400">
            Maya Midgard did not respond. The endpoints may be temporarily unavailable from this network.
          </p>
        </Card>
      )}

      <div className="grid gap-3 lg:grid-cols-2 mb-6">
        <Card padding="sm">
          <h3 className="text-sm font-semibold text-slate-200 mb-3">Network Overview</h3>
          {isLoading ? (
            <p className="text-xs text-slate-500">Loading Maya network data…</p>
          ) : network ? (
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-xs text-slate-400">Active nodes</span>
                <span className="text-xs font-semibold text-green-400 tabular-nums">{network.activeNodeCount}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-xs text-slate-400">Standby nodes</span>
                <span className="text-xs font-semibold text-amber-400 tabular-nums">{network.standbyNodeCount}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-xs text-slate-400">Bonding APY</span>
                <span className="text-xs font-semibold text-slate-200 tabular-nums">
                  {(Number(network.bondingAPY) * 100).toFixed(2)}%
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-xs text-slate-400">Liquidity APY</span>
                <span className="text-xs font-semibold text-slate-200 tabular-nums">
                  {(Number(network.liquidityAPY) * 100).toFixed(2)}%
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-xs text-slate-400">Next churn height</span>
                <span className="text-xs font-semibold text-slate-200 tabular-nums">
                  {network.nextChurnHeight.toLocaleString()}
                </span>
              </div>
            </div>
          ) : (
            <p className="text-xs text-slate-500">Network data unavailable.</p>
          )}
          <div className="mt-3">
            <LiveSourceMeta result={networkResult} />
          </div>
        </Card>

        <Card padding="sm">
          <h3 className="text-sm font-semibold text-slate-200 mb-3">Node Status Distribution</h3>
          {isLoading ? (
            <p className="text-xs text-slate-500">Loading Maya node data…</p>
          ) : nodes ? (
            <div className="space-y-2">
              {['Active', 'Standby', 'Ready', 'Whitelisted', 'Disabled'].map((status) => {
                const count = nodes.filter((n) => n.status?.toLowerCase() === status.toLowerCase()).length;
                if (count === 0) return null;
                return (
                  <div key={status} className="flex justify-between">
                    <span className={`text-xs ${statusColor(status)}`}>{status}</span>
                    <span className="text-xs font-semibold text-slate-200 tabular-nums">{count}</span>
                  </div>
                );
              })}
              <div className="flex justify-between pt-1 border-t border-border/50">
                <span className="text-xs text-slate-400">Total</span>
                <span className="text-xs font-semibold text-slate-200 tabular-nums">{nodes.length}</span>
              </div>
            </div>
          ) : (
            <p className="text-xs text-slate-500">Node data unavailable.</p>
          )}
          <div className="mt-3">
            <LiveSourceMeta result={nodesResult} />
          </div>
        </Card>
      </div>

      {nodes && nodes.length > 0 && (
        <Card padding="sm">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-slate-200">Active Validators</h3>
            <Badge variant="info">{activeNodes.length} active</Badge>
          </div>
          <div className="divide-y divide-border/30">
            {activeNodes.slice(0, 20).map((node) => (
              <NodeRow key={node.nodeAddress} node={node} />
            ))}
            {activeNodes.length > 20 && (
              <p className="text-xs text-slate-500 pt-2">
                Showing 20 of {activeNodes.length} active nodes.
              </p>
            )}
          </div>
        </Card>
      )}

      <div className="mt-4">
        <a
          href="https://docs.mayaprotocol.com/node-docs/mayanodes/overview"
          className="text-xs font-semibold text-accent underline-offset-4 hover:underline"
          target="_blank"
          rel="noopener noreferrer"
        >
          Maya Node Operator Docs
        </a>
      </div>
    </section>
  );
}
