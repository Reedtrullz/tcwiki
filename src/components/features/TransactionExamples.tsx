import { TRANSACTION_EXAMPLE_RECORDS } from '@/lib/data/static';
import type { SourceMeta, TransactionExample, TransactionExampleReport, TransactionExampleGuide } from '@/lib/types';

interface TransactionExamplesProps {
  guide: TransactionExampleGuide;
}

function EvidenceLink({ source }: { source: SourceMeta }) {
  return (
    <a className="text-accent underline underline-offset-4" href={source.url}>
      {source.label}
    </a>
  );
}

function EvidenceReport({ report, exampleId, index }: { report: TransactionExampleReport; exampleId: string; index: number }) {
  const layerLabel = report.layer === 'source-chain' ? 'Source-chain record' : 'THORChain indexer record';
  const reportId = `report-${exampleId}-${index}`;
  return (
    <section aria-labelledby={reportId} className="min-w-0 rounded-md border border-border p-4">
      <h4 className="font-semibold" id={reportId}>{report.label}</h4>
      <dl className="mt-3 grid min-w-0 grid-cols-[minmax(0,1fr)] gap-2 sm:grid-cols-[10rem_minmax(0,1fr)]">
        <dt className="text-sm text-slate-400">Evidence layer</dt>
        <dd className="text-sm">{layerLabel}</dd>
        {report.actionType && <>
          <dt className="text-sm text-slate-400">Action or role</dt>
          <dd className="text-sm"><code>{report.actionType}</code></dd>
        </>}
        <dt className="text-sm text-slate-400">Reported status</dt>
        <dd className="text-sm">{report.status}</dd>
        {report.observedAt && <>
          <dt className="text-sm text-slate-400">Record time</dt>
          <dd className="text-sm"><time dateTime={report.observedAt}>{report.observedAt}</time></dd>
        </>}
        {report.height && <>
          <dt className="text-sm text-slate-400">THORChain indexer height</dt>
          <dd className="text-sm"><code>{report.height}</code></dd>
        </>}
        {report.blockHeight && <>
          <dt className="text-sm text-slate-400">Source-chain block</dt>
          <dd className="min-w-0 break-all text-sm">
            <code>{report.blockHeight}</code>
            {report.blockHash && <> · <code>{report.blockHash}</code></>}
            {report.blockTime && <> · <time dateTime={report.blockTime}>{report.blockTime}</time></>}
            {report.blockSource && <> · <EvidenceLink source={report.blockSource} /></>}
          </dd>
        </>}
        {report.transactionId && <>
          <dt className="text-sm text-slate-400">Transaction ID</dt>
          <dd className="break-all text-sm"><code>{report.transactionId}</code></dd>
        </>}
        {report.outputHeight && <>
          <dt className="text-sm text-slate-400">Reported output height</dt>
          <dd className="text-sm"><code>{report.outputHeight}</code></dd>
        </>}
        {report.outputTransactionId && <>
          <dt className="text-sm text-slate-400">Reported output transaction ID</dt>
          <dd className="break-all text-sm"><code>{report.outputTransactionId}</code></dd>
        </>}
        {report.destination && <>
          <dt className="text-sm text-slate-400">Provider-reported destination</dt>
          <dd className="break-all text-sm"><code>{report.destination}</code></dd>
        </>}
        {report.inputs?.map((amount, index) => <div className="contents" key={`input-${index}`}>
          <dt className="text-sm text-slate-400">Reported input amount</dt>
          <dd className="min-w-0 break-words text-sm"><code className="break-all">{amount.amount}</code> <span className="break-all">{amount.asset}</span> {amount.kind && <span className="text-slate-400">({amount.kind})</span>} <span className="text-slate-400">({amount.unit})</span></dd>
        </div>)}
        {report.outputs?.length === 0 && <>
          <dt className="text-sm text-slate-400">Reported outputs</dt>
          <dd className="text-sm">No outbound entries in this response.</dd>
        </>}
        {report.outputs?.map((amount, index) => <div className="contents" key={`output-${index}`}>
          <dt className="text-sm text-slate-400">Reported output amount</dt>
          <dd className="min-w-0 break-words text-sm"><code className="break-all">{amount.amount}</code> <span className="break-all">{amount.asset}</span> {amount.kind && <span className="text-slate-400">({amount.kind})</span>} <span className="text-slate-400">({amount.unit})</span></dd>
        </div>)}
        {report.facts?.map(({ label, value }) => <div className="contents" key={label}>
          <dt className="text-sm text-slate-400">{label}</dt>
          <dd className="min-w-0 break-all text-sm">{value}</dd>
        </div>)}
        <dt className="text-sm text-slate-400">Evidence source</dt>
        <dd className="min-w-0 break-words text-sm"><EvidenceLink source={report.source} />{report.source.retrievedAt && <> · captured {report.source.retrievedAt}</>}</dd>
      </dl>
    </section>
  );
}

function TransactionExampleCard({ record }: { record: { data: TransactionExample; freshness: { checkedAt: string }; sources: SourceMeta[] } }) {
  const { data, freshness, sources } = record;
  const titleId = `transaction-example-${data.id}`;
  return (
    <article aria-labelledby={titleId} className="min-w-0 rounded-lg border border-border bg-surface-elevated p-5 [overflow-wrap:anywhere]">
      <h3 className="text-xl font-semibold" id={titleId}>{data.title}</h3>
      <p className="mt-2">{data.summary}</p>
      <p className="mt-2 text-sm text-slate-400">Example evidence reviewed <time dateTime={freshness.checkedAt}>{freshness.checkedAt}</time>.</p>

      <section aria-labelledby={`${titleId}-memo`} className="mt-5">
        <h4 className="font-semibold" id={`${titleId}-memo`}>Original memo evidence</h4>
        <p className="mt-1 text-sm text-slate-400">{data.memo.sourceLabel}</p>
        <pre className="mt-2 max-w-full whitespace-pre-wrap break-all rounded-md border border-border bg-surface p-3 text-sm"><code>{data.memo.value}</code></pre>
        <p className="mt-2">{data.memo.interpretation}</p>
        {data.memo.parameters && <dl className="mt-3 grid min-w-0 grid-cols-[minmax(0,1fr)] gap-2 sm:grid-cols-[10rem_minmax(0,1fr)]">
          {data.memo.parameters.map(({ label, value }) => <div className="contents" key={label}>
            <dt className="text-sm text-slate-400">{label}</dt>
            <dd className="min-w-0 break-all text-sm"><code>{value}</code></dd>
          </div>)}
        </dl>}
      </section>

      <section aria-labelledby={`${titleId}-reports`} className="mt-5">
        <h4 className="font-semibold" id={`${titleId}-reports`}>What each source reports</h4>
        <p className="mt-1 text-sm text-slate-400">Source-chain blocks and THORChain indexer heights belong to separate layers.</p>
        <div className="mt-3 space-y-3">
          {data.reports.map((report, index) => <EvidenceReport key={`${data.id}-${index}`} exampleId={data.id} index={index} report={report} />)}
        </div>
      </section>

      <section aria-labelledby={`${titleId}-unknowns`} className="mt-5">
        <h4 className="font-semibold" id={`${titleId}-unknowns`}>What remains unknown</h4>
        <ul className="mt-2 list-disc space-y-1 pl-6">
          {data.unknowns.map((unknown) => <li key={unknown}>{unknown}</li>)}
        </ul>
      </section>

      <details className="mt-5 rounded-md border border-border p-3">
        <summary className="cursor-pointer font-medium">Sources, capture dates, and response hashes</summary>
        <ul className="mt-3 list-disc space-y-3 pl-6">
          {sources.map((source) => <li key={`${source.label}-${source.url}`}>
            <EvidenceLink source={source} />
            {source.retrievedAt && <span className="text-sm text-slate-400"> · captured {source.retrievedAt}</span>}
            {source.notes && <p className="mt-1 break-all text-sm text-slate-400">{source.notes}</p>}
          </li>)}
        </ul>
      </details>
    </article>
  );
}

export function TransactionExamples({ guide }: TransactionExamplesProps) {
  const records = TRANSACTION_EXAMPLE_RECORDS.filter(({ data }) => data.guide === guide);
  if (records.length === 0) {
    return null;
  }

  return (
    <section aria-label="Dated real transaction examples" className="my-6 space-y-4">
      {records.map((record) => <TransactionExampleCard key={record.data.id} record={record} />)}
    </section>
  );
}
