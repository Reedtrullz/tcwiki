import ClpContent from '../../../../content/deep-dives/clp.mdx';
import Link from 'next/link';
import { PageContainer } from '@/components/layout/PageContainer';

export default function CLPDeepDive() {
  return (
    <PageContainer maxWidth="narrow">
      <div className="mb-6">
        <Link href="/deep-dives" className="text-sm text-slate-400 hover:text-accent transition-colors">← All Deep Dives</Link>
      </div>

      <article className="prose prose-invert prose-slate max-w-none prose-headings:tracking-tight prose-h2:text-xl prose-h2:mt-10 prose-p:text-slate-300 prose-li:text-slate-300">
        <div className="mb-4">
          <span className="text-[11px] px-2 py-0.5 rounded bg-accent/10 text-accent">Deep Dive</span>
        </div>
        <h1 className="text-3xl font-bold tracking-tight mb-2">Continuous Liquidity Pools (CLP)</h1>
        <p className="text-slate-400 text-lg">How THORChain enables native cross-chain swaps without wrapped assets or order books.</p>
        <div className="not-prose mt-8">
          <ClpContent />
        </div>
      </article>
    </PageContainer>
  );
}
