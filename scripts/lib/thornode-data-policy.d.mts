export interface ThornodeDataPolicy {
  profile: 'app-operations' | 'independent-chain-set';
  snapshotLagBlocks: number;
  blockAgeWarningSeconds: 12;
  blockAgeDegradedSeconds: 30;
  futureWarningSeconds: 12;
  futureDegradedSeconds: 30;
}
export const THORNODE_PROVIDER_DEFAULTS: readonly Readonly<{ label: string; url: string; cosmosUrl: string }>[];
export const THORNODE_BLOCK_AGE_POLICY: Readonly<Omit<ThornodeDataPolicy, 'profile' | 'snapshotLagBlocks'>>;
export const THORNODE_CHAIN_SET_POLICY: Readonly<ThornodeDataPolicy>;
export function appThornodeDataPolicy(configuredLag?: string): Readonly<ThornodeDataPolicy>;
