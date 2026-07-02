import {
  ChainOperationalStatus,
  LiveDataResult,
  NetworkStatus,
  OperationalControlStatus,
  SourceMeta,
  ThornodeInboundAddress,
} from '@/lib/types';
import { CHAINS } from '@/lib/data/static';
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

const MIMIR_NUMBER_PATTERN = /^[+-]?(?:\d+(?:\.\d+)?|\.\d+)$/;
const EXACT_MONITORED_MIMIR_KEYS = [
  'HALTTRADING',
  'StreamingSwapPause',
  'HaltMemoless',
  'HALTSIGNING',
  'PAUSELP',
  'RUNEPoolHaltDeposit',
  'RUNEPoolHaltWithdraw',
  'PAUSELOANS',
  'HALTCHAINGLOBAL',
  'NODEPAUSECHAINGLOBAL',
  'HALTCHURNING',
  'PauseBond',
  'PauseUnbond',
  'HaltRebond',
  'HaltOperatorRotate',
  'HaltOracle',
  'HALTSECUREDGLOBAL',
  'TCYCLAIMINGHALT',
  'TCYCLAIMINGSWAPHALT',
  'TCYSTAKINGHALT',
  'TCYSTAKEDISTRIBUTIONHALT',
  'TCYUNSTAKINGHALT',
  'HALTTCYTRADING',
  'HALTWASMGLOBAL',
  'TRADEACCOUNTSENABLED',
  'RUNEPOOLENABLED',
] as const;

const PREFIX_MONITORED_MIMIR_KEYS = [
  'PAUSELPDEPOSIT-',
  'HaltSecuredDeposit-',
  'HaltSecuredWithdraw-',
  'HaltWasmDeployer-',
  'HaltWasmCs-',
  'HaltWasmContract-',
] as const;

const NON_CHAIN_SCOPED_MIMIR_CODES = new Set(['TCY']);
const CURATED_CHAIN_CODES = new Set(CHAINS.map((chain) => chain.chain.toUpperCase()));

type MimirNumericState =
  | { state: 'absent' }
  | { state: 'valid'; key: string; value: number }
  | { state: 'unparseable'; key: string };

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

function toMimirNumber(value: unknown): number | null {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : null;
  }
  if (typeof value === 'string') {
    if (!MIMIR_NUMBER_PATTERN.test(value)) {
      return null;
    }
    const numeric = Number(value);
    return Number.isFinite(numeric) ? numeric : null;
  }
  return null;
}

function getCanonicalMimirKey(mimir: Record<string, unknown>, key: string): string | undefined {
  if (Object.prototype.hasOwnProperty.call(mimir, key)) {
    return key;
  }

  const normalizedKey = key.toUpperCase();
  return Object.keys(mimir).find((candidate) => candidate.toUpperCase() === normalizedKey);
}

function getInvalidExactMimirKey(mimir: Record<string, unknown>, key: string): string | null {
  const canonicalKey = getCanonicalMimirKey(mimir, key);
  if (!canonicalKey) {
    return null;
  }

  return toMimirNumber(mimir[canonicalKey]) === null ? canonicalKey : null;
}

function getMimirNumericState(mimir: Record<string, unknown>, key: string): MimirNumericState {
  const canonicalKey = getCanonicalMimirKey(mimir, key);
  if (!canonicalKey) {
    return { state: 'absent' };
  }

  const value = toMimirNumber(mimir[canonicalKey]);
  return value === null
    ? { state: 'unparseable', key: canonicalKey }
    : { state: 'valid', key: canonicalKey, value };
}

function getInvalidScopedMimirKey(mimir: Record<string, unknown>, key: string): string | null {
  const value = getMimirNumericState(mimir, key);
  return value.state === 'unparseable' ? value.key : null;
}

function getInvalidMimirKeysByPrefix(mimir: Record<string, unknown>, prefix: string): string[] {
  const normalizedPrefix = prefix.toUpperCase();
  return Object.entries(mimir)
    .filter(([key, value]) => key.toUpperCase().startsWith(normalizedPrefix) && toMimirNumber(value) === null)
    .map(([key]) => key)
    .sort();
}

function getChainCodeFromScopedMimirKey(key: string): string | null {
  const upperKey = key.toUpperCase();
  const haltMatch = upperKey.match(/^HALT([A-Z0-9]+)(TRADING|CHAIN)$/);
  const observedSigningMatch = upperKey.match(/^HALT([A-Z0-9]+)SIGNING$/);
  const signingMatch = upperKey.match(/^HALTSIGNING([A-Z0-9]+)$/);
  const solvencyHaltMatch = upperKey.match(/^SOLVENCYHALT([A-Z0-9]+)CHAIN$/);
  const lpMatch = upperKey.match(/^PAUSELP([A-Z0-9]+)$/);
  const chainCode = haltMatch?.[1]
    ?? observedSigningMatch?.[1]
    ?? signingMatch?.[1]
    ?? solvencyHaltMatch?.[1]
    ?? lpMatch?.[1]
    ?? null;
  return chainCode && !NON_CHAIN_SCOPED_MIMIR_CODES.has(chainCode) ? chainCode : null;
}

function getInvalidChainScopedMimirKeys(mimir: Record<string, unknown>): string[] {
  return Object.entries(mimir)
    .filter(([key, value]) => toMimirNumber(value) === null && getChainCodeFromScopedMimirKey(key) !== null)
    .map(([key]) => key)
    .sort();
}

function collectInvalidMimirKeys(mimir: Record<string, unknown>, recognizedChainCodes: Set<string>): string[] {
  return uniqueKeys(
    EXACT_MONITORED_MIMIR_KEYS
      .map((key) => getInvalidExactMimirKey(mimir, key))
      .filter((key): key is string => key !== null),
    PREFIX_MONITORED_MIMIR_KEYS.flatMap((prefix) => getInvalidMimirKeysByPrefix(mimir, prefix)),
    getInvalidChainScopedMimirKeys(mimir).filter((key) => {
      const chainCode = getChainCodeFromScopedMimirKey(key);
      return chainCode !== null && recognizedChainCodes.has(chainCode);
    })
  ).sort((a, b) => a.localeCompare(b));
}

function getActiveMimirKey(mimir: Record<string, unknown>, key: string): string | null {
  const value = getMimirNumericState(mimir, key);
  return value.state === 'valid' && value.value > 0 ? value.key : null;
}

function getActiveMimirKeysByPrefix(mimir: Record<string, unknown>, prefix: string): string[] {
  const normalizedPrefix = prefix.toUpperCase();
  return Object.entries(mimir)
    .filter(([key, value]) => key.toUpperCase().startsWith(normalizedPrefix) && (toMimirNumber(value) ?? 0) > 0)
    .map(([key]) => key)
    .sort();
}

function uniqueKeys(...keyGroups: string[][]): string[] {
  const keys = new Set<string>();
  for (const group of keyGroups) {
    for (const key of group) {
      keys.add(key);
    }
  }
  return [...keys];
}

function getOptionalMimirActive(mimir: Record<string, unknown>, key: string): boolean | null {
  const value = getMimirNumericState(mimir, key);
  return value.state === 'valid' ? value.value > 0 : null;
}

function isMimirActive(mimir: Record<string, unknown>, key: string): boolean {
  const value = getMimirNumericState(mimir, key);
  return value.state === 'valid' && value.value > 0;
}

function isMimirEnabled(mimir: Record<string, unknown>, key: string): boolean | null {
  const value = getMimirNumericState(mimir, key);
  return value.state === 'valid' ? value.value > 0 : null;
}

function pauseControl(
  mimir: Record<string, unknown>,
  key: string,
  label: string,
  description: string
): OperationalControlStatus {
  const value = getMimirNumericState(mimir, key);
  if (value.state === 'unparseable') {
    return {
      key,
      label,
      state: 'unparseable',
      active: false,
      description,
    };
  }
  const active = value.state === 'valid' && value.value > 0;
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
  const value = getMimirNumericState(mimir, key);
  if (value.state === 'unparseable') {
    return {
      key,
      label,
      state: 'unparseable',
      active: false,
      description,
    };
  }
  if (value.state === 'absent') {
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
    state: value.value > 0 ? 'active' : 'inactive',
    active: value.value > 0,
    description,
  };
}

function enablementControl(
  mimir: Record<string, unknown>,
  key: string,
  label: string,
  description: string
): OperationalControlStatus {
  const value = getMimirNumericState(mimir, key);
  if (value.state === 'unparseable') {
    return {
      key,
      label,
      state: 'unparseable',
      active: false,
      description,
    };
  }
  if (value.state === 'absent') {
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
    state: value.value > 0 ? 'inactive' : 'disabled',
    active: value.value <= 0,
    description,
  };
}

function aggregatePauseControl(
  key: string,
  label: string,
  activeKeys: string[],
  invalidKeys: string[],
  inactiveDescription: string,
  activeDescription: string
): OperationalControlStatus {
  const active = activeKeys.length > 0;
  const unparseable = !active && invalidKeys.length > 0;
  return {
    key,
    label,
    state: active ? 'active' : unparseable ? 'unparseable' : 'inactive',
    active,
    description: active
      ? `${activeDescription} (${activeKeys.length} active key${activeKeys.length === 1 ? '' : 's'}).`
      : unparseable
        ? `${invalidKeys.length} scoped key${invalidKeys.length === 1 ? '' : 's'} could not be parsed.`
        : inactiveDescription,
  };
}

function getInvalidMimirKeysForChain(
  mimir: Record<string, unknown>,
  chainCode: string,
  invalidPoolDepositPauseKeys: string[]
): string[] {
  const directScopedKeys = [
    `HALT${chainCode}CHAIN`,
    `SOLVENCYHALT${chainCode}CHAIN`,
    `HALT${chainCode}TRADING`,
    `PAUSELP${chainCode}`,
    `HALTSIGNING${chainCode}`,
    `HALT${chainCode}SIGNING`,
  ]
    .map((key) => getInvalidScopedMimirKey(mimir, key))
    .filter((key): key is string => key !== null);
  const poolScopedKeys = invalidPoolDepositPauseKeys.filter((key) => (
    key.toUpperCase().startsWith(`PAUSELPDEPOSIT-${chainCode}-`)
  ));

  return uniqueKeys(directScopedKeys, poolScopedKeys).sort((a, b) => a.localeCompare(b));
}

function extractChainCodesFromMimir(
  mimir: Record<string, unknown>,
  poolDepositPauseKeys: string[],
  invalidPoolDepositPauseKeys: string[],
  recognizedChainCodes: Set<string>
): string[] {
  const chainCodes = new Set<string>();

  for (const [key, value] of Object.entries(mimir)) {
    const numericValue = toMimirNumber(value);
    if (numericValue !== null && numericValue <= 0) {
      continue;
    }
    const chainCode = getChainCodeFromScopedMimirKey(key);
    if (chainCode && recognizedChainCodes.has(chainCode)) {
      chainCodes.add(chainCode);
    }
  }

  for (const key of [...poolDepositPauseKeys, ...invalidPoolDepositPauseKeys]) {
    const [, chainCode] = key.toUpperCase().split('-');
    if (chainCode && recognizedChainCodes.has(chainCode)) {
      chainCodes.add(chainCode);
    }
  }

  return [...chainCodes].sort();
}

function getUnknownChainScopedMimirKeys(mimir: Record<string, unknown>, recognizedChainCodes: Set<string>): string[] {
  return Object.entries(mimir)
    .filter(([key, value]) => {
      const numericValue = toMimirNumber(value);
      if (numericValue !== null && numericValue <= 0) {
        return false;
      }

      const chainCode = getChainCodeFromScopedMimirKey(key);
      return chainCode !== null && !recognizedChainCodes.has(chainCode);
    })
    .map(([key]) => key)
    .sort();
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
  const streamingSwapsPaused = getOptionalMimirActive(mimir, 'StreamingSwapPause');
  const memolessTransactionsHalted = getOptionalMimirActive(mimir, 'HaltMemoless');
  const nodePauseChainGlobal = getOptionalMimirActive(mimir, 'NODEPAUSECHAINGLOBAL');
  const bondPaused = getOptionalMimirActive(mimir, 'PauseBond');
  const unbondPaused = getOptionalMimirActive(mimir, 'PauseUnbond');
  const rebondHalted = getOptionalMimirActive(mimir, 'HaltRebond');
  const operatorRotateHalted = getOptionalMimirActive(mimir, 'HaltOperatorRotate');
  const oracleHalted = getOptionalMimirActive(mimir, 'HaltOracle');
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
  const runePoolDepositPaused = getOptionalMimirActive(mimir, 'RUNEPoolHaltDeposit');
  const runePoolWithdrawPaused = getOptionalMimirActive(mimir, 'RUNEPoolHaltWithdraw');
  const poolDepositPauseKeys = getActiveMimirKeysByPrefix(mimir, 'PAUSELPDEPOSIT-');
  const securedAssetDepositPauseKeys = getActiveMimirKeysByPrefix(mimir, 'HaltSecuredDeposit-');
  const securedAssetWithdrawPauseKeys = getActiveMimirKeysByPrefix(mimir, 'HaltSecuredWithdraw-');
  const wasmDeployerHaltKeys = getActiveMimirKeysByPrefix(mimir, 'HaltWasmDeployer-');
  const wasmCodeHashHaltKeys = getActiveMimirKeysByPrefix(mimir, 'HaltWasmCs-');
  const wasmContractHaltKeys = getActiveMimirKeysByPrefix(mimir, 'HaltWasmContract-');
  const invalidPoolDepositPauseKeys = getInvalidMimirKeysByPrefix(mimir, 'PAUSELPDEPOSIT-');
  const invalidSecuredAssetDepositPauseKeys = getInvalidMimirKeysByPrefix(mimir, 'HaltSecuredDeposit-');
  const invalidSecuredAssetWithdrawPauseKeys = getInvalidMimirKeysByPrefix(mimir, 'HaltSecuredWithdraw-');
  const invalidWasmDeployerHaltKeys = getInvalidMimirKeysByPrefix(mimir, 'HaltWasmDeployer-');
  const invalidWasmCodeHashHaltKeys = getInvalidMimirKeysByPrefix(mimir, 'HaltWasmCs-');
  const invalidWasmContractHaltKeys = getInvalidMimirKeysByPrefix(mimir, 'HaltWasmContract-');
  const scopedWasmHaltKeys = uniqueKeys(wasmDeployerHaltKeys, wasmCodeHashHaltKeys, wasmContractHaltKeys);
  const nodePauseChainGlobalKey = getActiveMimirKey(mimir, 'NODEPAUSECHAINGLOBAL');
  const nodePauseChainGlobalKeys = nodePauseChainGlobalKey ? [nodePauseChainGlobalKey] : [];
  const inboundByChain = new Map(inboundAddresses.map((chain) => [chain.chain.toUpperCase(), chain]));
  const inboundChainCodes = inboundAddresses.map((chain) => chain.chain.toUpperCase());
  const recognizedChainCodes = new Set([...CURATED_CHAIN_CODES, ...inboundChainCodes]);
  const unknownChainScopedMimirKeys = getUnknownChainScopedMimirKeys(mimir, recognizedChainCodes);
  const mimirOnlyChainCodes = extractChainCodesFromMimir(
    mimir,
    poolDepositPauseKeys,
    invalidPoolDepositPauseKeys,
    recognizedChainCodes
  )
    .filter((chainCode) => !inboundByChain.has(chainCode));
  const chainCodes = [...inboundChainCodes, ...mimirOnlyChainCodes];

  const chainStatuses: ChainOperationalStatus[] = chainCodes.map((chainCode) => {
    const chain = inboundByChain.get(chainCode);
    const chainHaltKey = getActiveMimirKey(mimir, `HALT${chainCode}CHAIN`);
    const chainSolvencyHaltKey = getActiveMimirKey(mimir, `SOLVENCYHALT${chainCode}CHAIN`);
    const chainTradingKey = getActiveMimirKey(mimir, `HALT${chainCode}TRADING`);
    const chainLpKey = getActiveMimirKey(mimir, `PAUSELP${chainCode}`);
    const chainPrefixSigningKey = getActiveMimirKey(mimir, `HALTSIGNING${chainCode}`);
    const chainSuffixSigningKey = getActiveMimirKey(mimir, `HALT${chainCode}SIGNING`);
    const lpDepositPauseKeys = poolDepositPauseKeys.filter((key) => key.toUpperCase().startsWith(`PAUSELPDEPOSIT-${chainCode}-`));
    const unparseableMimirKeys = getInvalidMimirKeysForChain(mimir, chainCode, invalidPoolDepositPauseKeys);
    const activeMimirKeys = [
      chainHaltKey,
      chainSolvencyHaltKey,
      chainTradingKey,
      chainLpKey,
      chainPrefixSigningKey,
      chainSuffixSigningKey,
    ].filter((key): key is string => key !== null);

    const chainStatus: ChainOperationalStatus = {
      chain: chain?.chain ?? chainCode,
      halted: Boolean(chain?.halted || chainHaltKey || chainSolvencyHaltKey),
      tradingPaused: Boolean(tradingPaused || chain?.global_trading_paused || chain?.chain_trading_paused || chainTradingKey),
      lpActionsPaused: Boolean(lpPaused || chain?.chain_lp_actions_paused || chainLpKey),
      lpDepositPaused: lpDepositPauseKeys.length > 0,
      signingPaused: signingPaused || Boolean(chainPrefixSigningKey || chainSuffixSigningKey),
      activeMimirKeys,
      lpDepositPauseKeys,
    };

    return unparseableMimirKeys.length > 0
      ? { ...chainStatus, unparseableMimirKeys }
      : chainStatus;
  });

  const monitoredControls: OperationalControlStatus[] = [
    pauseControl(mimir, 'HALTTRADING', 'Trading', 'Swaps and trading actions are paused when active.'),
    optionalPauseControl(mimir, 'StreamingSwapPause', 'Streaming swaps', 'Streaming swaps are paused when active.'),
    optionalPauseControl(mimir, 'HaltMemoless', 'Memoless transactions', 'Memoless transaction handling is halted when active.'),
    pauseControl(mimir, 'HALTSIGNING', 'Signing', 'Outbound signing is paused when active.'),
    pauseControl(mimir, 'PAUSELP', 'LP actions', 'Liquidity-provider actions are paused when active.'),
    aggregatePauseControl(
      'PAUSELPDEPOSIT-*',
      'Pool deposits',
      poolDepositPauseKeys,
      invalidPoolDepositPauseKeys,
      'No active pool-specific deposit pause keys were observed.',
      'Pool-specific liquidity deposits are paused for one or more assets'
    ),
    optionalPauseControl(mimir, 'RUNEPoolHaltDeposit', 'RUNEPool deposits', 'RUNEPool deposits are halted when active.'),
    optionalPauseControl(mimir, 'RUNEPoolHaltWithdraw', 'RUNEPool withdrawals', 'RUNEPool withdrawals are halted when active.'),
    pauseControl(mimir, 'PAUSELOANS', 'Loans', 'Legacy loan actions are paused when active.'),
    pauseControl(mimir, 'HALTCHAINGLOBAL', 'Chain observation', 'Global chain observation is halted when active.'),
    optionalPauseControl(mimir, 'NODEPAUSECHAINGLOBAL', 'Node chain pause', 'Node-requested chain pausing is active when this Mimir key is active.'),
    pauseControl(mimir, 'HALTCHURNING', 'Churning', 'Validator/vault rotation is halted when active.'),
    optionalPauseControl(mimir, 'PauseBond', 'Bonding', 'Node bond actions are paused when active.'),
    optionalPauseControl(mimir, 'PauseUnbond', 'Unbonding', 'Node unbond actions are paused when active.'),
    optionalPauseControl(mimir, 'HaltRebond', 'Rebonding', 'Node rebond actions are halted when active.'),
    optionalPauseControl(mimir, 'HaltOperatorRotate', 'Operator rotation', 'Node operator rotation is halted when active.'),
    optionalPauseControl(mimir, 'HaltOracle', 'Oracle', 'Oracle operations are halted when active.'),
    optionalPauseControl(mimir, 'HALTSECUREDGLOBAL', 'Secured assets', 'Secured-asset operations are halted when active.'),
    aggregatePauseControl(
      'HaltSecuredDeposit-*',
      'Secured deposits',
      securedAssetDepositPauseKeys,
      invalidSecuredAssetDepositPauseKeys,
      'No active secured-asset deposit pause keys were observed.',
      'Secured-asset deposits are paused for one or more scoped assets'
    ),
    aggregatePauseControl(
      'HaltSecuredWithdraw-*',
      'Secured withdrawals',
      securedAssetWithdrawPauseKeys,
      invalidSecuredAssetWithdrawPauseKeys,
      'No active secured-asset withdrawal pause keys were observed.',
      'Secured-asset withdrawals are paused for one or more scoped assets'
    ),
    optionalPauseControl(mimir, 'TCYCLAIMINGHALT', 'TCY claiming', 'TCY claim actions are halted when active.'),
    optionalPauseControl(mimir, 'TCYCLAIMINGSWAPHALT', 'TCY claim swaps', 'TCY claim swap actions are halted when active.'),
    optionalPauseControl(mimir, 'TCYSTAKINGHALT', 'TCY staking', 'TCY staking actions are halted when active.'),
    optionalPauseControl(mimir, 'TCYSTAKEDISTRIBUTIONHALT', 'TCY distributions', 'TCY stake distribution is halted when active.'),
    optionalPauseControl(mimir, 'TCYUNSTAKINGHALT', 'TCY unstaking', 'TCY unstaking actions are halted when active.'),
    optionalPauseControl(mimir, 'HALTTCYTRADING', 'TCY trading', 'TCY trading is halted when active.'),
    optionalPauseControl(mimir, 'HALTWASMGLOBAL', 'WASM/app layer', 'WASM/app-layer actions are halted when active.'),
    aggregatePauseControl(
      'HaltWasmDeployer-*',
      'WASM deployers',
      wasmDeployerHaltKeys,
      invalidWasmDeployerHaltKeys,
      'No active WASM deployer halt keys were observed.',
      'WASM deployments are halted for one or more scoped deployers'
    ),
    aggregatePauseControl(
      'HaltWasmCs-*',
      'WASM code checksums',
      wasmCodeHashHaltKeys,
      invalidWasmCodeHashHaltKeys,
      'No active WASM code-checksum halt keys were observed.',
      'WASM code checksum execution is halted for one or more scoped checksums'
    ),
    aggregatePauseControl(
      'HaltWasmContract-*',
      'WASM contracts',
      wasmContractHaltKeys,
      invalidWasmContractHaltKeys,
      'No active WASM contract halt keys were observed.',
      'WASM contract execution is halted for one or more scoped contracts'
    ),
    enablementControl(mimir, 'TRADEACCOUNTSENABLED', 'Trade accounts', 'Trade accounts are unavailable when disabled.'),
    enablementControl(mimir, 'RUNEPOOLENABLED', 'RUNEPool', 'RUNEPool is unavailable when disabled.'),
  ];

  const activeControlKeys = monitoredControls
    .filter((control) => control.active)
    .map((control) => control.key);
  const invalidMimirKeys = collectInvalidMimirKeys(mimir, recognizedChainCodes);
  const sourceWarnings = [
    ...(invalidMimirKeys.length > 0
      ? [`${invalidMimirKeys.length} monitored Mimir key${invalidMimirKeys.length === 1 ? '' : 's'} could not be parsed.`]
      : []),
    ...(unknownChainScopedMimirKeys.length > 0
      ? [`Unknown chain-scoped Mimir key${unknownChainScopedMimirKeys.length === 1 ? '' : 's'} ignored: ${unknownChainScopedMimirKeys.join(', ')}.`]
      : []),
  ];
  const activeChainKeys = uniqueKeys(chainStatuses.flatMap((chain) => chain.activeMimirKeys));
  const activeEvidenceKeys = uniqueKeys(
    activeChainKeys,
    poolDepositPauseKeys,
    securedAssetDepositPauseKeys,
    securedAssetWithdrawPauseKeys,
    scopedWasmHaltKeys,
    nodePauseChainGlobalKeys
  );
  const activePauseKeys = uniqueKeys(activeControlKeys, activeEvidenceKeys);

  const pausedChainCount = chainStatuses.filter(
    (chain) => chain.halted || chain.tradingPaused || chain.lpActionsPaused || chain.lpDepositPaused || chain.signingPaused
  ).length;
  const isPaused = activeControlKeys.length > 0 || activeEvidenceKeys.length > 0 || pausedChainCount > 0;
  const hasSourceWarnings = sourceWarnings.length > 0;

  return {
    state: isPaused ? 'paused' : 'operational',
    summary: isPaused
      ? hasSourceWarnings
        ? 'Current-only live sources show one or more THORChain operations paused, with source warnings to review.'
        : 'Current-only live sources show one or more THORChain operations paused.'
      : hasSourceWarnings
        ? 'Current-only live sources do not show active halt flags, but some Mimir source warnings need review.'
        : 'Current-only live sources do not show global halt flags.',
    tradingPaused,
    streamingSwapsPaused,
    memolessTransactionsHalted,
    signingPaused: signingPaused || chainStatuses.some((chain) => chain.signingPaused),
    lpPaused,
    loansPaused,
    observedChainsPaused,
    nodePauseChainGlobal,
    bondPaused,
    unbondPaused,
    rebondHalted,
    operatorRotateHalted,
    oracleHalted,
    securedAssetsPaused,
    securedAssetDepositPauseKeys,
    securedAssetWithdrawPauseKeys,
    tcyClaimingPaused,
    tcyClaimingSwapPaused,
    tcyStakingPaused,
    tcyStakeDistributionPaused,
    tcyUnstakingPaused,
    tcyTradingPaused,
    tradeAccountsEnabled,
    runePoolEnabled,
    runePoolDepositPaused,
    runePoolWithdrawPaused,
    wasmPaused,
    wasmDeployerHaltKeys,
    wasmCodeHashHaltKeys,
    wasmContractHaltKeys,
    scopedWasmHaltKeys,
    poolDepositPauseKeys,
    chainStatuses,
    activeControlKeys,
    activeChainKeys,
    activeEvidenceKeys,
    activePauseKeys,
    monitoredControls,
    thorNodeVersion,
    invalidMimirKeys,
    sourceWarnings,
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
