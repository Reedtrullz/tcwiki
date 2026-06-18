import {
  ChainOperationalStatus,
  LiveDataResult,
  NetworkStatus,
  OperationalControlStatus,
  SourceMeta,
  ThornodeInboundAddress,
} from '@/lib/types';
import { liveDegraded, liveOk } from '@/lib/trust';

const THORNODE_ENDPOINTS = [
  {
    label: 'Liquify THORNode',
    url: 'https://gateway.liquify.com/chain/thorchain_api/thorchain',
  },
  {
    label: 'THORChain THORNode',
    url: 'https://thornode.thorchain.network/thorchain',
  },
];

let activeEndpoint = 0;

function presentSources(...sources: Array<SourceMeta | undefined>): SourceMeta[] {
  const seen = new Set<string>();
  return sources.filter((source): source is SourceMeta => {
    if (!source) {
      return false;
    }
    const key = `${source.label}:${source.url}`;
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
}

async function request<T>(path: string): Promise<LiveDataResult<T>> {
  const errors: string[] = [];

  for (let i = 0; i < THORNODE_ENDPOINTS.length; i += 1) {
    const endpointIndex = (activeEndpoint + i) % THORNODE_ENDPOINTS.length;
    const endpoint = THORNODE_ENDPOINTS[endpointIndex];
    const controller = new AbortController();
    const timeoutId = globalThis.setTimeout(() => controller.abort(), 5000);

    try {
      const response = await fetch(`${endpoint.url}${path}`, {
        signal: controller.signal,
        cache: 'no-store',
      });

      if (!response.ok) {
        throw new Error(`${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      activeEndpoint = endpointIndex;
      return liveOk(data, endpoint);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown THORNode error';
      errors.push(`${endpoint.label}: ${message}`);
    } finally {
      globalThis.clearTimeout(timeoutId);
    }
  }

  return liveDegraded<T>(`THORNode source did not respond (${errors.join('; ')})`);
}

function getMimirValue(mimir: Record<string, unknown>, key: string): unknown {
  if (Object.prototype.hasOwnProperty.call(mimir, key)) {
    return mimir[key];
  }

  const normalizedKey = key.toUpperCase();
  const matchedKey = Object.keys(mimir).find((candidate) => candidate.toUpperCase() === normalizedKey);
  return matchedKey ? mimir[matchedKey] : undefined;
}

function getMimirNumber(mimir: Record<string, unknown>, key: string): number | null {
  const value = getMimirValue(mimir, key);
  if (typeof value === 'number') {
    return value;
  }
  if (typeof value === 'string') {
    const numeric = Number(value);
    return Number.isFinite(numeric) ? numeric : null;
  }
  return null;
}

function getOptionalMimirActive(mimir: Record<string, unknown>, key: string): boolean | null {
  const value = getMimirNumber(mimir, key);
  return value === null ? null : value > 0;
}

function isMimirActive(mimir: Record<string, unknown>, key: string): boolean {
  return (getMimirNumber(mimir, key) ?? 0) > 0;
}

function isMimirEnabled(mimir: Record<string, unknown>, key: string): boolean | null {
  const value = getMimirNumber(mimir, key);
  return value === null ? null : value > 0;
}

function pauseControl(
  mimir: Record<string, unknown>,
  key: string,
  label: string,
  description: string
): OperationalControlStatus {
  const active = isMimirActive(mimir, key);
  return {
    key,
    label,
    state: active ? 'active' : 'inactive',
    active,
    description,
  };
}

function optionalPauseControl(
  mimir: Record<string, unknown>,
  key: string,
  label: string,
  description: string
): OperationalControlStatus {
  const active = getOptionalMimirActive(mimir, key);
  if (active === null) {
    return {
      key,
      label,
      state: 'not-monitored',
      active: false,
      description,
    };
  }

  return {
    key,
    label,
    state: active ? 'active' : 'inactive',
    active,
    description,
  };
}

function enablementControl(
  mimir: Record<string, unknown>,
  key: string,
  label: string,
  description: string
): OperationalControlStatus {
  const enabled = isMimirEnabled(mimir, key);
  if (enabled === null) {
    return {
      key,
      label,
      state: 'not-monitored',
      active: false,
      description,
    };
  }

  return {
    key,
    label,
    state: enabled ? 'inactive' : 'disabled',
    active: !enabled,
    description,
  };
}

export function deriveNetworkStatus(
  mimir: Record<string, unknown>,
  inboundAddresses: ThornodeInboundAddress[],
  thorNodeVersion?: string
): NetworkStatus {
  const tradingPaused = isMimirActive(mimir, 'HALTTRADING');
  const signingPaused = isMimirActive(mimir, 'HALTSIGNING');
  const lpPaused = isMimirActive(mimir, 'PAUSELP');
  const loansPaused = isMimirActive(mimir, 'PAUSELOANS');
  const observedChainsPaused = isMimirActive(mimir, 'HALTCHAINGLOBAL');
  const securedAssetsPaused = getOptionalMimirActive(mimir, 'HALTSECUREDGLOBAL');
  const tcyClaimingPaused = getOptionalMimirActive(mimir, 'TCYCLAIMINGHALT');
  const tcyClaimingSwapPaused = getOptionalMimirActive(mimir, 'TCYCLAIMINGSWAPHALT');
  const tcyStakingPaused = getOptionalMimirActive(mimir, 'TCYSTAKINGHALT');
  const tcyStakeDistributionPaused = getOptionalMimirActive(mimir, 'TCYSTAKEDISTRIBUTIONHALT');
  const tcyUnstakingPaused = getOptionalMimirActive(mimir, 'TCYUNSTAKINGHALT');
  const tcyTradingPaused = getOptionalMimirActive(mimir, 'HALTTCYTRADING');
  const wasmPaused = getOptionalMimirActive(mimir, 'HALTWASMGLOBAL');
  const tradeAccountsEnabled = isMimirEnabled(mimir, 'TRADEACCOUNTSENABLED');
  const runePoolEnabled = isMimirEnabled(mimir, 'RUNEPOOLENABLED');

  const chainStatuses: ChainOperationalStatus[] = inboundAddresses.map((chain) => ({
    chain: chain.chain,
    halted: Boolean(chain.halted),
    tradingPaused: Boolean(chain.global_trading_paused || chain.chain_trading_paused),
    lpActionsPaused: Boolean(chain.chain_lp_actions_paused),
    signingPaused: signingPaused || isMimirActive(mimir, `HALTSIGNING${chain.chain}`),
  }));

  const monitoredControls: OperationalControlStatus[] = [
    pauseControl(mimir, 'HALTTRADING', 'Trading', 'Swaps and trading actions are paused when active.'),
    pauseControl(mimir, 'HALTSIGNING', 'Signing', 'Outbound signing is paused when active.'),
    pauseControl(mimir, 'PAUSELP', 'LP actions', 'Liquidity-provider actions are paused when active.'),
    pauseControl(mimir, 'PAUSELOANS', 'Loans', 'Legacy loan actions are paused when active.'),
    pauseControl(mimir, 'HALTCHAINGLOBAL', 'Chain observation', 'Global chain observation is halted when active.'),
    pauseControl(mimir, 'HALTCHURNING', 'Churning', 'Validator/vault rotation is halted when active.'),
    optionalPauseControl(mimir, 'HALTSECUREDGLOBAL', 'Secured assets', 'Secured-asset operations are halted when active.'),
    optionalPauseControl(mimir, 'TCYCLAIMINGHALT', 'TCY claiming', 'TCY claim actions are halted when active.'),
    optionalPauseControl(mimir, 'TCYCLAIMINGSWAPHALT', 'TCY claim swaps', 'TCY claim swap actions are halted when active.'),
    optionalPauseControl(mimir, 'TCYSTAKINGHALT', 'TCY staking', 'TCY staking actions are halted when active.'),
    optionalPauseControl(mimir, 'TCYSTAKEDISTRIBUTIONHALT', 'TCY distributions', 'TCY stake distribution is halted when active.'),
    optionalPauseControl(mimir, 'TCYUNSTAKINGHALT', 'TCY unstaking', 'TCY unstaking actions are halted when active.'),
    optionalPauseControl(mimir, 'HALTTCYTRADING', 'TCY trading', 'TCY trading is halted when active.'),
    optionalPauseControl(mimir, 'HALTWASMGLOBAL', 'WASM/app layer', 'WASM/app-layer actions are halted when active.'),
    enablementControl(mimir, 'TRADEACCOUNTSENABLED', 'Trade accounts', 'Trade accounts are unavailable when disabled.'),
    enablementControl(mimir, 'RUNEPOOLENABLED', 'RUNEPool', 'RUNEPool is unavailable when disabled.'),
  ];

  const activeChainSigningKeys = chainStatuses
    .filter((chain) => chain.signingPaused && !signingPaused)
    .map((chain) => `HALTSIGNING${chain.chain}`);

  const activePauseKeys = monitoredControls
    .filter((control) => control.active)
    .map((control) => control.key)
    .concat(activeChainSigningKeys);

  const pausedChainCount = chainStatuses.filter(
    (chain) => chain.halted || chain.tradingPaused || chain.lpActionsPaused || chain.signingPaused
  ).length;
  const isPaused = activePauseKeys.length > 0 || pausedChainCount > 0;

  return {
    state: isPaused ? 'paused' : 'operational',
    summary: isPaused
      ? 'Current-only live sources show one or more THORChain operations paused.'
      : 'Current-only live sources do not show global halt flags.',
    tradingPaused,
    signingPaused: signingPaused || chainStatuses.some((chain) => chain.signingPaused),
    lpPaused,
    loansPaused,
    observedChainsPaused,
    securedAssetsPaused,
    tcyClaimingPaused,
    tcyClaimingSwapPaused,
    tcyStakingPaused,
    tcyStakeDistributionPaused,
    tcyUnstakingPaused,
    tcyTradingPaused,
    tradeAccountsEnabled,
    runePoolEnabled,
    wasmPaused,
    chainStatuses,
    activePauseKeys,
    monitoredControls,
    thorNodeVersion,
  };
}

export class ThornodeAPI {
  static async getMimir(): Promise<LiveDataResult<Record<string, unknown>>> {
    return request<Record<string, unknown>>('/mimir');
  }

  static async getInboundAddresses(): Promise<LiveDataResult<ThornodeInboundAddress[]>> {
    return request<ThornodeInboundAddress[]>('/inbound_addresses');
  }

  static async getVersion(): Promise<LiveDataResult<{ current?: string; version?: string }>> {
    return request<{ current?: string; version?: string }>('/version');
  }

  static async getNetworkStatus(): Promise<LiveDataResult<NetworkStatus>> {
    const checkedAt = new Date().toISOString();
    const [mimir, inbound, version] = await Promise.all([
      this.getMimir(),
      this.getInboundAddresses(),
      this.getVersion(),
    ]);

    if (mimir.status !== 'ok' || inbound.status !== 'ok' || !mimir.data || !inbound.data) {
      const error = [mimir.error, inbound.error, version.error]
        .filter((message): message is string => Boolean(message))
        .join('; ');
      return liveDegraded<NetworkStatus>(
        error || 'THORNode status sources did not respond',
        presentSources(mimir.source, inbound.source, version.source),
        checkedAt
      );
    }

    const status = deriveNetworkStatus(
      mimir.data,
      inbound.data,
      version.data?.current ?? version.data?.version
    );

    return liveOk(
      status,
      presentSources(mimir.source, inbound.source, version.source),
      checkedAt
    );
  }
}

export default ThornodeAPI;
