import RuneSettlementContent from '../../../../content/deep-dives/rune-settlement.mdx';
import Link from 'next/link';
import { PageContainer } from '@/components/layout/PageContainer';

export default function RuneSettlementDeepDive() {
  const repoUrl = 'https://github.com/reedtrullz/thorchain-wiki';
  const editUrl = `${repoUrl}/edit/main/content/deep-dives/rune-settlement.mdx`;

  return (
    <PageContainer maxWidth="narrow">
      <div className="mb-6 flex items-center justify-between">
        <Link href="/deep-dives" className="text-sm text-slate-400 hover:text-accent transition-colors">← All Deep Dives</Link>
        <a 
          href={editUrl} 
          target="_blank" 
          rel="noopener noreferrer"
          className="text-xs text-slate-400 hover:text-accent transition-colors"
        >
          Edit this page on GitHub →
        </a>
      </div>

      <article className="prose prose-invert prose-slate max-w-none">
        <div className="mb-4">
          <span className="text-[11px] px-2 py-0.5 rounded bg-accent/10 text-accent">Deep Dive</span>
        </div>
        <RuneSettlementContent />
      </article>
    </PageContainer>
  );
}
