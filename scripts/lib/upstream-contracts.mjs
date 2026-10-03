import { DEFAULT_THORNODE_SOURCES, INBOUND_OPERATION_FIELDS, parseLatestBlockInfo } from './live-chain-snapshot.mjs';

const thor = DEFAULT_THORNODE_SOURCES[0];
const midgard = 'https://gateway.liquify.com/chain/thorchain_midgard/v2';
const maya = 'https://midgard.mayachain.info/v2';
const network = ['totalPooledRune', 'totalReserve', 'activeNodeCount', 'standbyNodeCount', 'bondingAPY', 'liquidityAPY', 'nextChurnHeight'];
export const CONTRACT_SOURCES = [
  { id: 'thor-version', url: `${thor.url}/version`, fields: ['current', 'next'] },
  { id: 'thor-block', url: `${thor.cosmosUrl}/base/tendermint/v1beta1/blocks/latest`, fields: { block: { header: ['height', 'time', 'version'] } } },
  { id: 'thor-mimir', url: `${thor.url}/mimir`, fields: ['HALTTRADING', 'HALTSIGNING', 'PAUSELP', 'HALTCHAINGLOBAL', 'L1DYNAMICFEEENABLED', 'L1SLIPMINBPS', 'RUNEPOOLENABLED', 'RUNEPOOLDEPOSITMATURITYBLOCKS', 'RUNEPOOLMAXRESERVEBACKSTOP', 'MINRUNEPOOLDEPTH'] },
  { id: 'thor-inbound', url: `${thor.url}/inbound_addresses`, fields: ['chain', ...INBOUND_OPERATION_FIELDS, 'gas_rate', 'gas_rate_units', 'outbound_tx_size', 'outbound_fee', 'dust_threshold'] },
  { id: 'thor-runepool', url: `${thor.url}/runepool`, fields: { pol: ['rune_deposited', 'rune_withdrawn', 'value', 'pnl', 'current_deposit'], providers: ['units', 'pending_units', 'pending_rune', 'value', 'pnl', 'current_deposit'], reserve: ['units', 'value', 'pnl', 'current_deposit'] } },
  { id: 'midgard-network', url: `${midgard}/network`, fields: network },
  { id: 'midgard-pools', url: `${midgard}/pools?status=available`, fields: ['asset', 'assetDepth', 'runeDepth', 'status', 'poolAPY', 'liquidityInUSD', 'volume24h'] },
  { id: 'midgard-earnings', url: `${midgard}/history/earnings?interval=day&count=2`, fields: { intervals: ['startTime', 'endTime', 'earnings', 'avgNodeCount', 'blockRewards', 'liquidityFees', 'bondingEarnings', 'liquidityEarnings', 'runePriceUSD'] } },
  { id: 'maya-network', url: `${maya}/network`, fields: network },
  { id: 'maya-nodes', url: `${maya}/mayachain/nodes`, fields: ['nodeAddress', 'node_address', 'bond', 'slashPoints', 'slash_points', 'status', 'version'] },
];

// ponytail: retain three rows per schema; widen only for a demonstrated parser gap.
export function sanitizeContract(value, fields) {
  if (Array.isArray(value)) return value.slice(0, 3).map((row) => sanitizeContract(row, fields));
  if (!value || typeof value !== 'object') return typeof value === 'string' ? value.slice(0, 256) : value;
  const selected = Array.isArray(fields) ? fields.map((key) => [key, null]) : Object.entries(fields);
  return Object.fromEntries(selected.filter(([key]) => Object.hasOwn(value, key)).map(([key, children]) => {
    const raw = value[key];
    const clean = children ? sanitizeContract(raw, children) : (raw && typeof raw === 'object' ? (Array.isArray(raw) ? [] : {}) : typeof raw === 'string' ? raw.slice(0, 256) : raw);
    // Node identities are substituted, never retained in the fixture or report.
    return [key, /^(nodeAddress|node_address)$/.test(key) && typeof clean === 'string' ? 'redacted-node' : clean];
  }));
}

export function contractShape(value, path = '$') {
  if (Array.isArray(value)) return [`${path}: array`, ...new Set(value.flatMap((item) => contractShape(item, `${path}[]`)))].sort();
  if (value && typeof value === 'object') return [`${path}: object`, ...Object.entries(value).flatMap(([key, child]) => contractShape(child, `${path}.${key}`))].sort();
  return [`${path}: ${value === null ? 'null' : typeof value}`];
}

export function compareContracts(baseline, capture) {
  return capture.contracts.map((item) => {
    if (item.status !== 'captured') return { id: item.id, status: 'provider-unavailable' };
    const previous = baseline.contracts.find((contract) => contract.id === item.id && contract.status === 'captured');
    if (!previous) return { id: item.id, status: 'baseline-missing' };
    const before = contractShape(previous.payload);
    const after = contractShape(item.payload);
    const removed = before.filter((field) => !after.includes(field));
    const added = after.filter((field) => !before.includes(field));
    return { id: item.id, status: removed.length || added.length ? 'shape-changed' : 'unchanged', removed, added };
  });
}

async function readBoundedJson(url, fetchImpl) {
  const response = await fetchImpl(url, { signal: AbortSignal.timeout(5000), cache: 'no-store' });
  if (!response.ok || !response.body) throw new Error('Provider response unavailable');
  const reader = response.body.getReader();
  const chunks = [];
  let size = 0;
  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > 524288) throw new Error('Provider response exceeds capture limit');
      chunks.push(value);
    }
    return JSON.parse(Buffer.concat(chunks).toString('utf8'));
  } finally {
    void reader.cancel().catch(() => {});
  }
}

export async function captureContracts({ fetchImpl = fetch, now = () => new Date().toISOString() } = {}) {
  const contracts = [];
  for (const source of CONTRACT_SOURCES) {
    try {
      const raw = await readBoundedJson(source.url, fetchImpl);
      contracts.push({ id: source.id, sourceUrl: source.url, observedAt: now(), status: 'captured', payload: sanitizeContract(raw, source.fields) });
    } catch {
      // Do not persist response bodies, raw errors, addresses, or query-bearing upstream diagnostics.
      contracts.push({ id: source.id, sourceUrl: source.url, observedAt: now(), status: 'provider-unavailable' });
    }
  }
  const version = contracts.find((item) => item.id === 'thor-version')?.payload?.current ?? null;
  let height = null;
  try { height = parseLatestBlockInfo(contracts.find((item) => item.id === 'thor-block')?.payload).height; } catch { height = null; }
  return { schemaVersion: 1, capturedAt: now(), protocolVersion: version, height, context: 'THORNode version and height are separate observations; Midgard/Maya indexer heights are unavailable in these captures.', contracts };
}
