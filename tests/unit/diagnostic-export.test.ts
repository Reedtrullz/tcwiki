import { describe, expect, it } from 'vitest';
import { buildDiagnosticExport, diagnosticExportText } from '@/lib/diagnostic-export';
import type { LiveDataResult, NetworkStatus } from '@/lib/types';
import { deriveNetworkStatus } from '@/lib/api/thornode';

describe('already observed control evidence export', () => {
  it('retains partial evidence, raw precision, source height proof and missing identity', () => {
    const result: LiveDataResult<NetworkStatus> = { status: 'degraded', checkedAt: '2026-10-03T07:00:00Z', presentation: { kind: 'operational', state: 'last-good' },
      source: { label: 'Fixture', url: 'https://thornode.ninerealms.com/thorchain/mimir', heightPinning: { requestedHeight: 99, verification: 'unverified' } },
      data: { ...deriveNetworkStatus({}, [], '3.20.3', 98), state: 'degraded', summary: 'Partial control evidence', observedMimir: { HALTTRADING: '9007199254740993', ZERO: 0 },
        thorchainHeight: 98, thorchainSnapshotPinned: false, sourceWarnings: ['Unverified height'], invalidMimirKeys: [], monitoredControls: [], chainStatuses: [], activeControlKeys: ['HALTTRADING'], activeChainKeys: [], activeEvidenceKeys: [] },
    };
    const snapshot = buildDiagnosticExport(result, '2026-10-03T07:01:00Z');
    expect(snapshot.presentation).toEqual(result.presentation);
    expect(snapshot.rawMimir.values).toEqual({ HALTTRADING: '9007199254740993', ZERO: 0 });
    expect(snapshot.sources[0].heightPinning).toEqual({ requestedHeight: 99, observedHeight: null, verification: 'unverified' });
    expect(snapshot.runtime).toEqual({ version: null, commit: null, image: null });
    expect(snapshot.collection).toBeNull();
    expect(snapshot.warnings).toEqual(['Unverified height']);
    expect(snapshot.height.observed).toBe(98);
    expect(snapshot.height.snapshotPinned).toBe(false);
  });
  it('makes absent evidence explicit and serializes deterministic inert JSON/Markdown', () => {
    const snapshot = buildDiagnosticExport(undefined, '2026-10-03T07:01:00Z');
    expect(snapshot.status).toBe('unavailable');
    expect(snapshot.rawMimir.available).toBe(false);
    expect(snapshot.height.observed).toBeNull();
    const first = diagnosticExportText(snapshot, 'json');
    expect(first).toBe(diagnosticExportText(snapshot, 'json'));
    expect(JSON.parse(first)).toEqual(snapshot);
    expect(JSON.parse(first).schemaVersion).toBe(1);
    expect(diagnosticExportText(snapshot, 'markdown')).toContain('Not provider attestation');
  });
  it('bounds the cohort and labels unsupported values instead of inventing values', () => {
    const raw = Object.fromEntries(Array.from({ length: 300 }, (_, index) => [`KEY${String(index).padStart(3, '0')}`, index]));
    raw.KEY000 = Number.NaN;
    const result: LiveDataResult<NetworkStatus> = { status: 'ok', checkedAt: '2026-10-03T07:00:00Z', data: { ...deriveNetworkStatus({}, [], '3.20.3', 100), observedMimir: raw } };
    const snapshot = buildDiagnosticExport(result, '2026-10-03T07:01:00Z');
    expect(Object.keys(snapshot.rawMimir.values)).toHaveLength(256);
    expect(snapshot.rawMimir.omitted).toBe(44);
    expect(snapshot.rawMimir.values.KEY000).toEqual({ unavailable: 'Unsupported observed value' });
    expect(diagnosticExportText(snapshot, 'json').length).toBeLessThan(262144);
  });
  it('omits oversized keys and preserves stale metadata without retaining mutable inputs', () => {
    const observedMimir = { ['X'.repeat(300000)]: 1, ZERO: 0 };
    const result: LiveDataResult<NetworkStatus> = { status: 'degraded', checkedAt: '2026-10-01T00:00:00Z', presentation: { kind: 'operational', state: 'stale' },
      data: { ...deriveNetworkStatus({}, [], '3.20.3', 100), observedMimir, sourceWarnings: ['<script>```not executable</script>'] } };
    const snapshot = buildDiagnosticExport(result, '2026-10-03T07:01:00Z');
    observedMimir.ZERO = 99;
    expect(snapshot.rawMimir.values).toEqual({ ZERO: 0 });
    expect(snapshot.rawMimir.omitted).toBe(1);
    expect(snapshot.presentation?.state).toBe('stale');
    expect(snapshot.checkedAt).toBe('2026-10-01T00:00:00Z');
    expect(diagnosticExportText(snapshot, 'markdown')).toContain('\\u0060\\u0060\\u0060');
    expect(diagnosticExportText(snapshot, 'json').length).toBeLessThan(262144);
  });
});
