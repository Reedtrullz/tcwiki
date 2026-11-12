// Live public providers the app may call. Dead hosts are removed here, not kept as silent fallbacks.
export const MIDGARD_PROVIDER_DEFAULTS = Object.freeze([
  Object.freeze({ label: 'Liquify Midgard', url: 'https://gateway.liquify.com/chain/thorchain_midgard/v2' }),
]);
