import type {
  ChainOperationalStatus,
  NetworkStatus,
  OperationalControlStatus,
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
  scopedOperations: AvailabilityCell;
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

export const NATIVE_RUNE_ASSET = 'THOR.RUNE';
export const NODE_OPERATOR_ACTION_CONTROL_KEYS = ['PauseBond', 'PauseUnbond', 'HaltRebond', 'HaltOperatorRotate'] as const;

const SWAP_LIMIT_LABELS = new Set([
  'Chain halted',
  'Trading halted',
  'Signing paused',
  'Network-wide trading halt',
  'Network-wide signing halt',
  'Network-wide chain observation halt',
  'Node-requested chain pause',
]);
const GLOBAL_ROUTE_BLOCKER_LABELS = new Set([
  'Network-wide trading halt',
  'Network-wide signing halt',
  'Network-wide chain observation halt',
  'Node-requested chain pause',
]);

const NETWORK_WIDE_CONTROL_LABELS: Record<string, string> = {
  HALTTRADING: 'Network-wide trading halt',
  HALTSIGNING: 'Network-wide signing halt',
  PAUSELP: 'Network-wide LP pause',
  HALTCHAINGLOBAL: 'Network-wide chain observation halt',
  NODEPAUSECHAINGLOBAL: 'Node-requested chain pause',
};
const NODE_OPERATOR_ACTION_CONTROL_KEY_SET = new Set(NODE_OPERATOR_ACTION_CONTROL_KEYS.map((key) => key.toUpperCase()));

function unique(values: string[]) {
  return Array.from(new Set(values.filter(Boolean)));
}

function chainHasActiveKey(chain: ChainOperationalStatus, pattern: RegExp) {
  return chain.activeMimirKeys.some((key) => pattern.test(key.toUpperCase()));
}

function globalLabel(key: string) {
  return NETWORK_WIDE_CONTROL_LABELS[key.toUpperCase()] ?? null;
}

function hasInheritedMimirKey(chain: ChainOperationalStatus, key: string) {
  const upperKey = key.toUpperCase();
  return (chain.inheritedMimirKeys ?? []).some((inheritedKey) => inheritedKey.toUpperCase() === upperKey);
}

function inheritedSwapInReasons(chain: ChainOperationalStatus) {
  return [
    chain.tradingPaused && hasInheritedMimirKey(chain, 'HALTTRADING') ? 'Network-wide trading halt' : null,
    chain.halted && hasInheritedMimirKey(chain, 'HALTCHAINGLOBAL') ? 'Network-wide chain observation halt' : null,
    chain.halted && hasInheritedMimirKey(chain, 'NODEPAUSECHAINGLOBAL') ? 'Node-requested chain pause' : null,
  ].filter((reason): reason is string => reason !== null);
}

function inheritedSwapOutReasons(chain: ChainOperationalStatus) {
  return [
    ...inheritedSwapInReasons(chain),
    chain.signingPaused && hasInheritedMimirKey(chain, 'HALTSIGNING') ? 'Network-wide signing halt' : null,
  ].filter((reason): reason is string => reason !== null);
}

function availableCell(label = 'No visible blocker'): AvailabilityCell {
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
    ...inheritedSwapInReasons(chain),
  ].filter((reason): reason is string => reason !== null);
  const swapOutReasons = [
    ...bothDirectionSwapReasons,
    chain.signingPaused && chainHasActiveKey(chain, /SIGNING/) ? 'Signing paused' : null,
    ...inheritedSwapOutReasons(chain).filter((reason) => !bothDirectionSwapReasons.includes(reason)),
  ].filter((reason): reason is string => reason !== null);
  const lpActionReasons = [
    chain.lpActionsPaused && (chainHasActiveKey(chain, /^PAUSELP[A-Z0-9]+$/) || inbound.includes('chain_lp_actions_paused')) ? 'LP actions paused' : null,
  ].filter((reason): reason is string => reason !== null);
  const poolDepositReasons = [
    chain.lpDepositPaused ? 'Pool-specific deposit pause' : null,
  ].filter((reason): reason is string => reason !== null);
  const scopedOperationReasons = [
    chain.securedAssetDepositPaused ? 'Secured deposits paused' : null,
    chain.securedAssetWithdrawPaused ? 'Secured withdrawals paused' : null,
    chain.asymWithdrawalPaused ? 'Asym withdrawals paused' : null,
  ].filter((reason): reason is string => reason !== null);

  return {
    swapIn: unique(bothDirectionSwapReasons),
    swapOut: unique(swapOutReasons),
    lpActions: unique(lpActionReasons),
    poolDeposits: unique(poolDepositReasons),
    scopedOperations: unique(scopedOperationReasons),
    operations: unique([...lpActionReasons, ...poolDepositReasons, ...scopedOperationReasons]),
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
    ...(chain.sourceWarnings ?? []),
    ...(chain.unparseableMimirKeys ?? []).map((key) => `Mimir value needs review: ${key}`),
  ]);
}

function chainDataQuality(chain: ChainOperationalStatus): AvailabilityCell {
  const warnings = [
    ...(chain.sourceWarnings ?? []),
    ...(chain.unparseableMimirKeys ?? []).map((key) => `Mimir value needs review: ${key}`),
  ];
  return warnings.length > 0 ? reviewCell('Needs review', warnings) : availableCell('No chain warnings');
}

export function deriveNetworkWideControls(status: NetworkStatus | undefined): NetworkWideControl[] {
  if (!status) {
    return [];
  }
  const inheritedKeys = status.chainStatuses.flatMap((chain) => chain.inheritedMimirKeys ?? []);
  return unique([...status.activeControlKeys, ...inheritedKeys])
    .flatMap((key) => {
      const label = globalLabel(key);
      if (!label) {
        return [];
      }
      return [{
        key,
        label,
        reason: key.toUpperCase() === 'PAUSELP'
          ? 'Network-wide LP pause applies to LP actions; it does not by itself mean ordinary swaps are globally halted.'
          : `${label} is active in current THORNode evidence.`,
      }];
    });
}

export function deriveNodeOperatorActionControls(status: NetworkStatus | undefined): OperationalControlStatus[] {
  if (!status) {
    return [];
  }

  const controlsByKey = new Map(
    status.monitoredControls
      .filter((control) => NODE_OPERATOR_ACTION_CONTROL_KEY_SET.has(control.key.toUpperCase()))
      .map((control) => [control.key.toUpperCase(), control])
  );

  return NODE_OPERATOR_ACTION_CONTROL_KEYS
    .map((key) => controlsByKey.get(key.toUpperCase()))
    .filter((control): control is OperationalControlStatus => control !== undefined);
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
      const lpPausedByNetworkWideControl = chain.lpActionsPaused &&
        hasInheritedMimirKey(chain, 'PAUSELP') &&
        !directReasons.includes('LP actions paused');
      const swapIn = reasonGroups.swapIn.length > 0 ? limitedCell('Limited', reasonGroups.swapIn) : availableCell('No swap blocker');
      const swapOut = reasonGroups.swapOut.length > 0 ? limitedCell('Limited', reasonGroups.swapOut) : availableCell('No swap blocker');
      const lpActions = chain.lpActionsPaused
        ? lpPausedByNetworkWideControl
          ? limitedCell('Network-wide', ['Network-wide LP pause applies'])
          : limitedCell('Paused', directReasons.includes('LP actions paused') ? ['LP actions paused'] : ['LP actions paused'])
        : availableCell('No LP pause');
      const poolDeposits = chain.lpDepositPaused
        ? limitedCell('Paused', ['Pool-specific deposit pause'])
        : availableCell('No deposit pause');
      const scopedOperations = reasonGroups.scopedOperations.length > 0
        ? limitedCell('Limited', reasonGroups.scopedOperations)
        : availableCell('No scoped halt');
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
        scopedOperations,
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
  if (asset === NATIVE_RUNE_ASSET) {
    return true;
  }
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
    if (quoteResult.request.fromAsset !== fromAsset || quoteResult.request.toAsset !== toAsset) {
      return {
        status: 'needs-review',
        label: 'Quote does not match selected route',
        reasons: [
          `The quote was for ${quoteResult.request.fromAsset} -> ${quoteResult.request.toAsset}, not ${fromAsset} -> ${toAsset}. Run the check again.`,
        ],
      };
    }
    if (quoteResult.status === 'available') {
      return { status: 'available', label: 'Current quote returned', reasons: [quoteResult.summary] };
    }
    return {
      status: quoteResult.status === 'limited' || quoteResult.failure?.kind === 'halt' ? 'limited' : 'needs-review',
      label: quoteResult.status === 'limited' || quoteResult.failure?.kind === 'halt' ? 'Quote limited' : 'Quote needs review',
      reasons: [quoteResult.failure?.message ?? quoteResult.summary],
    };
  }

  if (!status) {
    return { status: 'unknown', label: 'Network status unavailable', reasons: ['Live THORNode status has not loaded.'] };
  }
  if (!fromAsset || !toAsset || fromAsset === toAsset) {
    return { status: 'unknown', label: 'Choose a route', reasons: ['Select two different assets and an amount.'] };
  }
  if (!pools) {
    return {
      status: 'unknown',
      label: 'Pool list unavailable',
      reasons: ['Midgard pool choices have not loaded; run a quote probe after sources recover for current route evidence.'],
    };
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
    const globallyBlocked = blockers.some((blocker) => [...GLOBAL_ROUTE_BLOCKER_LABELS].some((label) => blocker.includes(label)));
    return {
      status: globallyBlocked ? 'blocked' : 'limited',
      label: globallyBlocked ? 'Route blocked' : 'Route likely limited',
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
    label: 'Quote required',
    reasons: ['No visible chain blocker; run a quote probe for current route evidence.'],
  };
}
