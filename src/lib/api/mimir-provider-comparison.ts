import { THORNODE_PROVIDER_DEFAULTS } from '../../../scripts/lib/thornode-data-policy.mjs';
import { readFixedMimirProvider } from '@/lib/api/thornode';
import type { MimirProviderCell, MimirProviderSample } from '@/lib/types';

export const COMPARISON_CONTROL_KEYS = ['HALTTRADING', 'HALTSIGNING', 'PAUSELP', 'RUNEPOOLENABLED', 'HALTMEMOLESS', 'ENABLEADVSWAPQUEUE'] as const;
const staleReceiptMs = 30000;

function cell(raw: Record<string, unknown>, key: string): MimirProviderCell {
  const matching = Object.keys(raw).filter(candidate => candidate.toUpperCase() === key);
  if (!matching.length) return { state: 'missing', raw: null, normalized: null };
  if (matching.length > 1) return { state: 'alias-conflict', raw: null, normalized: null };
  const value = raw[matching[0]];
  const scalar = typeof value === 'string' && value.length <= 80 ? value : typeof value === 'number' && Number.isSafeInteger(value) ? value : null;
  if (scalar === null || !/^[+-]?\d{1,80}$/.test(String(scalar))) return { state: 'malformed', raw: scalar, normalized: null };
  const integer = BigInt(scalar);
  if (integer < -(BigInt(2) ** BigInt(63)) || integer > BigInt(2) ** BigInt(63) - BigInt(1)) return { state: 'malformed', raw: scalar, normalized: null };
  return { state: 'valid', raw: scalar, normalized: integer.toString() };
}

export async function collectMimirProviderComparison(height?: number, signal?: AbortSignal): Promise<MimirProviderSample[]> {
  if (height !== undefined && (!Number.isSafeInteger(height) || height < 0)) throw new Error('Invalid requested height.');
  return Promise.all(([0, 1] as const).map(async index => {
    const startedAt = new Date().toISOString();
    const startedMono = performance.now();
    const provider = THORNODE_PROVIDER_DEFAULTS[index];
    const source = { label: provider.label, url: `${provider.url}/mimir${height === undefined ? '' : `?height=${height}`}` };
    let observedHeight: number | null = null;
    let verification: MimirProviderSample['verification'] = 'unverified';
    let error: string | null = null;
    let raw: Record<string, unknown> | null = null;
    try {
      const response = await readFixedMimirProvider(index, height, signal);
      if (!response.raw || typeof response.raw !== 'object' || Array.isArray(response.raw)) throw new Error('Mimir response is not an object.');
      raw = response.raw as Record<string, unknown>;
      if (response.responseHeight !== null) {
        if (!/^\d{1,16}$/.test(response.responseHeight) || !Number.isSafeInteger(Number(response.responseHeight))) throw new Error('Malformed observed height header.');
        observedHeight = Number(response.responseHeight);
        if (height !== undefined) verification = observedHeight === height ? 'verified' : 'mismatch';
      }
    } catch (cause) {
      error = cause instanceof Error ? cause.message.slice(0, 256) : 'Provider observation unavailable.';
      raw = null;
    }
    const checkedAt = new Date().toISOString();
    return { status: raw ? 'observed' : 'unavailable', source, checkedAt, collection: { startedAt, completedAt: checkedAt, durationMs: Math.round(performance.now() - startedMono) }, requestedHeight: height ?? null, observedHeight, verification, error,
      values: Object.fromEntries(COMPARISON_CONTROL_KEYS.map(key => [key, raw ? cell(raw, key) : { state: 'missing', raw: null, normalized: null }])) };
  }));
}

export function compareMimirProviderSamples(samples: MimirProviderSample[], now: number) {
  const stale = samples.map(sample => !Number.isFinite(Date.parse(sample.checkedAt)) || now - Date.parse(sample.checkedAt) > staleReceiptMs || now < Date.parse(sample.checkedAt));
  const sameVerifiedHeight = samples.length === 2 && samples.every(sample => sample.verification === 'verified') && samples[0].observedHeight === samples[1].observedHeight;
  const rows = COMPARISON_CONTROL_KEYS.map(key => {
    const pair = samples.map(sample => sample.values[key]);
    const comparable = samples.length === 2 && samples.every((sample, index) => sample.status === 'observed' && sample.verification !== 'mismatch' && !stale[index] && pair[index]?.state === 'valid');
    const relation = !comparable ? 'unavailable' : pair[0].normalized === pair[1].normalized ? 'equal-observations' : sameVerifiedHeight ? 'conflict-at-verified-height' : 'different-samples';
    return { key, relation, pair };
  });
  return { stale, rows };
}
