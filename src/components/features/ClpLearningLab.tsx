'use client';

import { useState, type FormEvent } from 'react';
import Link from 'next/link';
import { calculateClpScenario } from '@/lib/clp-learning-lab';
import { CLP_LEARNING_MODEL_RECORD } from '@/lib/data/static';
import { FreshnessMeta } from '@/components/ui/FreshnessMeta';

export function ClpLearningLab() {
  const record = CLP_LEARNING_MODEL_RECORD;
  const [result, setResult] = useState(() => calculateClpScenario('100', '1000', '1000'));
  function calculate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    setResult(calculateClpScenario(String(data.get('input') ?? ''), String(data.get('inputDepth') ?? ''), String(data.get('outputDepth') ?? '')));
  }
  return <section aria-label="Educational CLP scenario" className="not-prose my-6 rounded-lg border border-border bg-surface-elevated p-4 text-sm">
    <h3 className="font-semibold text-slate-100">{record.data.title}</h3>
    <p className="mt-2 text-slate-300">{record.data.assumptions}</p>
    <p className="mt-2 text-slate-400">{record.data.ruleScope}</p>
    <form onSubmit={calculate} className="mt-4 space-y-3">
      <p id="clp-model-input-help" className="text-slate-300">Use ordinary decimals from 0 to 1,000,000,000 with at most eight decimal places. Both depths must be positive. Values are abstract model units; output and fee use output-side units.</p>
      {[
        { name: 'input', label: 'Input amount (x)', value: '100' },
        { name: 'inputDepth', label: 'Input-side depth (X)', value: '1000' },
        { name: 'outputDepth', label: 'Output-side depth (Y)', value: '1000' },
      ].map(field => <label key={field.name} className="block text-slate-200">{field.label}
        <input name={field.name} defaultValue={field.value} type="text" inputMode="decimal" maxLength={19} aria-describedby="clp-model-input-help" className="mt-1 block w-full min-w-0 rounded border border-border bg-surface p-2" />
      </label>)}
      <button type="submit" className="rounded border border-border px-3 py-2 text-accent">Calculate toy scenario</button>
    </form>
    <div role="status" aria-live="polite" className="mt-4 rounded border border-border p-3">
      {result ? <dl className="space-y-2">
        <div><dt>Model slip ratio</dt><dd>{result.slipPercent}%</dd></div>
        <div><dt>Model liquidity fee (output-side units)</dt><dd>{result.fee}</dd></div>
        <div><dt>Model output after liquidity fee (output-side units)</dt><dd>{result.output}</dd></div>
      </dl> : <p>Result unavailable: enter bounded ordinary decimals and positive depths. Invalid inputs are not converted to zero.</p>}
    </div>
    <p className="mt-3 text-slate-300">The displayed amounts round down to eight model decimals. Slip ratio is not the fee amount. This is one fixed-depth algebraic leg; it omits streaming, queue ordering, two-pool routing, live fee floors, outbound fees, rounding rules and halt state.</p>
    <p className="mt-3 text-amber-200">A toy result is not a quote, investment return, price target or proof a route can execute. <Link href="/network#check-a-route" className="text-accent underline">Check current route evidence</Link> separately.</p>
    <div className="mt-4"><FreshnessMeta freshness={record.freshness} sources={record.sources} /></div>
  </section>;
}
