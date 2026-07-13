export type OperationalControlArea =
  | 'swap execution'
  | 'signing and observation'
  | 'liquidity'
  | 'RUNEPool'
  | 'loans'
  | 'node operations'
  | 'secured assets'
  | 'TCY'
  | 'app layer'
  | 'trade accounts'
  | 'synths'
  | 'bank sends';

export interface OperationalControlCatalogEntry {
  key: string;
  label: string;
  area: OperationalControlArea;
  description: string;
  searchTerms: string[];
  scoped?: boolean;
}

export const OPERATIONAL_CONTROL_CATALOG: OperationalControlCatalogEntry[] = [
  {
    key: 'HALTTRADING',
    label: 'Trading',
    area: 'swap execution',
    description: 'Swaps and trading actions are paused when active.',
    searchTerms: ['ordinary swaps', 'route availability', 'global trading halt', 'can I swap'],
  },
  {
    key: 'StreamingSwapPause',
    label: 'Streaming swaps',
    area: 'swap execution',
    description: 'Streaming swaps are paused when active.',
    searchTerms: ['streaming swap pause', 'long swap', 'swap interval'],
  },
  {
    key: 'HaltMemoless',
    label: 'Memoless transactions',
    area: 'swap execution',
    description: 'Memoless transaction handling is halted when active.',
    searchTerms: ['memoless halt', 'memo-less', 'memo optional'],
  },
  {
    key: 'HALTSIGNING',
    label: 'Signing',
    area: 'signing and observation',
    description: 'Outbound signing is paused when active.',
    searchTerms: ['outbound signing', 'withdrawals', 'swap out', 'TSS signing'],
  },
  {
    key: 'PAUSELP',
    label: 'LP actions',
    area: 'liquidity',
    description: 'Liquidity-provider actions are paused when active.',
    searchTerms: ['liquidity provider', 'add liquidity', 'withdraw liquidity', 'global LP pause'],
  },
  {
    key: 'PAUSELPDEPOSIT-*',
    label: 'Pool deposits',
    area: 'liquidity',
    description: 'Pool-specific liquidity deposits are paused for one or more assets.',
    searchTerms: ['pool deposit pause', 'PauseLPDeposit', 'deposit liquidity'],
    scoped: true,
  },
  {
    key: 'PauseAsymWithdrawal-*',
    label: 'Asym LP withdrawals',
    area: 'liquidity',
    description: 'Asymmetric liquidity withdrawals are paused for one or more chains.',
    searchTerms: ['asymmetric withdrawal', 'asym withdrawal', 'LP withdrawal'],
    scoped: true,
  },
  {
    key: 'RUNEPoolHaltDeposit',
    label: 'RUNEPool deposits',
    area: 'RUNEPool',
    description: 'RUNEPool deposits are halted when active.',
    searchTerms: ['RUNEPool deposit halt', 'protocol owned liquidity deposit', 'POL deposit'],
  },
  {
    key: 'RUNEPoolHaltWithdraw',
    label: 'RUNEPool withdrawals',
    area: 'RUNEPool',
    description: 'RUNEPool withdrawals are halted when active.',
    searchTerms: ['RUNEPool withdrawal halt', 'protocol owned liquidity withdrawal', 'POL withdrawal'],
  },
  {
    key: 'PAUSELOANS',
    label: 'Loans',
    area: 'loans',
    description: 'Legacy loan actions are paused when active.',
    searchTerms: ['THORFi loans', 'lending', 'loan pause'],
  },
  {
    key: 'HALTCHAINGLOBAL',
    label: 'Chain observation',
    area: 'signing and observation',
    description: 'Global chain observation is halted when active.',
    searchTerms: ['chain halt', 'observation halt', 'inbound observation'],
  },
  {
    key: 'NODEPAUSECHAINGLOBAL',
    label: 'Node chain pause',
    area: 'signing and observation',
    description: 'Node-requested chain pausing is active until this height when the Mimir key is active.',
    searchTerms: ['node pause chain', 'chain pause', 'node requested pause'],
  },
  {
    key: 'HALTCHURNING',
    label: 'Churning',
    area: 'node operations',
    description: 'Validator/vault rotation is halted when active.',
    searchTerms: ['validator churn', 'vault rotation', 'churning halt'],
  },
  {
    key: 'PauseBond',
    label: 'Bonding',
    area: 'node operations',
    description: 'Node bond actions are paused when active.',
    searchTerms: ['node bond', 'bond pause', 'bonding halted'],
  },
  {
    key: 'PauseUnbond',
    label: 'Unbonding',
    area: 'node operations',
    description: 'Node unbond actions are paused when active.',
    searchTerms: ['node unbond', 'unbond pause', 'unbonding halted'],
  },
  {
    key: 'HaltRebond',
    label: 'Rebonding',
    area: 'node operations',
    description: 'Node rebond actions are halted when active.',
    searchTerms: ['rebond halt', 'bond provider rebond', 'node operations'],
  },
  {
    key: 'HaltOperatorRotate',
    label: 'Operator rotation',
    area: 'node operations',
    description: 'Node operator rotation is halted when active.',
    searchTerms: ['operator rotate', 'operator rotation halt', 'node operator'],
  },
  {
    key: 'HaltOracle',
    label: 'Oracle',
    area: 'app layer',
    description: 'Oracle operations are halted when active.',
    searchTerms: ['oracle halt', 'app layer oracle', 'price feed'],
  },
  {
    key: 'HALTSECUREDGLOBAL',
    label: 'Secured assets',
    area: 'secured assets',
    description: 'Secured-asset operations are halted when active.',
    searchTerms: ['secured asset halt', 'secured asset deposit', 'secured asset withdrawal'],
  },
  {
    key: 'HaltSecuredDeposit-*',
    label: 'Secured deposits',
    area: 'secured assets',
    description: 'Secured-asset deposits are paused for one or more chains.',
    searchTerms: ['secured deposit halt', 'secured assets deposit', 'secured asset mint'],
    scoped: true,
  },
  {
    key: 'HaltSecuredWithdraw-*',
    label: 'Secured withdrawals',
    area: 'secured assets',
    description: 'Secured-asset withdrawals are paused for one or more chains.',
    searchTerms: ['secured withdrawal halt', 'secured assets withdraw', 'secured asset redeem'],
    scoped: true,
  },
  {
    key: 'TCYCLAIMINGHALT',
    label: 'TCY claiming',
    area: 'TCY',
    description: 'TCY claim actions are halted when active.',
    searchTerms: ['TCY claim', 'claim TCY', 'recovery claim'],
  },
  {
    key: 'TCYCLAIMINGSWAPHALT',
    label: 'TCY claim swaps',
    area: 'TCY',
    description: 'TCY claim swap actions are halted when active.',
    searchTerms: ['TCY claim swap', 'claim swap halted', 'recovery swap'],
  },
  {
    key: 'TCYSTAKINGHALT',
    label: 'TCY staking',
    area: 'TCY',
    description: 'TCY staking actions are halted when active.',
    searchTerms: ['stake TCY', 'TCY staking halt', 'TCY yield'],
  },
  {
    key: 'TCYSTAKEDISTRIBUTIONHALT',
    label: 'TCY distributions',
    area: 'TCY',
    description: 'TCY stake distribution is halted when active.',
    searchTerms: ['TCY distribution', 'stake distribution halt', 'TCY rewards'],
  },
  {
    key: 'TCYUNSTAKINGHALT',
    label: 'TCY unstaking',
    area: 'TCY',
    description: 'TCY unstaking actions are halted when active.',
    searchTerms: ['unstake TCY', 'TCY unstaking halt', 'TCY unlock'],
  },
  {
    key: 'HALTTCYTRADING',
    label: 'TCY trading',
    area: 'TCY',
    description: 'TCY trading is halted when active.',
    searchTerms: ['trade TCY', 'TCY trading halt', 'TCY swaps'],
  },
  {
    key: 'HALTWASMGLOBAL',
    label: 'WASM/app layer',
    area: 'app layer',
    description: 'WASM/app-layer actions are halted when active.',
    searchTerms: ['WASM halt', 'CosmWasm halt', 'app layer halt', 'smart contract halt'],
  },
  {
    key: 'HaltWasmDeployer-*',
    label: 'WASM deployers',
    area: 'app layer',
    description: 'WASM deployments are halted for one or more scoped deployers.',
    searchTerms: ['WASM deployer halt', 'contract deployer', 'permissioned deployer'],
    scoped: true,
  },
  {
    key: 'HaltWasmCs-*',
    label: 'WASM code checksums',
    area: 'app layer',
    description: 'WASM code checksum execution is halted for one or more scoped checksums.',
    searchTerms: ['WASM checksum halt', 'code checksum', 'contract code halt'],
    scoped: true,
  },
  {
    key: 'HaltWasmContract-*',
    label: 'WASM contracts',
    area: 'app layer',
    description: 'WASM contract execution is halted for one or more scoped contracts.',
    searchTerms: ['WASM contract halt', 'contract execution halt', 'smart contract pause'],
    scoped: true,
  },
  {
    key: 'TRADEACCOUNTSENABLED',
    label: 'Trade accounts',
    area: 'trade accounts',
    description: 'Trade accounts are unavailable when disabled.',
    searchTerms: ['trade accounts enabled', 'trade assets', 'professional trading'],
  },
  {
    key: 'TRADEACCOUNTSDEPOSITENABLED',
    label: 'Trade deposits',
    area: 'trade accounts',
    description: 'Trade-account deposits are unavailable when disabled.',
    searchTerms: ['trade account deposits', 'trade deposit enabled', 'trade asset deposit'],
  },
  {
    key: 'MANUALSWAPSTOSYNTHDISABLED',
    label: 'Manual synth swaps',
    area: 'synths',
    description: 'Manual swaps to synthetic assets are disabled when active.',
    searchTerms: ['manual synth swaps', 'synth swap disabled', 'synthetic asset swap'],
  },
  {
    key: 'RUNEPOOLENABLED',
    label: 'RUNEPool',
    area: 'RUNEPool',
    description: 'RUNEPool is unavailable when disabled.',
    searchTerms: ['RUNEPool enabled', 'RUNEPool availability', 'protocol owned liquidity'],
  },
  {
    key: 'BANKSENDENABLED',
    label: 'Bank sends',
    area: 'bank sends',
    description: 'Native bank-send messages are unavailable when disabled.',
    searchTerms: ['bank send enabled', 'native bank send', 'Cosmos bank send'],
  },
];

export const EXACT_MONITORED_MIMIR_KEYS = OPERATIONAL_CONTROL_CATALOG
  .filter((control) => !control.scoped)
  .map((control) => control.key);

export const PREFIX_MONITORED_MIMIR_KEYS = OPERATIONAL_CONTROL_CATALOG
  .filter((control) => control.scoped)
  .map((control) => control.key.replace(/\*$/, ''));

export const REVIEWED_NON_PAUSING_OPERATIONAL_MIMIR_PREFIXES = [
  'DYNAMICFEE-WHITELIST-',
  'EVMALLOWANCECHECK-',
  'ADR',
  'POL-',
  'TORANCHOR-',
] as const;

export const UNKNOWN_OPERATION_REVIEW_MIMIR_PREFIXES = [
  'STOPSOLVENCYCHECK',
  'RAGNAROK-',
] as const;

export const REVIEWED_OPERATIONAL_SUPPORT_MIMIR_PREFIXES = [
  'COMPROMISEDVAULT-',
  'ENABLESWITCH-',
  'EVMDISABLECONTRACTWHITELIST',
  'BURNSYNTHS',
  'SCHEDULEDMIGRATION',
  'FUNDMIGRATIONINTERVAL',
  'MIMIRRECALLFUND',
  'MIMIRUPGRADECONTRACT',
] as const;

const OPERATIONAL_CONTROL_CATALOG_BY_KEY = new Map(
  OPERATIONAL_CONTROL_CATALOG.map((control) => [control.key.toUpperCase(), control])
);

export function getOperationalControlCatalogEntry(key: string) {
  const entry = OPERATIONAL_CONTROL_CATALOG_BY_KEY.get(key.toUpperCase());
  if (!entry) {
    throw new Error(`Missing operational control catalog entry for ${key}.`);
  }
  return entry;
}

export function operationalControlPrefixSearchKey(key: string) {
  return key.replace(/\*$/, '');
}
