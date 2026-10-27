'use client';

import { useState, useSyncExternalStore } from 'react';
import { decodeMemo, MEMO_DECODER_MAX_BYTES } from '@/lib/memo-decoder';

interface LocalMemoDecoderExample {
  id: string;
  title: string;
  memo: string;
}

interface LocalMemoDecoderProps {
  examples: LocalMemoDecoderExample[];
}

export function LocalMemoDecoder({ examples }: LocalMemoDecoderProps) {
  const [original, setOriginal] = useState('');
  const hydrated = useSyncExternalStore(() => () => undefined, () => true, () => false);
  const result = decodeMemo(original);
  const byteSummary = result.status === 'too-long'
    ? `More than ${MEMO_DECODER_MAX_BYTES} UTF-8 bytes`
    : `${result.byteLength} UTF-8 bytes`;

  return (
    <div className="not-prose grid min-w-0 gap-4 rounded-lg border border-border bg-surface-elevated p-4 sm:p-5">
      <div>
        <label className="block text-sm font-semibold text-slate-100" htmlFor="local-memo-decoder-input">
          Existing memo
        </label>
        <textarea
          id="local-memo-decoder-input"
          aria-describedby="local-memo-decoder-help"
          autoCapitalize="off"
          autoCorrect="off"
          className="mt-2 min-h-32 w-full min-w-0 resize-y rounded-md border border-border bg-surface px-3 py-2 font-mono text-sm leading-relaxed text-slate-100 placeholder:text-slate-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
          disabled={!hydrated}
          maxLength={1024}
          onChange={(event) => setOriginal(event.currentTarget.value)}
          placeholder="Paste an existing memo to inspect its supported syntax"
          spellCheck={false}
          value={original}
        />
        <p className="mt-2 text-xs leading-relaxed text-slate-300" id="local-memo-decoder-help">
          The input box accepts up to 1,024 characters. This local tool has a separate {MEMO_DECODER_MAX_BYTES}-byte UTF-8 parsing bound. Input stays in this page and is not saved or sent.
        </p>
      </div>

      {examples.length > 0 && (
        <div aria-labelledby="local-memo-decoder-examples-label" className="grid min-w-0 gap-2">
          <p className="text-xs font-semibold text-slate-200" id="local-memo-decoder-examples-label">Load a reviewed source example</p>
          <div className="grid min-w-0 gap-2 sm:grid-cols-2">
            {examples.map((example) => (
              <button
                className="min-w-0 rounded-md border border-border bg-surface px-3 py-2 text-left text-xs leading-relaxed text-slate-200 hover:border-accent/50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
                disabled={!hydrated}
                key={example.id}
                onClick={() => setOriginal(example.memo)}
                type="button"
              >
                <span className="block font-semibold">{example.title}</span>
                <code className="mt-1 block break-all font-mono text-slate-300">{example.memo}</code>
              </button>
            ))}
          </div>
        </div>
      )}

      <div aria-live="polite" aria-atomic="true" className="rounded-md border border-border bg-surface p-3" role="status">
        <p className="text-sm font-semibold text-slate-100">
          {result.status === 'decoded'
            ? `Read as ${result.action} memo intent`
            : result.status === 'empty' ? 'No memo entered' : result.status === 'too-long' ? 'Memo exceeds the local parsing bound' : result.status === 'malformed' ? 'Supported action, malformed fields' : 'Syntax outside the supported subset'}
        </p>
        <p className="mt-1 break-words text-xs leading-relaxed text-slate-300">{result.message}</p>
        <p className="mt-1 text-xs text-slate-400">{byteSummary}</p>
      </div>

      {original && (
        <div className="grid min-w-0 gap-3">
          <div>
            <h3 className="text-sm font-semibold text-slate-100">Original memo, unchanged</h3>
            <pre className="mt-2 max-w-full overflow-x-auto whitespace-pre-wrap break-all rounded-md border border-border bg-surface p-3 font-mono text-xs leading-relaxed text-slate-200"><code>{result.original}</code></pre>
          </div>

          {result.fields.length > 0 && (
            <dl className="grid min-w-0 gap-2 sm:grid-cols-2">
              {result.fields.map((decodedField) => (
                <div className="min-w-0 rounded-md border border-border bg-surface p-3" key={decodedField.id}>
                  <dt className="text-xs font-semibold text-slate-200">{decodedField.label}</dt>
                  <dd className="mt-1 min-w-0 break-all font-mono text-sm text-slate-100">{decodedField.raw || '(empty or omitted slot)'}</dd>
                  <dd className="mt-1 break-words text-xs leading-relaxed text-slate-300">{decodedField.interpretation}</dd>
                </div>
              ))}
            </dl>
          )}
        </div>
      )}

      <p className="text-xs leading-relaxed text-slate-300">
        Parsed fields describe memo syntax and intent only. This tool does not resolve aliases, addresses, THORNames, current fee rules, chain/version applicability, route availability, execution, or settlement.
      </p>
    </div>
  );
}
