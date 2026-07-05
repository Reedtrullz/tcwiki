import type {
  ChainOperationalStatus,
  NetworkStatus,
  Pool,
  SwapQuoteProbeResult,
} from '@/lib/types';

export type AvailabilityState = 'available' | 'limited' | 'blocked' | 'needs-review' | 'unknown';

export interface AvailabilityCell {
  state: AvailabilityState;
  label: string;
  reasons: string[];
}

export interface ChainAvailability {
  chain: string;
  swapIn: AvailabilityCell;
  swapOut: AvailabilityCell;
  lpActions: AvailabilityCell;
  poolDeposits: AvailabilityCell;
  dataQuality: AvailabilityCell;
  reasons: string[];
  swapReasons: string[];
  rawEvidence: {
    mimir: string[];
    inbound: string[];
    global: string[];
    warnings: string[];
  };
  swapLimited: boolean;
  operationLimited: boolean;
  rank: number;
}

export interface NetworkWideControl {
  key: string;
  label: string;
  reason: string;
}

export interface RouteAvailability {
  status: AvailabilityState;
  label: string;
  reasons: string[];
}

const SWAP_LIMIT_LABELS = new Set(['Chain halted', 'Trading halted', 'Signing paused']);

function unique(values: string[]) {
  return Array.from(new Set(values.filter(Boolean)));
}

function chainHasActiveKey(chain: ChainOperationalStatus, pattern: RegExp) {
  return chain.activeMimirKeys.some((key) => pattern.test(key.toUpperCase()));
}

function globalLabel(key: string) {
  switch (key.toUpperCase()) {
    case 'HALTTRADING':
      return 'Network-wide trading halt';
    case 'HALTSIGNING':
      return 'Network-wide signing halt';
    case 'PAUSELP':
      return 'Network-wide LP pause';
    case 'HALTCHAINGLOBAL':
      return 'Network-wide chain observation halt';
    case 'NODEPAUSECHAINGLOBAL':
      return 'Node-requested chain pause';
    default:
      return 'Network-wide control';
  }
}

function availableCell(label = 'Available'): AvailabilityCell {
  return { state: 'available', label, reasons: [] };
}

function limitedCell(label: string, reasons: string[]): AvailabilityCell {
  return { state: 'limited', label, reasons: unique(reasons) };
}

function reviewCell(label: string, reasons: string[]): AvailabilityCell {
  return { state: 'needs-review', label, reasons: unique(reasons) };
}

function chainReasonGroups(chain: ChainOperationalStatus) {
  const inbound = chain.inboundAddressEvidenceFields ?? [];
  const bothDirectionSwapReasons = [
    chain.halted && (chainHasActiveKey(chain, /(?:CHAIN|SOLVENCY)/) || inbound.includes('halted')) ? 'Chain halted' : null,
    chain.tradingPaused && (chainHasActiveKey(chain, /TRADING/) || inbound.includes('global_trading_paused') || inbound.includes('chain_trading_paused')) ? 'Trading halted' : null,
  ].filter((reason): reason is string => reason !== null);
  const swapOutReasons = [
    ...bothDirectionSwapReasons,
    chain.signingPaused && chainHasActiveKey(chain, /SIGNING/) ? 'Signing paused' : null,
  ].filter((reason): reason is string => reason !== null);
  const operationReasons = [
    chain.lpActionsPaused && (chainHasActiveKey(chain, /^PAUSELP[A-Z0-9]+$/) || inbound.includes('chain_lp_actions_paused')) ? 'LP actions paused' : null,
    chain.lpDepositPaused ? 'Pool-specific deposit pause' : null,
    chain.securedAssetDepositPaused ? 'Secured deposits paused' : null,
    chain.securedAssetWithdrawPaused ? 'Secured withdrawals paused' : null,
    chain.asymWithdrawalPaused ? 'Asym withdrawals paused' : null,
  ].filter((reason): reason is string => reason !== null);

  return {
    swapIn: unique(bothDirectionSwapReasons),
    swapOut: unique(swapOutReasons),
    operations: unique(operationReasons),
  };
}

function evidenceReasons(chain: ChainOperationalStatus) {
  const inbound = chain.inboundAddressEvidenceFields ?? [];
  return unique([
    ...chain.activeMimirKeys.map((key) => `Mimir halt: ${key}`),
    ...chain.lpDepositPauseKeys.map((key) => `Pool-specific deposit pause: ${key}`),
    ...(chain.securedAssetDepositPauseKeys ?? []).map((key) => `Secured deposit halt: ${key}`),
    ...(chain.securedAssetWithdrawPauseKeys ?? []).map((key) => `Secured withdrawal halt: ${key}`),
    ...(chain.asymWithdrawalPauseKeys ?? []).map((key) => `Asym withdrawal pause: ${key}`),
    ...inbound.map((field) => `THORNode inbound flag: ${field}`),
    ...(chain.inheritedMimirKeys ?? []).map((key) => `${globalLabel(key)} applies`),
    ...(chain.sourceWarnings ?? []),
    ...(chain.unparseableMimirKeys ?? []).map((key) => `Mimir value needs review: ${key}`),
  ]);
}

function chainDataQuality(chain: ChainOperationalStatus): AvailabilityCell {
  const warnings = [
    ...(chain.sourceWarnings ?? []),
    ...(chain.unparseableMimirKeys ?? []).map((key) => `Mimir value needs review: ${key}`),
  ];
  return warnings.length > 0 ? reviewCell('Needs review', warnings) : availableCell('Source OK');
}

export function deriveNetworkWideControls(status: NetworkStatus | undefined): NetworkWideControl[] {
  if (!status) {
    return [];
  }
  const inheritedKeys = status.chainStatuses.flatMap((chain) => chain.inheritedMimirKeys ?? []);
  return unique([...status.activeControlKeys, ...inheritedKeys])
    .map((key) => ({
      key,
      label: globalLabel(key),
      reason: key.toUpperCase() === 'PAUSELP'
        ? 'Network-wide LP pause applies to LP actions; it does not by itself mean ordinary swaps are globally halted.'
        : `${globalLabel(key)} is active in current THORNode evidence.`,
    }));
}

export function deriveChainAvailability(status: NetworkStatus | undefined): ChainAvailability[] {
  return (status?.chainStatuses ?? [])
    .map((chain) => {
      const reasonGroups = chainReasonGroups(chain);
      const directReasons = unique([
        ...reasonGroups.swapIn,
        ...reasonGroups.swapOut,
        ...reasonGroups.operations,
      ]);
      const swapReasons = unique([
        ...reasonGroups.swapIn,
        ...reasonGroups.swapOut,
      ]).filter((reason) => SWAP_LIMIT_LABELS.has(reason));
      const swapIn = reasonGroups.swapIn.length > 0 ? limitedCell('Limited', reasonGroups.swapIn) : availableCell();
      const swapOut = reasonGroups.swapOut.length > 0 ? limitedCell('Limited', reasonGroups.swapOut) : availableCell();
      const lpActions = chain.lpActionsPaused
        ? limitedCell('Paused', directReasons.includes('LP actions paused') ? ['LP actions paused'] : ['Network-wide LP pause applies'])
        : availableCell();
      const poolDeposits = chain.lpDepositPaused
        ? limitedCell('Paused', ['Pool-specific deposit pause'])
        : availableCell();
      const dataQuality = chainDataQuality(chain);
      const reasons = evidenceReasons(chain);
      const swapLimited = swapReasons.length > 0;
      const operationLimited = directReasons.length > 0 || dataQuality.state === 'needs-review';

      return {
        chain: chain.chain,
        swapIn,
        swapOut,
        lpActions,
        poolDeposits,
        dataQuality,
        reasons: reasons.length > 0 ? reasons : ['No active chain-specific swap blocker observed.'],
        swapReasons,
        rawEvidence: {
          mimir: unique([
            ...chain.activeMimirKeys,
            ...chain.lpDepositPauseKeys,
            ...(chain.securedAssetDepositPauseKeys ?? []),
            ...(chain.securedAssetWithdrawPauseKeys ?? []),
            ...(chain.asymWithdrawalPauseKeys ?? []),
          ]),
          inbound: chain.inboundAddressEvidenceFields ?? [],
          global: chain.inheritedMimirKeys ?? [],
          warnings: unique([
            ...(chain.sourceWarnings ?? []),
            ...(chain.unparseableMimirKeys ?? []),
          ]),
        },
        swapLimited,
        operationLimited,
        rank: swapLimited ? 0 : dataQuality.state === 'needs-review' ? 1 : operationLimited ? 2 : 3,
      };
    })
    .sort((left, right) => left.rank - right.rank || left.chain.localeCompare(right.chain));
}

export function chainFromAsset(asset: string) {
  return asset.split('.')[0]?.toUpperCase() ?? '';
}

export function poolHasAsset(pools: Pool[] | undefined, asset: string) {
  return Boolean((pools ?? []).some((pool) => pool.asset === asset));
}

export function deriveRouteAvailability(
  fromAsset: string,
  toAsset: string,
  status: NetworkStatus | undefined,
  pools: Pool[] | undefined,
  quoteResult: SwapQuoteProbeResult | undefined
): RouteAvailability {
  if (quoteResult) {
    if (quoteResult.status === 'available') {
      return { status: 'available', label: 'Quote available', reasons: [quoteResult.summary] };
    }
    return {
      status: quoteResult.status === 'limited' ? 'limited' : 'blocked',
      label: quoteResult.status === 'limited' ? 'Quote limited' : 'Quote failed',
      reasons: [quoteResult.failure?.message ?? quoteResult.summary],
    };
  }

  if (!status) {
    return { status: 'unknown', label: 'Network status unavailable', reasons: ['Live THORNode status has not loaded.'] };
  }
  if (!fromAsset || !toAsset || fromAsset === toAsset) {
    return { status: 'unknown', label: 'Choose a route', reasons: ['Select two different assets and an amount.'] };
  }
  const missingPools = [fromAsset, toAsset].filter((asset) => !poolHasAsset(pools, asset));
  if (missingPools.length > 0) {
    return {
      status: 'limited',
      label: 'Pool not listed',
      reasons: missingPools.map((asset) => `${asset} is not in the current available Midgard pool list.`),
    };
  }
  const availability = deriveChainAvailability(status);
  const fromChain = chainFromAsset(fromAsset);
  const toChain = chainFromAsset(toAsset);
  const blockers = availability.flatMap((chain) => {
    const reasons: string[] = [];
    if (chain.chain === fromChain && chain.swapIn.state !== 'available') {
      reasons.push(...chain.swapIn.reasons);
    }
    if (chain.chain === toChain && chain.swapOut.state !== 'available') {
      reasons.push(...chain.swapOut.reasons);
    }
    return reasons.length > 0 ? [`${chain.chain}: ${unique(reasons).join(', ')}`] : [];
  });
  if (blockers.length > 0) {
    return {
      status: 'limited',
      label: 'Route likely limited',
      reasons: blockers,
    };
  }
  if ((status.sourceWarningDetails?.length ?? status.sourceWarnings.length) > 0) {
    return {
      status: 'needs-review',
      label: 'Quote before trusting',
      reasons: ['No chain-specific swap blocker is visible for this pair, but source warnings still need review.'],
    };
  }
  return {
    status: 'unknown',
    label: 'Ready to quote',
    reasons: ['No visible chain blocker; run a quote probe for current route evidence.'],
  };
}
