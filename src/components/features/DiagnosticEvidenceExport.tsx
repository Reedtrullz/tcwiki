'use client';

import { useState } from 'react';
import type { LiveDataResult, NetworkStatus } from '@/lib/types';
import { buildDiagnosticExport, diagnosticExportText } from '@/lib/diagnostic-export';

export function DiagnosticEvidenceExport({ result }: { result?: LiveDataResult<NetworkStatus> }) {
  const [output, setOutput] = useState('');
  const [format, setFormat] = useState<'json' | 'markdown'>('json');
  const [message, setMessage] = useState('');
  function capture(nextFormat: 'json' | 'markdown') {
    setFormat(nextFormat);
    setOutput(diagnosticExportText(buildDiagnosticExport(result, new Date().toISOString()), nextFormat));
    setMessage('Captured the displayed control sample. Export time does not refresh its evidence.');
  }
  async function copy() {
    try { await navigator.clipboard.writeText(output); setMessage('Evidence copied.'); }
    catch { setMessage('Clipboard unavailable. Select and copy the evidence below.'); }
  }
  function download() {
    const url = URL.createObjectURL(new Blob([output], { type: format === 'json' ? 'application/json' : 'text/markdown;charset=utf-8' }));
    const link = document.createElement('a');
    link.href = url; link.download = `tcwiki-network-controls-v1.${format === 'json' ? 'json' : 'md'}`; link.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  return <details className="mt-4 min-w-0 rounded border border-border p-3">
    <summary className="cursor-pointer font-medium">Export observed network controls</summary>
    <section aria-label="Observed control evidence export" className="mt-3 min-w-0">
      <p className="text-sm text-slate-300">Capture this already collected public control sample as JSON or Markdown. Missing runtime identity and unverified height remain explicit. No quotes, node/address records or additional provider requests are included.</p>
      <div className="mt-3 flex flex-wrap gap-3 text-sm">
        <button type="button" onClick={() => capture('json')} className="text-accent underline">Capture JSON evidence</button>
        <button type="button" onClick={() => capture('markdown')} className="text-accent underline">Capture Markdown evidence</button>
        {output && <><button type="button" onClick={() => void copy()} className="text-accent underline">Copy observed evidence</button>
          <button type="button" onClick={download} className="text-accent underline">Download observed evidence</button></>}
      </div>
      <p role="status" className="mt-2 text-sm text-slate-400">{message}</p>
      {output && <label className="mt-3 block text-sm">Observed evidence text
        <textarea readOnly value={output} rows={10} onFocus={event => event.target.select()} className="mt-1 block w-full min-w-0 rounded border border-border bg-surface p-2 text-xs" />
      </label>}
    </section>
  </details>;
}
