import { LocalMemoDecoder } from '@/components/features/LocalMemoDecoder';
import { TRANSACTION_EXAMPLE_RECORDS } from '@/lib/data/static';

const decoderExampleIds = new Set([
  'btc-tron-swap',
  'pending-usdc-refund',
  'bitcoin-outbound',
  'ethereum-vault-migration',
]);

const decoderExamples = TRANSACTION_EXAMPLE_RECORDS
  .filter(({ data }) => decoderExampleIds.has(data.id))
  .map(({ data }) => ({ id: data.id, title: data.title, memo: data.memo.value }));

export function MemoDecoderSection() {
  return (
    <section className="not-prose my-4 scroll-mt-24" aria-labelledby="local-memo-decoder">
      <p className="mb-4 max-w-3xl text-sm leading-relaxed text-slate-300">
        Inspect a memo locally with a small syntax subset derived from the reviewed THORNode v3.20.3 parser and the official memo guide. This is educational interpretation, not protocol validation or transaction guidance.
      </p>
      <p className="mb-4 max-w-3xl text-sm leading-relaxed text-slate-300">
        Affiliate fee tokens remain raw. The official guide and pinned parser sources state different basis-point ceilings, while the affiliate count is configured; this decoder does not reconcile those rules or evaluate dynamic fees.
      </p>
      <LocalMemoDecoder examples={decoderExamples} />
    </section>
  );
}
