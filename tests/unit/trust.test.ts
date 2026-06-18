import { describe, expect, it } from 'vitest';
import {
  formatPercent,
  getConfidenceLabel,
  getFreshnessLabel,
  getLiveDataCopy,
  liveDegraded,
  liveOk,
  normalizeApyToPercent,
  runeBaseUnitsToNumber,
} from '@/lib/trust';

describe('trust helpers', () => {
  it('converts RUNE base units exactly once at display boundary', () => {
    expect(runeBaseUnitsToNumber('100000000')).toBe(1);
    expect(runeBaseUnitsToNumber(BigInt(200000000))).toBe(2);
    expect(runeBaseUnitsToNumber('0')).toBe(0);
    expect(runeBaseUnitsToNumber('not-a-number')).toBeNull();
  });

  it('normalizes decimal and percentage shaped APY values', () => {
    expect(normalizeApyToPercent('0.12', 'decimal')).toBe(12);
    expect(normalizeApyToPercent('1.5', 'decimal')).toBe(150);
    expect(normalizeApyToPercent(12, 'percent')).toBe(12);
    expect(normalizeApyToPercent('150', 'percent')).toBe(150);
    expect(normalizeApyToPercent('bad')).toBeNull();
  });

  it('formats percentages and labels confidence/freshness', () => {
    expect(formatPercent(12.345)).toBe('12.35%');
    expect(formatPercent(null)).toBe('Unavailable');
    expect(getConfidenceLabel('official')).toBe('Official source');
    expect(getConfidenceLabel('needs-review')).toBe('Needs review');
    expect(getFreshnessLabel({ checkedAt: '2026-06-18', confidence: 'curated' })).toBe('Checked 2026-06-18');
  });

  it('creates current-only and degraded live data copy', () => {
    const source = { label: 'Midgard', url: 'https://midgard.thorchain.network/v2' };
    const ok = liveOk({ value: 1 }, source, '2026-06-18T00:00:00.000Z');
    const degraded = liveDegraded('Source did not respond', source, '2026-06-18T00:00:00.000Z');

    expect(ok.status).toBe('ok');
    expect(getLiveDataCopy(ok)).toContain('Current-only');
    expect(degraded.status).toBe('degraded');
    expect(getLiveDataCopy(degraded)).toBe('Source did not respond');
  });
});
