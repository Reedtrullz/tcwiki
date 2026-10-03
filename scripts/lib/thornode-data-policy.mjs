// Shared provider defaults and age limits; collection purpose stays independent.
export const THORNODE_PROVIDER_DEFAULTS = Object.freeze([
  Object.freeze({ label: 'Liquify THORNode', url: 'https://gateway.liquify.com/chain/thorchain_api/thorchain', cosmosUrl: 'https://gateway.liquify.com/chain/thorchain_api/cosmos' }),
  Object.freeze({ label: 'THORChain THORNode', url: 'https://thornode.thorchain.network/thorchain', cosmosUrl: 'https://thornode.thorchain.network/cosmos' }),
]);

export const THORNODE_BLOCK_AGE_POLICY = Object.freeze({
  blockAgeWarningSeconds: 12, blockAgeDegradedSeconds: 30,
  futureWarningSeconds: 12, futureDegradedSeconds: 30,
});

export const THORNODE_CHAIN_SET_POLICY = Object.freeze({
  profile: 'independent-chain-set', snapshotLagBlocks: 1, ...THORNODE_BLOCK_AGE_POLICY,
});

export function appThornodeDataPolicy(configuredLag) {
  const parsed = Number(configuredLag ?? '1');
  return Object.freeze({
    profile: 'app-operations',
    snapshotLagBlocks: Number.isInteger(parsed) && parsed >= 1 && parsed <= 20 ? parsed : 1,
    ...THORNODE_BLOCK_AGE_POLICY,
  });
}
