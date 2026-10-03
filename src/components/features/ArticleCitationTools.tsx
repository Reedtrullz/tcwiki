'use client';

import { useEffect, useRef, useState } from 'react';
import type { ContentEntry } from '@/lib/content/registry';
import { buildArticleCitation } from '@/lib/article-citation';
import { routeUrl } from '@/lib/site';

export function ArticleCitationTools({ entry, boundary }: { entry: ContentEntry; boundary: string }) {
  const anchor = useRef<HTMLDivElement>(null);
  const [citation, setCitation] = useState('');
  const [message, setMessage] = useState('');
  useEffect(() => {
    let saved: Array<[HTMLDetailsElement, boolean]> = [];
    function beforePrint() {
      if (saved.length) return;
      saved = Array.from(anchor.current?.closest('.printable-article')?.querySelectorAll('details') ?? []).map(detail => [detail, detail.open]);
      for (const [detail] of saved) detail.open = true;
    }
    function afterPrint() { for (const [detail, open] of saved) detail.open = open; saved = []; }
    window.addEventListener('beforeprint', beforePrint);
    window.addEventListener('afterprint', afterPrint);
    return () => { window.removeEventListener('beforeprint', beforePrint); window.removeEventListener('afterprint', afterPrint); afterPrint(); };
  }, []);
  async function copy(format: 'text' | 'markdown') {
    const text = buildArticleCitation(entry, boundary, format, window.location.hash);
    setCitation(text);
    try { await navigator.clipboard.writeText(text); setMessage('Citation copied.'); }
    catch { setMessage('Clipboard unavailable. Select and copy the citation below.'); }
  }
  function downloadCitation() {
    const text = buildArticleCitation(entry, boundary, 'text', window.location.hash);
    const blobUrl = URL.createObjectURL(new Blob([text], { type: 'text/plain;charset=utf-8' }));
    const link = document.createElement('a');
    link.href = blobUrl; link.download = `${entry.id}-citation.txt`; link.click();
    window.setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);
  }
  return <>
    <div ref={anchor} className="article-citation-tools mb-6 rounded-lg border border-border p-3" aria-label="Article citation tools">
      <div className="flex flex-wrap gap-3 text-sm">
        <button type="button" onClick={() => window.print()} className="text-accent underline">Print article</button>
        <button type="button" onClick={() => void copy('text')} className="text-accent underline">Copy citation</button>
        <button type="button" onClick={() => void copy('markdown')} className="text-accent underline">Copy Markdown citation</button>
        <button type="button" onClick={downloadCitation} className="text-accent underline">Save citation</button>
      </div>
      <p role="status" className="mt-2 text-xs text-slate-400">{message}</p>
      {citation && <label className="mt-2 block text-xs text-slate-300">Citation text
        <textarea readOnly value={citation} onFocus={event => event.target.select()} rows={8} className="mt-1 w-full rounded border border-border bg-surface p-2 text-xs" />
      </label>}
    </div>
    <div className="article-print-reference hidden">
      <p>{entry.title} — {routeUrl(entry.href)}</p>
      <p>Wiki review {entry.reviewedAt}; due {entry.nextReviewDue}; {entry.confidence}.</p>
      <p>{boundary}</p>
      <ul>{entry.sources.map(source => <li key={source.url}>{source.label}: {source.url}; retrieved {source.retrievedAt ?? 'date not recorded'}{source.notes ? `; ${source.notes}` : ''}</li>)}</ul>
      <p>Printed editorial evidence; source retrieval and review do not establish current protocol state.</p>
    </div>
  </>;
}
