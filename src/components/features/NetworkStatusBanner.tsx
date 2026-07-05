'use client';

import { FormEvent, useMemo, useState } from 'react';
import Link from 'next/link';
import { AlertTriangle, CheckCircle2, RadioTower } from 'lucide-react';
import {
  LiveDataResult,
  NetworkStatus,
  NetworkStatusSourceWarning,
  OperationalControlStatus,
  Pool,
  SwapQuoteRequest,
} from '@/lib/types';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { LiveSourceMeta } from '@/components/ui/LiveSourceMeta';
import { usePools, useSwapQuoteProbe } from '@/lib/hooks/useMidgard';
import {
  AvailabilityCell,
  ChainAvailability,
  deriveChainAvailability,
  deriveNetworkWideControls,
  deriveRouteAvailability,
} from '@/lib/network-diagnostics';

type NetworkStatusBannerVariant = 'compact' | 'diagnostic';

const MAX_DISCLOSURE_KEYS = 80;

interface NetworkStatusBannerProps {
  result?: LiveDataResult<NetworkStatus>;
  isLoading?: boolean;
  variant?: NetworkStatusBannerVariant;
  showQuoteChecker?: boolean;
}

interface EvidenceRow {
  id: string;
  scope: string;
  impact: string;
  source: string;
  key: string;
  state: 'active' | 'scheduled' | 'warning-only';
}

type SwapStatusTone = 'open' | 'limited' | 'paused' | 'unknown';

interface SwapStatusPresentation {
  tone: SwapStatusTone;
  label: string;
  badge: string;
  summary: string;
  detail: string;
}

function uniqueStrings(values: string[]) {
  return Array.from(new Set(values));
}

function formatKeyCount(count: number) {
  return `${count} ${count === 1 ? 'key' : 'keys'}`;
}

function formatSourceRowCount(count: number) {
  return `${count} source ${count === 1 ? 'row' : 'rows'}`;
}

function formatWarningCount(count: number) {
  return `${count} source ${count === 1 ? 'warning' : 'warnings'}`;
}

function formatBlockAge(seconds: number): string {
  if (seconds < 0) {
    return `${formatBlockAge(Math.abs(seconds))} in future`;
  }
  if (seconds < 60) {
    return `${seconds} sec`;
  }
  if (seconds < 3600) {
    const minutes = Math.round(seconds / 60);
    return `${minutes} min`;
  }
  const hours = Math.round(seconds / 3600);
  return `${hours} ${hours === 1 ? 'hour' : 'hours'}`;
}

function isExactMimirKey(key: string) {
  return !key.includes('*');
}

function isEnablementControlKey(key: string) {
  return key === 'TRADEACCOUNTSENABLED' ||
    key === 'TRADEACCOUNTSDEPOSITENABLED' ||
    key === 'RUNEPOOLENABLED' ||
    key === 'BANKSENDENABLED';
}

function getControlStateLabel(key: string, state: string) {
  if (!isEnablementControlKey(key)) {
    if (state === 'active') {
      const upperKey = key.toUpperCase();
      if (upperKey.includes('DISABLED')) {
        return 'disabled';
      }
      if (upperKey.includes('PAUSE')) {
        return 'paused';
      }
      if (upperKey.includes('HALT')) {
        return 'halted';
      }
    }

    return state;
  }

  if (state === 'inactive') {
    return 'enabled';
  }

  if (state === 'disabled') {
    return 'disabled';
  }

  return state;
}

function getControlClassName(state: string, active: boolean) {
  if (active) {
    return 'border-amber-500/30 bg-amber-500/10 text-amber-300';
  }
  if (state === 'unparseable') {
    return 'border-amber-500/30 bg-amber-500/10 text-amber-200';
  }
  if (state === 'scheduled') {
    return 'border-sky-500/30 bg-sky-500/10 text-sky-200';
  }
  if (state === 'not-monitored') {
    return 'border-slate-700 bg-slate-900 text-slate-400';
  }
  return 'border-emerald-500/20 bg-emerald-500/5 text-emerald-300';
}

function getControlGroup(control: OperationalControlStatus) {
  const key = control.key.toUpperCase();
  if (key.includes('TCY') || key.includes('RUNEPOOL')) {
    return 'TCY and RUNEPool';
  }
  if (key.includes('SECURED')) {
    return 'Secured assets';
  }
  if (key.includes('WASM')) {
    return 'WASM/app layer';
  }
  if (key.includes('BOND') || key.includes('CHURN') || key.includes('OPERATOR') || key.includes('ORACLE')) {
    return 'Node operations';
  }
  if (key.includes('LP') || key.includes('LOAN') || key.includes('ASYM')) {
    return 'Liquidity';
  }
  if (key.includes('TRADE') || key.includes('BANKSEND') || key.includes('MEMOLESS') || key.includes('SWAP')) {
    return 'Trading and transfers';
  }
  return 'Signing and chain observation';
}

function getDashScopedChain(key: string, prefix: string) {
  const upperKey = key.toUpperCase();
  const upperPrefix = prefix.toUpperCase();
  return upperKey.startsWith(upperPrefix) ? upperKey.slice(upperPrefix.length).split('-')[0] : null;
}

function getEvidenceScope(key: string) {
  return getDashScopedChain(key, 'PAUSELPDEPOSIT-') ??
    getDashScopedChain(key, 'PAUSEASYMWITHDRAWAL-') ??
    getDashScopedChain(key, 'HALTSECUREDDEPOSIT-') ??
    getDashScopedChain(key, 'HALTSECUREDWITHDRAW-') ??
    (key.toUpperCase().startsWith('HALTWASM') ? 'WASM/app layer' : 'Network');
}

function getEvidenceImpact(key: string) {
  const upperKey = key.toUpperCase();
  if (upperKey.startsWith('PAUSELPDEPOSIT-')) {
    return 'LP deposit pause';
  }
  if (upperKey.startsWith('PAUSEASYMWITHDRAWAL-')) {
    return 'Asym withdrawal pause';
  }
  if (upperKey.startsWith('HALTSECUREDDEPOSIT-')) {
    return 'Secured deposit halt';
  }
  if (upperKey.startsWith('HALTSECUREDWITHDRAW-')) {
    return 'Secured withdrawal halt';
  }
  if (upperKey.startsWith('HALTWASMDEPLOYER-')) {
    return 'WASM deployer halt';
  }
  if (upperKey.startsWith('HALTWASMCS-')) {
    return 'WASM checksum halt';
  }
  if (upperKey.startsWith('HALTWASMCONTRACT-')) {
    return 'WASM contract halt';
  }
  if (upperKey === 'NODEPAUSECHAINGLOBAL') {
    return 'Node chain pause';
  }
  return 'Monitored control flag';
}

function getInboundEvidenceImpact(field: string) {
  switch (field) {
    case 'halted':
      return 'Inbound halted flag';
    case 'global_trading_paused':
      return 'Inbound global trading pause';
    case 'chain_trading_paused':
      return 'Inbound chain trading pause';
    case 'chain_lp_actions_paused':
      return 'Inbound LP action pause';
    default:
      return 'Inbound operation flag';
  }
}

function parseWarningKeys(message: string) {
  const [, rawKeys] = message.split(':');
  if (!rawKeys) {
    return [];
  }
  return rawKeys
    .replace(/\.$/, '')
    .split(',')
    .map((key) => key.trim())
    .filter(Boolean);
}

function fallbackWarningDetail(message: string): NetworkStatusSourceWarning {
  const category = message.includes('Unknown operation-like')
    ? 'unknown-operation'
    : message.includes('Known operational-support')
      ? 'mimir-support'
      : message.includes('Unknown chain-scoped')
        ? 'unknown-chain'
        : message.includes('could not be parsed')
          ? 'mimir-parse'
          : message.includes('latest block timestamp')
            ? 'freshness'
            : message.includes('omitted') || message.includes('missing') || message.includes('did not include')
              ? 'source-shape'
              : 'other';
  const keys = category === 'unknown-operation' || category === 'unknown-chain' || category === 'mimir-support'
    ? parseWarningKeys(message)
    : [];

  return {
    severity: category === 'unknown-operation' || category === 'unknown-chain' || category === 'mimir-support' ? 'review' : 'warning',
    category,
    message,
    action: 'Review this source warning before treating the live status as clean.',
    ...(keys.length > 0 ? { keys } : {}),
  };
}

function getWarningDetails(status: NetworkStatus | undefined) {
  if (!status) {
    return [];
  }
  return status.sourceWarningDetails?.length
    ? status.sourceWarningDetails
    : status.sourceWarnings.map(fallbackWarningDetail);
}

function getWarningTitle(detail: NetworkStatusSourceWarning) {
  if ((detail.category === 'unknown-operation' || detail.category === 'unknown-chain') && detail.keys?.length) {
    return `${detail.keys.length} ${detail.category === 'unknown-operation' ? 'operation-like' : 'chain-scoped'} Mimir ${detail.keys.length === 1 ? 'key needs' : 'keys need'} review.`;
  }
  if (detail.category === 'mimir-support' && detail.keys?.length) {
    return `${detail.keys.length} operational-support Mimir ${detail.keys.length === 1 ? 'key is' : 'keys are'} present.`;
  }
  if (detail.category === 'mimir-parse' && detail.keys?.length) {
    return `${formatKeyCount(detail.keys.length)} monitored Mimir ${detail.keys.length === 1 ? 'key was' : 'keys were'} unparseable.`;
  }
  return detail.message;
}

function getWarningTone(detail: NetworkStatusSourceWarning) {
  if (detail.severity === 'review') {
    return 'border-slate-700 bg-slate-900/70 text-slate-300';
  }
  if (detail.severity === 'critical') {
    return 'border-red-500/25 bg-red-500/10 text-red-200';
  }
  return 'border-amber-500/25 bg-amber-500/10 text-amber-200';
}

function hasKeyLikeWarning(detail: NetworkStatusSourceWarning) {
  return detail.category === 'unknown-operation' ||
    detail.category === 'unknown-chain' ||
    detail.category === 'mimir-support' ||
    detail.category === 'mimir-parse';
}

function getDisclosureKeys(keys: string[] | undefined) {
  const allKeys = keys ?? [];
  const visibleKeys = allKeys.slice(0, MAX_DISCLOSURE_KEYS);
  return {
    visibleKeys,
    hiddenCount: Math.max(0, allKeys.length - visibleKeys.length),
  };
}

function getActionSummary(status: NetworkStatus | undefined, chainAvailability: ChainAvailability[]) {
  if (!status) {
    return [];
  }
  const activeControls = status.monitoredControls
    .filter((control) => control.active)
    .map((control) => `${control.label}: ${getControlStateLabel(control.key, control.state)}`);
  const directChainActions = chainAvailability
    .filter((chain) => chain.operationLimited)
    .flatMap((chain) => [
      ...chain.swapIn.reasons,
      ...chain.swapOut.reasons,
      ...chain.lpActions.reasons,
      ...chain.poolDeposits.reasons,
    ]);
  return uniqueStrings([...activeControls, ...directChainActions]);
}

function formatList(values: string[]) {
  if (values.length <= 1) {
    return values[0] ?? '';
  }
  if (values.length === 2) {
    return `${values[0]} and ${values[1]}`;
  }
  return `${values.slice(0, -1).join(', ')}, and ${values[values.length - 1]}`;
}

function pluralize(value: number, singular: string, plural = `${singular}s`) {
  return `${value} ${value === 1 ? singular : plural}`;
}

function getUpperKeySet(keys: string[] | undefined) {
  return new Set((keys ?? []).map((key) => key.toUpperCase()));
}

function getSwapStatusPresentation(
  status: NetworkStatus | undefined,
  chainAvailability: ChainAvailability[]
): SwapStatusPresentation {
  if (!status) {
    return {
      tone: 'unknown',
      label: 'Unavailable',
      badge: 'unavailable',
      summary: 'Current-only THORNode swap status is unavailable.',
      detail: 'No live swap controls were available.',
    };
  }
  if (status.state === 'unknown') {
    return {
      tone: 'unknown',
      label: 'Unknown',
      badge: 'unknown',
      summary: status.summary || 'THORNode status could not be classified.',
      detail: 'Live swap controls could not be classified.',
    };
  }

  const activeControlKeys = getUpperKeySet(status.activeControlKeys);
  const activeEvidenceKeys = getUpperKeySet(status.activeEvidenceKeys);
  const blockingControls = [
    activeControlKeys.has('HALTTRADING') ? 'global trading' : null,
    activeControlKeys.has('HALTSIGNING') ? 'global signing' : null,
    activeControlKeys.has('HALTCHAINGLOBAL') ? 'global chain observation' : null,
    activeControlKeys.has('NODEPAUSECHAINGLOBAL') || activeEvidenceKeys.has('NODEPAUSECHAINGLOBAL') ? 'node chain pause' : null,
  ].filter((control): control is string => control !== null);
  const limitedControls = [
    status.streamingSwapsPaused === true ? 'streaming swaps' : null,
    status.manualSwapsToSynthDisabled === true ? 'manual synth swaps' : null,
    status.tcyTradingPaused === true ? 'TCY trading' : null,
  ].filter((control): control is string => control !== null);
  const routeLimitedChains = chainAvailability.filter((presentation) => presentation.swapLimited);

  if (blockingControls.length > 0) {
    const controls = formatList(blockingControls);
    return {
      tone: 'paused',
      label: 'Swaps paused',
      badge: 'swap paused',
      summary: `${controls} ${blockingControls.length === 1 ? 'is' : 'are'} active in current THORNode data; treat swap availability as paused until diagnostics clear.`,
      detail: `${blockingControls.length} blocking swap control${blockingControls.length === 1 ? '' : 's'}`,
    };
  }

  if (routeLimitedChains.length > 0 || limitedControls.length > 0) {
    const constraints = [
      routeLimitedChains.length > 0 ? `${pluralize(routeLimitedChains.length, 'chain')} with direct trading, signing, or chain-halt evidence` : null,
      limitedControls.length > 0 ? formatList(limitedControls) : null,
    ].filter((constraint): constraint is string => constraint !== null);

    return {
      tone: 'limited',
      label: 'Some routes limited',
      badge: 'limited',
      summary: `No global swap halt is active, but ${formatList(constraints)} should be reviewed before assuming a pair is available.`,
      detail: routeLimitedChains.length > 0
        ? `${routeLimitedChains.map((chain) => chain.chain).join(', ')} limited`
        : formatList(limitedControls),
    };
  }

  if (status.state === 'paused') {
    return {
      tone: 'open',
      label: 'Swaps appear open',
      badge: 'swap open',
      summary: 'No global swap halt is active in current THORNode data; the active pauses are outside ordinary swap execution.',
      detail: 'Other operations may be paused',
    };
  }

  return {
    tone: 'open',
    label: 'Swaps appear open',
    badge: 'swap open',
    summary: 'No global swap halt is active in current THORNode data.',
    detail: 'No swap halt observed',
  };
}

function renderControlChip(control: OperationalControlStatus) {
  return (
    <span
      key={control.key}
      title={control.description}
      className={`rounded border px-2 py-1 text-[11px] ${getControlClassName(control.state, control.active)}`}
    >
      {control.label}: {getControlStateLabel(control.key, control.state)}
    </span>
  );
}

function statusCellClassName(cell: AvailabilityCell) {
  switch (cell.state) {
    case 'available':
      return 'border-emerald-500/20 bg-emerald-500/5 text-emerald-300';
    case 'blocked':
      return 'border-red-500/25 bg-red-500/10 text-red-200';
    case 'limited':
      return 'border-amber-500/25 bg-amber-500/10 text-amber-200';
    case 'needs-review':
      return 'border-sky-500/25 bg-sky-500/10 text-sky-200';
    default:
      return 'border-slate-700 bg-slate-900 text-slate-400';
  }
}

function renderStatusCell(cell: AvailabilityCell) {
  return (
    <span className={`inline-flex rounded border px-2 py-1 text-[11px] font-medium ${statusCellClassName(cell)}`}>
      {cell.label}
    </span>
  );
}

function firstReasonText(reasons: string[]) {
  if (reasons.length === 0) {
    return 'No active chain-specific swap blocker observed.';
  }
  return reasons.slice(0, 2).join(' / ');
}

function firstSwapReasonText(chain: ChainAvailability) {
  return firstReasonText(chain.swapReasons);
}

const BASE_UNIT_DECIMALS = 8;
const BASE_UNIT_SCALE = BigInt(100000000);

function assetChain(asset: string) {
  return asset.split('.')[0]?.toUpperCase() ?? 'Other';
}

function quoteAmountToBaseUnits(amount: string) {
  const trimmed = amount.trim();
  if (!/^\d+(?:\.\d{0,8})?$/.test(trimmed)) {
    return null;
  }
  const [wholePart, fractionPart = ''] = trimmed.split('.');
  const whole = BigInt(wholePart);
  const fractional = BigInt(fractionPart.padEnd(BASE_UNIT_DECIMALS, '0'));
  const units = whole * BASE_UNIT_SCALE + fractional;
  return units > BigInt(0) ? units.toString() : null;
}

function formatBaseUnitAmount(baseUnits: string | undefined, asset: string) {
  if (!baseUnits) {
    return 'Unavailable';
  }
  try {
    const value = BigInt(baseUnits);
    const whole = value / BASE_UNIT_SCALE;
    const fractional = value % BASE_UNIT_SCALE;
    const fractionalText = fractional.toString().padStart(BASE_UNIT_DECIMALS, '0').replace(/0+$/, '');
    return `${whole.toString()}${fractionalText ? `.${fractionalText}` : ''} ${asset}`;
  } catch {
    return baseUnits;
  }
}

function formatQuoteDuration(seconds: number | undefined) {
  if (seconds === undefined) {
    return 'Unavailable';
  }
  if (seconds < 60) {
    return `${seconds} sec`;
  }
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return remainingSeconds > 0 ? `${minutes} min ${remainingSeconds} sec` : `${minutes} min`;
}

function formatQuoteExpiry(expiry: number | undefined) {
  if (expiry === undefined) {
    return 'Unavailable';
  }
  return new Date(expiry * 1000).toLocaleTimeString();
}

function quoteStatusClassName(status: ReturnType<typeof deriveRouteAvailability>['status']) {
  switch (status) {
    case 'available':
      return 'border-emerald-500/25 bg-emerald-500/10 text-emerald-200';
    case 'blocked':
      return 'border-red-500/25 bg-red-500/10 text-red-200';
    case 'limited':
      return 'border-amber-500/25 bg-amber-500/10 text-amber-200';
    case 'needs-review':
      return 'border-sky-500/25 bg-sky-500/10 text-sky-200';
    default:
      return 'border-slate-700 bg-slate-900 text-slate-300';
  }
}

function groupPoolsByChain(pools: Pool[] | undefined) {
  const groups = new Map<string, Pool[]>();
  for (const pool of pools ?? []) {
    if (!pool.asset || pool.status.toLowerCase() !== 'available') {
      continue;
    }
    const chain = assetChain(pool.asset);
    groups.set(chain, [...(groups.get(chain) ?? []), pool]);
  }
  return [...groups.entries()]
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([chain, chainPools]) => [
      chain,
      chainPools.sort((left, right) => left.asset.localeCompare(right.asset)),
    ] as const);
}

function pickDefaultAsset(pools: Pool[] | undefined, preferred: string, fallbackIndex: number) {
  const availablePools = (pools ?? []).filter((pool) => pool.status.toLowerCase() === 'available');
  return availablePools.find((pool) => pool.asset === preferred)?.asset ?? availablePools[fallbackIndex]?.asset ?? '';
}

function routeFallbackStatusLabel(routeStatus: ReturnType<typeof deriveRouteAvailability>) {
  return (
    <div className={`rounded-md border px-3 py-2 text-xs ${quoteStatusClassName(routeStatus.status)}`}>
      <p className="font-semibold">{routeStatus.label}</p>
      {routeStatus.reasons.length > 0 && (
        <p className="mt-1 text-slate-300/80">{routeStatus.reasons.slice(0, 2).join(' / ')}</p>
      )}
    </div>
  );
}

function RouteQuoteChecker({ status }: { status: NetworkStatus | undefined }) {
  const { data: pools, result: poolsResult, isLoading: poolsLoading } = usePools();
  const poolGroups = useMemo(() => groupPoolsByChain(pools), [pools]);
  const defaultFromAsset = useMemo(() => pickDefaultAsset(pools, 'BTC.BTC', 0), [pools]);
  const defaultToAsset = useMemo(() => pickDefaultAsset(pools?.filter((pool) => pool.asset !== defaultFromAsset), 'ETH.ETH', 0), [pools, defaultFromAsset]);
  const [fromAsset, setFromAsset] = useState('');
  const [toAsset, setToAsset] = useState('');
  const [amount, setAmount] = useState('0.01');
  const [quoteRequest, setQuoteRequest] = useState<SwapQuoteRequest | null>(null);
  const [quoteRequestVersion, setQuoteRequestVersion] = useState(0);
  const [lastSubmittedAt, setLastSubmittedAt] = useState(0);
  const [inputError, setInputError] = useState<string | null>(null);
  const selectedFromAsset = fromAsset || defaultFromAsset;
  const selectedToAsset = toAsset || defaultToAsset;
  const amountBaseUnits = quoteAmountToBaseUnits(amount);
  const quoteResult = useSwapQuoteProbe(quoteRequest, quoteRequest !== null, quoteRequestVersion);
  const quoteData = quoteResult.result?.data;
  const activeQuoteData = quoteData &&
    quoteData.request.fromAsset === selectedFromAsset &&
    quoteData.request.toAsset === selectedToAsset &&
    quoteData.request.amountBaseUnits === amountBaseUnits
    ? quoteData
    : undefined;
  const routeStatus = deriveRouteAvailability(
    selectedFromAsset,
    selectedToAsset,
    status,
    pools,
    activeQuoteData
  );
  const canSubmit = Boolean(selectedFromAsset && selectedToAsset && selectedFromAsset !== selectedToAsset && amountBaseUnits && !quoteResult.isLoading);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const now = Date.now();
    if (now - lastSubmittedAt < 1000) {
      setInputError('Quote checks are throttled to about one request per second.');
      return;
    }
    if (!selectedFromAsset || !selectedToAsset) {
      setInputError('Choose two assets before checking a route.');
      return;
    }
    if (selectedFromAsset === selectedToAsset) {
      setInputError('Choose two different assets.');
      return;
    }
    if (!amountBaseUnits) {
      setInputError('Enter a positive amount with up to 8 decimals.');
      return;
    }

    setInputError(null);
    setLastSubmittedAt(now);
    setQuoteRequest({
      fromAsset: selectedFromAsset,
      toAsset: selectedToAsset,
      amountBaseUnits,
    });
    setQuoteRequestVersion((version) => version + 1);
  }

  return (
    <section className="mt-4 rounded-md border border-border bg-surface/60 p-3" aria-labelledby="route-check-heading">
      <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
        <div>
          <h3 id="route-check-heading" className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Check A Route
          </h3>
          <p className="mt-1 max-w-3xl text-[11px] leading-relaxed text-slate-400">
            On-demand THORNode quote probe. It uses assets and amount only, does not collect a wallet address, and is not a send instruction.
          </p>
        </div>
        <div className="min-w-52">
          <LiveSourceMeta result={activeQuoteData ? quoteResult.result : poolsResult} />
        </div>
      </div>

      <form className="mt-3 grid gap-2 lg:grid-cols-[1fr_1fr_0.8fr_auto]" onSubmit={handleSubmit}>
        <label className="text-xs text-slate-300">
          <span className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-slate-500">From asset</span>
          <select
            value={selectedFromAsset}
            onChange={(event) => setFromAsset(event.target.value)}
            className="w-full rounded-md border border-border bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none transition-colors focus:border-accent"
            disabled={poolsLoading || poolGroups.length === 0}
          >
            {poolGroups.length === 0 ? (
              <option value="">Pools unavailable</option>
            ) : poolGroups.map(([chain, chainPools]) => (
              <optgroup key={`from:${chain}`} label={chain}>
                {chainPools.map((pool) => (
                  <option key={`from:${pool.asset}`} value={pool.asset}>{pool.asset}</option>
                ))}
              </optgroup>
            ))}
          </select>
        </label>
        <label className="text-xs text-slate-300">
          <span className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-slate-500">To asset</span>
          <select
            value={selectedToAsset}
            onChange={(event) => setToAsset(event.target.value)}
            className="w-full rounded-md border border-border bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none transition-colors focus:border-accent"
            disabled={poolsLoading || poolGroups.length === 0}
          >
            {poolGroups.length === 0 ? (
              <option value="">Pools unavailable</option>
            ) : poolGroups.map(([chain, chainPools]) => (
              <optgroup key={`to:${chain}`} label={chain}>
                {chainPools.map((pool) => (
                  <option key={`to:${pool.asset}`} value={pool.asset}>{pool.asset}</option>
                ))}
              </optgroup>
            ))}
          </select>
        </label>
        <label className="text-xs text-slate-300">
          <span className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-slate-500">Amount</span>
          <input
            value={amount}
            onChange={(event) => setAmount(event.target.value)}
            inputMode="decimal"
            className="w-full rounded-md border border-border bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none transition-colors focus:border-accent"
            aria-invalid={Boolean(inputError || (amount && !amountBaseUnits))}
          />
        </label>
        <div className="flex items-end">
          <button
            type="submit"
            disabled={!canSubmit}
            className="w-full rounded-md border border-accent/40 bg-accent/10 px-3 py-2 text-sm font-semibold text-accent transition-colors hover:border-rune hover:text-rune disabled:cursor-not-allowed disabled:border-slate-700 disabled:bg-slate-900 disabled:text-slate-500"
          >
            {quoteResult.isLoading ? 'Checking' : 'Check route'}
          </button>
        </div>
      </form>

      {(inputError || (amount && !amountBaseUnits)) && (
        <p className="mt-2 text-xs text-amber-200">{inputError ?? 'Enter a positive amount with up to 8 decimals.'}</p>
      )}

      <div className="mt-3">
        {routeFallbackStatusLabel(routeStatus)}
      </div>

      {activeQuoteData?.quote && (
        <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {[
            ['Expected output', formatBaseUnitAmount(activeQuoteData.quote.expectedAmountOut, selectedToAsset)],
            ['Total fee bps', activeQuoteData.quote.fees.totalBps?.toString() ?? 'Unavailable'],
            ['Slippage bps', activeQuoteData.quote.fees.slippageBps?.toString() ?? 'Unavailable'],
            ['Recommended min input', formatBaseUnitAmount(activeQuoteData.quote.recommendedMinAmountIn, selectedFromAsset)],
            ['Estimated time', formatQuoteDuration(activeQuoteData.quote.totalSwapSeconds)],
            ['Quote expiry', formatQuoteExpiry(activeQuoteData.quote.expiry)],
          ].map(([label, value]) => (
            <div key={label} className="rounded-md border border-border bg-slate-950/30 px-3 py-2">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">{label}</p>
              <p className="mt-1 text-sm font-semibold text-slate-200">{value}</p>
            </div>
          ))}
          {activeQuoteData.quote.warning && (
            <div className="rounded-md border border-amber-500/25 bg-amber-500/10 px-3 py-2 sm:col-span-2 lg:col-span-3">
              <p className="text-xs font-semibold text-amber-200">Quote warning</p>
              <p className="mt-1 text-xs text-amber-100/80">{activeQuoteData.quote.warning}</p>
            </div>
          )}
        </div>
      )}

      {activeQuoteData?.failure && (
        <div className="mt-3 rounded-md border border-amber-500/25 bg-amber-500/10 px-3 py-2 text-xs text-amber-100">
          <p className="font-semibold">{activeQuoteData.failure.message}</p>
          <p className="mt-1 text-amber-100/70">The route probe failed before wallet-specific send instructions were needed.</p>
        </div>
      )}

      {activeQuoteData && (
        <details className="mt-3 rounded-md border border-border bg-slate-950/30">
          <summary className="cursor-pointer list-none px-3 py-2 text-xs font-semibold text-slate-300">
            Raw quote response
          </summary>
          <div className="border-t border-border px-3 py-3">
            <p className="mb-2 text-[11px] text-slate-400">
              Diagnostic only. Do not use raw quote fields as wallet send instructions from this wiki.
            </p>
            <pre className="max-h-80 overflow-auto rounded border border-slate-800 bg-slate-950 p-2 text-[10px] leading-relaxed text-slate-300">
              {JSON.stringify(activeQuoteData.quote?.raw ?? activeQuoteData.failure?.raw ?? activeQuoteData, null, 2)}
            </pre>
          </div>
        </details>
      )}
    </section>
  );
}

function chunkControlsByGroup(controls: OperationalControlStatus[]) {
  const groups = new Map<string, OperationalControlStatus[]>();
  for (const control of controls) {
    const group = getControlGroup(control);
    groups.set(group, [...(groups.get(group) ?? []), control]);
  }
  return [...groups.entries()];
}

export function NetworkStatusBanner({ result, isLoading = false, variant = 'diagnostic', showQuoteChecker = false }: NetworkStatusBannerProps) {
  const status = result?.data;
  const isPaused = status?.state === 'paused';
  const isDegraded = result?.status === 'degraded' || status?.state === 'degraded';
  const isUnknown = status?.state === 'unknown';
  const isUnavailable = (!result || !status) && !isLoading;
  const hasInvalidMimirKeys = Boolean(status && status.invalidMimirKeys.length > 0);
  const warningDetails = getWarningDetails(status);
  const hasSourceWarnings = Boolean(status && (hasInvalidMimirKeys || status.sourceWarnings.length > 0 || warningDetails.length > 0));
  const scheduledMimirKeys = status?.scheduledMimirKeys ?? [];
  const hasScheduledMimirKeys = scheduledMimirKeys.length > 0;
  const scheduledControls = status?.monitoredControls.filter((control) => control.state === 'scheduled') ?? [];
  const hasTrustWarning = isPaused || isDegraded || isUnknown || isUnavailable || hasSourceWarnings || hasScheduledMimirKeys;
  const activeControlKeys = status?.activeControlKeys ?? status?.activePauseKeys ?? [];
  const sourceMetaResult: LiveDataResult<NetworkStatus> | undefined = result && status && hasSourceWarnings && result.status === 'ok'
    ? { ...result, status: 'degraded' }
    : result;
  const chainAvailability = deriveChainAvailability(status);
  const networkWideControls = deriveNetworkWideControls(status);
  const swapLimitedChains = chainAvailability.filter((chain) => chain.swapLimited);
  const operationAffectedChains = chainAvailability.filter((chain) => chain.operationLimited);
  const activeActions = getActionSummary(status, chainAvailability);
  const swapStatus = getSwapStatusPresentation(status, chainAvailability);
  const keyReviewCount = warningDetails
    .filter(hasKeyLikeWarning)
    .reduce((count, warning) => count + (warning.keys?.length ?? 0), 0);
  const highPriorityWarnings = warningDetails.filter((warning) => warning.severity !== 'review');
  const priorityControls = status?.monitoredControls.filter((control) => (
    control.active ||
    control.state === 'disabled' ||
    control.state === 'scheduled' ||
    control.state === 'unparseable'
  )) ?? [];
  const secondaryControls = status?.monitoredControls.filter((control) => !priorityControls.includes(control)) ?? [];

  const chainsWithEvidence = (status?.chainStatuses ?? [])
    .map((chain) => ({
      chain: chain.chain,
      mimirKeys: uniqueStrings([
        ...chain.activeMimirKeys,
        ...chain.lpDepositPauseKeys,
        ...(chain.securedAssetDepositPauseKeys ?? []),
        ...(chain.securedAssetWithdrawPauseKeys ?? []),
        ...(chain.asymWithdrawalPauseKeys ?? []),
      ]),
      inboundFields: chain.inboundAddressEvidenceFields ?? [],
    }))
    .filter((chain) => chain.mimirKeys.length > 0 || chain.inboundFields.length > 0);
  const activeEvidenceKeys = status?.activeEvidenceKeys ?? [...new Set(chainsWithEvidence.flatMap((chain) => chain.mimirKeys))];
  const chainEvidenceKeySet = new Set(chainsWithEvidence.flatMap((chain) => chain.mimirKeys));
  const controlEvidenceRows: EvidenceRow[] = activeControlKeys
    .filter((key) => isExactMimirKey(key) && !chainEvidenceKeySet.has(key))
    .map((key) => ({
      id: `control:${key}`,
      scope: 'Network',
      impact: 'Monitored control flag',
      source: 'Mimir',
      key,
      state: 'active',
    }));
  const chainMimirEvidenceRows: EvidenceRow[] = chainsWithEvidence.flatMap((chain) => (
    chain.mimirKeys.map((key) => ({
      id: `${chain.chain}:${key}`,
      scope: chain.chain,
      impact: getEvidenceImpact(key),
      source: 'Mimir',
      key,
      state: 'active' as const,
    }))
  ));
  const inboundEvidenceRows: EvidenceRow[] = chainsWithEvidence.flatMap((chain) => (
    chain.inboundFields.map((field) => ({
      id: `${chain.chain}:inbound:${field}`,
      scope: chain.chain,
      impact: getInboundEvidenceImpact(field),
      source: 'inbound_addresses',
      key: `THORNode inbound_addresses.${field}`,
      state: 'active' as const,
    }))
  ));
  const describedEvidenceKeys = new Set([
    ...controlEvidenceRows.map((row) => row.key),
    ...chainMimirEvidenceRows.map((row) => row.key),
  ]);
  const scopedEvidenceRows: EvidenceRow[] = activeEvidenceKeys
    .filter((key) => !describedEvidenceKeys.has(key))
    .map((key) => ({
      id: `scoped:${key}`,
      scope: getEvidenceScope(key),
      impact: getEvidenceImpact(key),
      source: 'Mimir',
      key,
      state: 'active',
    }));
  const evidenceRows = [...controlEvidenceRows, ...chainMimirEvidenceRows, ...inboundEvidenceRows, ...scopedEvidenceRows];
  const evidenceCount = evidenceRows.length;
  const Icon = hasTrustWarning ? AlertTriangle : CheckCircle2;
  const primaryBadgeVariant = swapStatus.tone === 'open'
    ? 'success'
    : swapStatus.tone === 'paused'
      ? 'danger'
      : 'warning';
  const title = isLoading
    ? 'Checking live network status'
    : isUnavailable
      ? 'Network status unavailable'
      : isUnknown
        ? 'Network status unknown'
        : swapStatus.tone === 'paused' && hasSourceWarnings
          ? 'Swap controls need source review'
          : swapStatus.tone === 'paused'
            ? 'Swap controls are paused'
            : swapStatus.tone === 'limited' && hasSourceWarnings
              ? 'Some routes limited; source review needed'
              : swapStatus.tone === 'limited'
                ? 'Some routes may be limited'
                : isPaused && hasSourceWarnings
                  ? 'Swaps appear open; other operations need review'
                  : isPaused
                    ? 'Swaps appear open; other operations paused'
                    : isDegraded || hasSourceWarnings
                      ? 'Ordinary swap status needs source review'
                      : hasScheduledMimirKeys
                        ? 'Live sources show scheduled Mimir controls'
                        : 'Live sources show no global halt flags';
  const summary = isLoading
    ? 'Fetching THORNode Mimir, inbound-address, version, and block evidence.'
    : result?.error ?? (isUnavailable ? 'Current-only THORNode status is unavailable.' : swapStatus.summary);
  const compact = variant === 'compact';
  const routeScopeValue = status
    ? swapStatus.tone === 'paused'
      ? 'Global swap halt'
      : swapLimitedChains.length > 0
        ? swapLimitedChains.map((chain) => chain.chain).join(', ')
        : 'No swap-limited chains'
    : 'Unavailable';
  const routeScopeDetail = status
    ? swapStatus.tone === 'paused'
      ? operationAffectedChains.length > 0
        ? `${operationAffectedChains.length} chain status${operationAffectedChains.length === 1 ? '' : 'es'} with direct operation impacts`
        : 'Global control applies before per-chain routing'
      : swapLimitedChains.length > 0
        ? swapLimitedChains.map((chain) => `${chain.chain}: ${firstSwapReasonText(chain)}`).join(' / ')
        : 'No chain-specific swap blockers observed'
    : null;

  return (
    <Card
      className={hasTrustWarning ? 'border-amber-500/30 bg-surface-elevated' : 'border-emerald-500/20'}
    >
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex gap-3">
          <div className={hasTrustWarning ? 'mt-0.5 text-amber-300' : 'mt-0.5 text-emerald-300'}>
            <Icon className="h-5 w-5" />
          </div>
          <div role="status" aria-live="polite" aria-atomic="true" aria-busy={isLoading}>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-sm font-semibold">{title}</h2>
              {status?.state && (
                <Badge variant={primaryBadgeVariant}>
                  {swapStatus.badge}
                </Badge>
              )}
              {hasSourceWarnings && (
                <Badge variant="warning">Source warning</Badge>
              )}
            </div>
            <p className="mt-1 max-w-4xl text-sm text-slate-400">{summary}</p>
            {highPriorityWarnings.length > 0 && (
              <div className="mt-2 grid gap-2 md:grid-cols-2">
                {highPriorityWarnings.slice(0, compact ? 1 : 2).map((warning) => (
                  <div key={`${warning.category}:${warning.message}`} className={`rounded-md border px-2.5 py-2 text-xs ${getWarningTone(warning)}`}>
                    <p className="font-semibold">{getWarningTitle(warning)}</p>
                    <p className="mt-1 text-slate-300/80">{warning.action}</p>
                  </div>
                ))}
              </div>
            )}
            {keyReviewCount > 0 && (
              <p className="mt-2 text-xs text-slate-400">
                {formatKeyCount(keyReviewCount)} {keyReviewCount === 1 ? 'needs' : 'need'} Mimir review; exact raw keys stay in diagnostics, not the headline.
              </p>
            )}
            {status && swapLimitedChains.length > 0 && (
              <p className="mt-2 text-xs font-medium text-amber-200">
                {formatList(swapLimitedChains.map((chain) => chain.chain))} {swapLimitedChains.length === 1 ? 'is' : 'are'} swap-limited.
              </p>
            )}
          </div>
        </div>
        <div className="min-w-52">
          <LiveSourceMeta result={sourceMetaResult} />
          {status?.thorNodeVersion && (
            <p className="mt-1 text-[11px] text-slate-400">THORNode {status.thorNodeVersion}</p>
          )}
          {status?.thorchainHeight && (
            <p className="mt-1 text-[11px] text-slate-400">
              THORChain height {status.thorchainHeight}
              {status.thorchainSnapshotPinned === false ? ' / snapshot unpinned' : ''}
              {status.thorchainBlockTime ? ` / block time ${new Date(status.thorchainBlockTime).toLocaleTimeString()}` : ''}
              {status.thorchainBlockAgeSeconds !== undefined ? ` / Block age ${formatBlockAge(status.thorchainBlockAgeSeconds)}` : ''}
              {status.thorchainLastblockSpread !== undefined && status.thorchainLastblockSpread > 0 ? ` / lastblock spread ${status.thorchainLastblockSpread} blocks` : ''}
            </p>
          )}
        </div>
      </div>

      <div className="mt-4">
        <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
          Look here first
        </p>
        <div className="grid gap-2 md:grid-cols-4" aria-label="Look here first">
          <div className="rounded-md border border-border bg-surface/50 px-3 py-2">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Ordinary swaps</p>
            <p className="mt-1 text-sm font-semibold">
              {isLoading ? 'Checking' : isUnavailable ? 'Unavailable' : swapStatus.label}
            </p>
            {status && (
              <p className="mt-1 text-[11px] leading-relaxed text-slate-500">{swapStatus.detail}</p>
            )}
          </div>
          <div className="rounded-md border border-border bg-surface/50 px-3 py-2">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Limited chains</p>
            <p className="mt-1 text-sm font-semibold">
              {status ? swapLimitedChains.length > 0 ? swapLimitedChains.map((chain) => chain.chain).join(', ') : 'None observed' : 'Unavailable'}
            </p>
            {status && swapLimitedChains.length > 0 && (
              <p className="mt-1 text-[11px] leading-relaxed text-slate-500">
                {swapLimitedChains.map((chain) => `${chain.chain}: ${firstSwapReasonText(chain)}`).join(' / ')}
              </p>
            )}
          </div>
          <div className="rounded-md border border-border bg-surface/50 px-3 py-2">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Other operations</p>
            <p className="mt-1 text-sm font-semibold">
              {status ? activeActions.length > 0 ? activeActions.slice(0, 2).join(', ') : 'None observed' : 'Unavailable'}
            </p>
            {status && routeScopeDetail && (
              <p className="mt-1 text-[11px] leading-relaxed text-slate-500">
                {routeScopeValue}
              </p>
            )}
          </div>
          <div className="rounded-md border border-border bg-surface/50 px-3 py-2">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Data quality</p>
            <p className="mt-1 text-sm font-semibold">{status ? warningDetails.length > 0 ? formatWarningCount(warningDetails.length) : 'Sources clean' : 'Pending'}</p>
          </div>
        </div>
      </div>

      {status && activeActions.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2" aria-label="Top affected actions">
          {swapLimitedChains.map((chain) => (
            <span key={`limited:${chain.chain}`} className="rounded-md border border-amber-500/25 bg-amber-500/10 px-2 py-1 text-[11px] font-medium text-amber-100">
              {chain.chain}: {firstSwapReasonText(chain)}
            </span>
          ))}
          {activeActions.slice(0, compact ? 4 : 8).map((action) => (
            <span key={action} className="rounded-md border border-amber-500/25 bg-amber-500/10 px-2 py-1 text-[11px] text-amber-200">
              {action}
            </span>
          ))}
        </div>
      )}

      {compact && (
        <div className="mt-4 flex flex-col gap-2 border-t border-border pt-3 text-xs text-slate-400 sm:flex-row sm:items-center sm:justify-between">
          <span>
            Compact view hides raw Mimir keys. Use Network diagnostics for exact evidence and grouped controls.
          </span>
          <Link href="/network" className="font-semibold text-accent transition-colors hover:text-rune">
            Open diagnostics
          </Link>
        </div>
      )}

      {!compact && status && warningDetails.length > 0 && (
        <details className="mt-4 rounded-md border border-amber-500/20 bg-amber-500/5">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-3 py-2 text-xs font-semibold text-amber-200">
            <span>Source warnings and Mimir review queue</span>
            <span className="shrink-0 text-[11px] font-normal text-amber-300/80">{formatWarningCount(warningDetails.length)}</span>
          </summary>
          <div className="space-y-2 border-t border-amber-500/20 px-3 py-3">
            {warningDetails.map((warning) => {
              const { visibleKeys, hiddenCount } = getDisclosureKeys(warning.keys);
              return (
                <div key={`${warning.category}:${warning.message}`} className={`rounded-md border p-2 text-xs ${getWarningTone(warning)}`}>
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant={warning.severity === 'review' ? 'default' : warning.severity === 'critical' ? 'danger' : 'warning'}>
                      {warning.category}
                    </Badge>
                    <p className="font-semibold">{getWarningTitle(warning)}</p>
                  </div>
                  <p className="mt-1 text-slate-300/80">{warning.action}</p>
                  {warning.scopes?.length ? (
                    <p className="mt-1 text-[11px] text-slate-400">Scope: {warning.scopes.join(', ')}</p>
                  ) : null}
                  {warning.keys?.length ? (
                    <details className="mt-2 rounded border border-slate-700 bg-slate-950/40">
                      <summary className="cursor-pointer list-none px-2 py-1 text-[11px] font-semibold text-slate-300">
                        Show {formatKeyCount(warning.keys.length)}
                      </summary>
                      <div className="flex flex-wrap gap-1.5 border-t border-slate-700 p-2">
                        {visibleKeys.map((key) => (
                          <code key={key} className="break-all rounded border border-slate-700 bg-slate-950 px-1.5 py-1 text-[10px] text-amber-200">
                            {key}
                          </code>
                        ))}
                        {hiddenCount > 0 && (
                          <span className="rounded border border-slate-700 bg-slate-950 px-1.5 py-1 text-[10px] text-slate-400">
                            {hiddenCount} more keys hidden from the rendered page; source remains degraded.
                          </span>
                        )}
                      </div>
                    </details>
                  ) : null}
                </div>
              );
            })}
            <p className="text-[11px] text-amber-100/70">
              Do not treat missing active halt flags as complete proof until these warnings are reviewed.
            </p>
          </div>
        </details>
      )}

      {!compact && status && networkWideControls.length > 0 && (
        <div className="mt-4 rounded-md border border-slate-700 bg-slate-900/40 p-3">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
            Network-wide controls
          </p>
          <div className="mt-2 grid gap-2 md:grid-cols-2">
            {networkWideControls.map((control) => (
              <div key={control.key} className="rounded border border-border bg-surface/50 px-3 py-2">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-semibold text-slate-200">{control.label}</span>
                  <code className="rounded border border-slate-700 bg-slate-950 px-1.5 py-0.5 text-[10px] text-slate-400">{control.key}</code>
                </div>
                <p className="mt-1 text-[11px] leading-relaxed text-slate-400">{control.reason}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {!compact && status && chainAvailability.length > 0 && (
        <section className="mt-4" aria-labelledby="chain-availability-heading">
          <div className="mb-2 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h3 id="chain-availability-heading" className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Chain availability
              </h3>
              <p className="mt-1 text-[11px] leading-relaxed text-slate-400">
                Swap columns show chain-level route blockers. LP columns are separate because LP pauses are not the same as an ordinary swap halt.
              </p>
            </div>
          </div>
          <div className="space-y-2 md:hidden" role="list" aria-label="Per-chain live operation state">
            {chainAvailability.map((chain) => (
              <div key={chain.chain} role="listitem" className={`rounded-md border p-3 ${chain.swapLimited ? 'border-amber-500/25 bg-amber-500/5' : 'border-border bg-surface/60'}`}>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-semibold">{chain.chain}</span>
                  <RadioTower aria-hidden="true" className={`h-4 w-4 ${chain.swapLimited ? 'text-amber-400' : 'text-emerald-400'}`} />
                </div>
                <div className="mt-3 grid grid-cols-2 gap-2">
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-slate-500">Swap in</p>
                    <div className="mt-1">{renderStatusCell(chain.swapIn)}</div>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-slate-500">Swap out</p>
                    <div className="mt-1">{renderStatusCell(chain.swapOut)}</div>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-slate-500">LP actions</p>
                    <div className="mt-1">{renderStatusCell(chain.lpActions)}</div>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-slate-500">Pool deposits</p>
                    <div className="mt-1">{renderStatusCell(chain.poolDeposits)}</div>
                  </div>
                </div>
                <p className="mt-3 text-[11px] leading-relaxed text-slate-400">
                  <span className="font-semibold text-slate-300">Why: </span>
                  {firstReasonText(chain.reasons)}
                </p>
              </div>
            ))}
          </div>
          <div className="hidden overflow-x-auto rounded-md border border-border md:block">
            <table className="min-w-[900px] w-full text-left text-[11px]">
              <caption className="sr-only">Per-chain live operation state</caption>
              <thead className="bg-slate-950/30 text-slate-400">
                <tr>
                  <th scope="col" className="whitespace-nowrap px-3 py-2 font-semibold">Chain</th>
                  <th scope="col" className="whitespace-nowrap px-3 py-2 font-semibold">Swap in</th>
                  <th scope="col" className="whitespace-nowrap px-3 py-2 font-semibold">Swap out</th>
                  <th scope="col" className="whitespace-nowrap px-3 py-2 font-semibold">LP actions</th>
                  <th scope="col" className="whitespace-nowrap px-3 py-2 font-semibold">Pool deposits</th>
                  <th scope="col" className="whitespace-nowrap px-3 py-2 font-semibold">Data quality</th>
                  <th scope="col" className="px-3 py-2 font-semibold">Why</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {chainAvailability.map((chain) => (
                  <tr key={chain.chain} className={chain.swapLimited ? 'bg-amber-500/5' : undefined}>
                    <th scope="row" className="whitespace-nowrap px-3 py-2 text-sm font-semibold text-slate-200">{chain.chain}</th>
                    <td className="whitespace-nowrap px-3 py-2">{renderStatusCell(chain.swapIn)}</td>
                    <td className="whitespace-nowrap px-3 py-2">{renderStatusCell(chain.swapOut)}</td>
                    <td className="whitespace-nowrap px-3 py-2">{renderStatusCell(chain.lpActions)}</td>
                    <td className="whitespace-nowrap px-3 py-2">{renderStatusCell(chain.poolDeposits)}</td>
                    <td className="whitespace-nowrap px-3 py-2">{renderStatusCell(chain.dataQuality)}</td>
                    <td className="px-3 py-2 text-slate-400">{firstReasonText(chain.reasons)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {!compact && showQuoteChecker && (
        <RouteQuoteChecker status={status} />
      )}

      {!compact && evidenceRows.length > 0 && (
        <details className="mt-4 rounded-md border border-border bg-surface/50">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-3 py-2 text-xs font-semibold text-slate-300">
            <span>Operational evidence</span>
            <span className="shrink-0 text-[11px] font-normal text-slate-400">{formatSourceRowCount(evidenceCount)}</span>
          </summary>
          <div className="border-t border-border px-3 py-3">
            <p className="text-[11px] text-slate-400">
              Active Mimir keys and inbound-address fields from the live THORNode source above. Global controls appear once here instead of being repeated on every inherited chain card.
            </p>
            <div className="mt-3 space-y-2 sm:hidden" role="list" aria-label="Active source evidence for network operation state">
              {evidenceRows.map((row) => (
                <div key={`mobile:${row.id}`} role="listitem" className="rounded-md border border-border bg-slate-950/30 p-2">
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px]">
                    <span className="font-semibold text-slate-300">{row.scope}</span>
                    <span className="text-slate-400">/</span>
                    <span className="text-slate-400">{row.source}</span>
                    <span className="text-slate-400">/</span>
                    <span className="text-slate-400">{row.impact}</span>
                    <span className="text-slate-400">/</span>
                    <span className="text-slate-400">{row.state}</span>
                  </div>
                  <code className="mt-1 block break-all font-mono text-[10px] leading-relaxed text-amber-200">
                    {row.key}
                  </code>
                </div>
              ))}
            </div>
            <div className="mt-3 hidden overflow-x-auto sm:block">
              <table className="min-w-[720px] text-left text-[11px]">
                <caption className="sr-only">Active source evidence for network operation state</caption>
                <thead className="text-slate-400">
                  <tr>
                    <th scope="col" className="whitespace-nowrap pb-2 pr-4 font-medium">Scope</th>
                    <th scope="col" className="whitespace-nowrap pb-2 pr-4 font-medium">Source</th>
                    <th scope="col" className="whitespace-nowrap pb-2 pr-4 font-medium">Impact</th>
                    <th scope="col" className="whitespace-nowrap pb-2 pr-4 font-medium">State</th>
                    <th scope="col" className="pb-2 font-medium">Evidence</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border text-slate-300">
                  {evidenceRows.map((row) => (
                    <tr key={row.id}>
                      <td className="whitespace-nowrap py-2 pr-4 font-medium">{row.scope}</td>
                      <td className="whitespace-nowrap py-2 pr-4 text-slate-400">{row.source}</td>
                      <td className="whitespace-nowrap py-2 pr-4 text-slate-400">{row.impact}</td>
                      <td className="whitespace-nowrap py-2 pr-4 text-slate-400">{row.state}</td>
                      <td className="py-2">
                        <code className="break-all rounded border border-border bg-slate-950/50 px-1.5 py-1 text-[10px] text-amber-200">
                          {row.key}
                        </code>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </details>
      )}

      {!compact && scheduledMimirKeys.length > 0 && (
        <details className="mt-4 rounded-md border border-sky-500/20 bg-sky-500/5">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-3 py-2 text-xs font-semibold text-sky-200">
            <span>Scheduled monitored Mimir keys</span>
            <span className="shrink-0 text-[11px] font-normal text-sky-300/80">{formatKeyCount(scheduledMimirKeys.length)}</span>
          </summary>
          <div className="border-t border-sky-500/20 px-3 py-3">
            <p className="text-[11px] text-sky-100/70">
              These height-based controls exist in live Mimir but are not active at the sampled THORChain height.
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {scheduledMimirKeys.map((key) => (
                <code key={key} className="break-all rounded border border-sky-500/20 bg-slate-950/50 px-1.5 py-1 text-[10px] text-sky-100">
                  {key}
                </code>
              ))}
            </div>
            {scheduledControls.length > 0 && (
              <div className="mt-4">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-sky-100/80">
                  Scheduled control details
                </p>
                <div className="mt-2 space-y-2">
                  {scheduledControls.map((control) => (
                    <div key={`scheduled:${control.key}`} className="rounded border border-sky-500/20 bg-slate-950/30 p-2 text-[11px]">
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                        <span className="font-semibold text-sky-100">{control.label}</span>
                        <code className="break-all text-sky-100/80">{control.key}</code>
                      </div>
                      <p className="mt-1 text-sky-100/70">{control.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </details>
      )}

      {!compact && status && status.invalidMimirKeys.length > 0 && (
        <details className="mt-4 rounded-md border border-amber-500/20 bg-amber-500/5">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-3 py-2 text-xs font-semibold text-amber-200">
            <span>Unparseable monitored Mimir keys</span>
            <span className="shrink-0 text-[11px] font-normal text-amber-300/80">{formatKeyCount(status.invalidMimirKeys.length)}</span>
          </summary>
          <div className="border-t border-amber-500/20 px-3 py-3">
            <p className="text-[11px] text-amber-100/70">
              These keys existed in the live Mimir response but did not contain a plain numeric value, so they were not counted as inactive.
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {status.invalidMimirKeys.map((key) => (
                <code key={key} className="break-all rounded border border-amber-500/20 bg-slate-950/50 px-1.5 py-1 text-[10px] text-amber-200">
                  {key}
                </code>
              ))}
            </div>
          </div>
        </details>
      )}

      {!compact && status && status.monitoredControls.length > 0 && (
        <div className="mt-4 border-t border-border pt-4">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
            Priority Mimir controls
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            {priorityControls.length > 0 ? (
              priorityControls.map(renderControlChip)
            ) : (
              <span className="text-xs text-slate-400">No active, disabled, scheduled, or unparseable monitored controls.</span>
            )}
          </div>
          {secondaryControls.length > 0 && (
            <details className="mt-3 rounded-md border border-border bg-surface/50">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-3 py-2 text-xs font-semibold text-slate-300">
                <span>Show inactive and not-monitored controls</span>
                <span className="shrink-0 text-[11px] font-normal text-slate-400">{secondaryControls.length} controls</span>
              </summary>
              <div className="space-y-4 border-t border-border px-3 py-3">
                {chunkControlsByGroup(secondaryControls).map(([group, controls]) => (
                  <div key={group}>
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">{group}</p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {controls.map(renderControlChip)}
                    </div>
                  </div>
                ))}
              </div>
            </details>
          )}
          <p className="mt-2 text-[11px] text-slate-400">
            Current actions depend on these controls and per-chain flags; check live sources before assuming swaps,
            signing, LP actions, asymmetric withdrawals, TCY, trade-account, secured-asset, bank-send, or app-layer availability.
          </p>
        </div>
      )}
    </Card>
  );
}
