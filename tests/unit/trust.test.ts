import { describe, expect, it } from 'vitest';
import {
  formatPercent,
  formatRuneFromBaseUnits,
  getConfidenceLabel,
  getFreshnessLabel,
  getLiveDataCopy,
  getTokenomicsToneBadgeVariant,
  getTokenomicsToneLabel,
  liveDegraded,
  liveOk,
  normalizeApyToPercent,
  runeBaseUnitsToNumber,
} from '@/lib/trust';

describe('trust helpers', () => {
  it('converts RUNE base units exactly once at display boundary', () => {
    expect(runeBaseUnitsToNumber('100000000')).toBe(1);
    expect(runeBaseUnitsToNumber(BigInt(200000000))).toBe(2);
    expect(runeBaseUnitsToNumber(0)).toBe(0);
    expect(runeBaseUnitsToNumber('0')).toBe(0);
    expect(runeBaseUnitsToNumber('not-a-number')).toBeNull();
  });

  it('rejects non-canonical base-unit source strings instead of coercing them', () => {
    expect(runeBaseUnitsToNumber(' ')).toBeNull();
    expect(runeBaseUnitsToNumber(' 0')).toBeNull();
    expect(runeBaseUnitsToNumber('100000000 ')).toBeNull();
    expect(runeBaseUnitsToNumber('0x10')).toBeNull();
    expect(runeBaseUnitsToNumber('1e8')).toBeNull();
    expect(runeBaseUnitsToNumber('100000000.0')).toBeNull();
  });

  it('formats large RUNE base units without unsafe Number coercion', () => {
    expect(runeBaseUnitsToNumber('900719925474099100000000')).toBe(Number.MAX_SAFE_INTEGER);
    expect(runeBaseUnitsToNumber('900719925474099200000000000000000')).toBeNull();
    expect(formatRuneFromBaseUnits('900719925474099212345678')).toBe('9,007,199,254,740,992');
    expect(formatRuneFromBaseUnits('149999999')).toBe('1');
    expect(formatRuneFromBaseUnits('150000000')).toBe('2');
  });

  it('normalizes decimal and percentage shaped APY values', () => {
    expect(normalizeApyToPercent('0', 'decimal')).toBe(0);
    expect(normalizeApyToPercent('0.12', 'decimal')).toBe(12);
    expect(normalizeApyToPercent('1.5', 'decimal')).toBe(150);
    expect(normalizeApyToPercent(12, 'percent')).toBe(12);
    expect(normalizeApyToPercent('150', 'percent')).toBe(150);
    expect(normalizeApyToPercent('bad')).toBeNull();
  });

  it('rejects APY source strings that JavaScript would otherwise coerce', () => {
    expect(normalizeApyToPercent(' ')).toBeNull();
    expect(normalizeApyToPercent(' 0')).toBeNull();
    expect(normalizeApyToPercent('0 ')).toBeNull();
    expect(normalizeApyToPercent('0x10')).toBeNull();
    expect(normalizeApyToPercent('1e2')).toBeNull();
    expect(normalizeApyToPercent('1.2.3')).toBeNull();
  });

  it('formats percentages and labels confidence/freshness', () => {
    expect(formatPercent(12.345)).toBe('12.35%');
    expect(formatPercent(null)).toBe('Unavailable');
    expect(getConfidenceLabel('official')).toBe('Official source');
    expect(getConfidenceLabel('needs-review')).toBe('Needs review');
    expect(getFreshnessLabel({ checkedAt: '2026-06-18', confidence: 'curated' })).toBe('Checked 2026-06-18');
  });

  it('keeps tokenomics provenance tones visually distinct', () => {
    expect(getTokenomicsToneLabel('source-backed')).toBe('Source-backed');
    expect(getTokenomicsToneBadgeVariant('source-backed')).toBe('success');
    expect(getTokenomicsToneBadgeVariant('historical')).toBe('info');
    expect(getTokenomicsToneBadgeVariant('dynamic')).toBe('warning');
    expect(getTokenomicsToneBadgeVariant('current-only')).toBe('danger');
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
