import type { DiagnosticEvidenceExport, LiveDataResult, NetworkStatus } from '@/lib/types';

const text = (value: string | undefined) => value === undefined ? null : value.slice(0, 512);

/** Project only already observed public control evidence; never fetch or infer identity. */
export function buildDiagnosticExport(result: LiveDataResult<NetworkStatus> | undefined, exportedAt: string): DiagnosticEvidenceExport {
  const data = result?.data;
  const sources = result?.sources ?? (result?.source ? [result.source] : []);
  const warnings = data?.sourceWarnings ?? [];
  const controls = data?.monitoredControls ?? [];
  const invalid = data?.invalidMimirKeys ?? [];
  const observed = data?.observedMimir;
  const entries = observed ? Object.entries(observed).sort(([left], [right]) => left.localeCompare(right, 'en')) : [];
  const selected = entries.filter(([key]) => key.length <= 128).slice(0, 256);
  const values: DiagnosticEvidenceExport['rawMimir']['values'] = Object.fromEntries(selected.map(([key, value]) => [key,
    key.length <= 128 && ((typeof value === 'number' && Number.isSafeInteger(value)) || (typeof value === 'string' && /^-?\d{1,100}$/.test(value)))
      ? value : { unavailable: 'Unsupported observed value' },
  ]));
  return {
    format: 'tcwiki-network-controls', schemaVersion: 1, exportedAt, scope: 'already-collected-network-controls',
    limitation: 'Not provider attestation or a transaction receipt. This public-control projection omits node/address records and quotes. Missing identity, timing and height proof remain null. Export time does not refresh the retained sample. Text fields are limited to 512 characters, control labels to 256 and keys to 128; oversized raw keys are omitted. Collection sizes and omissions are recorded below.',
    status: result?.status ?? 'unavailable', checkedAt: text(result?.checkedAt), assessedAt: text(result?.assessedAt),
    presentation: result?.presentation ? { ...result.presentation } : null,
    collection: result?.collection ? { ...result.collection } : null,
    runtime: { version: null, commit: null, image: null },
    height: { observed: data?.thorchainHeight ?? null, snapshotPinned: data?.thorchainSnapshotPinned ?? null, blockTime: text(data?.thorchainBlockTime) },
    sources: sources.slice(0, 16).map(source => ({ label: source.label.slice(0, 512), url: source.url.slice(0, 512), retrievedAt: text(source.retrievedAt), heightPinning: source.heightPinning ? { ...source.heightPinning, observedHeight: source.heightPinning.observedHeight ?? null } : null })),
    summary: text(data?.summary), error: text(result?.error), warnings: warnings.slice(0, 32).map(warning => warning.slice(0, 512)),
    invalidMimirKeys: invalid.slice(0, 64).map(key => key.slice(0, 128)),
    controls: controls.slice(0, 64).map(control => ({ key: control.key.slice(0, 128), label: control.label.slice(0, 256), state: control.state, active: control.active })),
    rawMimir: { available: observed !== undefined, unit: 'Raw parsed Mimir control integers; key-specific protocol meaning, not token amounts', values, omitted: entries.length - selected.length },
    omitted: { sources: Math.max(0, sources.length - 16), warnings: Math.max(0, warnings.length - 32), controls: Math.max(0, controls.length - 64), invalidMimirKeys: Math.max(0, invalid.length - 64) },
  };
}

export function diagnosticExportText(snapshot: DiagnosticEvidenceExport, format: 'json' | 'markdown'): string {
  const json = JSON.stringify(snapshot, null, 2);
  if (format === 'json') return json + '\n';
  // A literal JSON block stays inert even if a warning contains HTML or fence characters.
  return `# THORChain Wiki observed network controls\n\n${snapshot.limitation}\n\nNull means not recorded. Omitted counts describe the projection bounds. No new provider request was made.\n\n\`\`\`json\n${json.replace(/`/g, '\\u0060')}\n\`\`\`\n`;
}
