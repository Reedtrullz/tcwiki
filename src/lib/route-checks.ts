const defaultRouteCheckAmount = '0.01';

const nativeRouteAssetByChain: Record<string, string> = {
  AVAX: 'AVAX.AVAX',
  BASE: 'BASE.ETH',
  BCH: 'BCH.BCH',
  BSC: 'BSC.BNB',
  BTC: 'BTC.BTC',
  DOGE: 'DOGE.DOGE',
  ETH: 'ETH.ETH',
  GAIA: 'GAIA.ATOM',
  LTC: 'LTC.LTC',
  SOL: 'SOL.SOL',
  THOR: 'THOR.RUNE',
  TRON: 'TRON.TRX',
  XRP: 'XRP.XRP',
};

export function routeCheckHrefForChain(chain: string, amount = defaultRouteCheckAmount) {
  const normalizedChain = chain.trim().toUpperCase();
  const fromAsset = nativeRouteAssetByChain[normalizedChain] ?? `${normalizedChain}.${normalizedChain}`;
  const toAsset = fromAsset === 'BTC.BTC' ? 'ETH.ETH' : 'BTC.BTC';
  const params = new URLSearchParams({
    from_asset: fromAsset,
    to_asset: toAsset,
    amount,
  });

  return `/network?${params.toString()}#check-a-route`;
}
