import Link from 'next/link';
import { PageContainer } from '@/components/layout/PageContainer';

const deepDives = [
  {
    slug: 'clp',
    title: 'Continuous Liquidity Pools (CLP)',
    description: 'How THORChain\'s slip-based AMM enables native cross-chain swaps without order books or wrapped assets.',
    date: '2025',
  },
  {
    slug: 'incentive-pendulum',
    title: 'The Incentive Pendulum',
    description: 'THORChain\'s self-correcting mechanism that automatically balances network security and liquidity.',
    date: '2025',
  },
  {
    slug: 'tss',
    title: 'Threshold Signatures (TSS)',
    description: 'The cryptographic foundation that allows secure custody without ever exposing a full private key.',
    date: '2025',
  },
  {
    slug: 'churning',
    title: 'Churning and Node Lifecycle',
    description: 'How regular validator rotation and economic incentives keep the network secure and decentralized.',
    date: '2025',
  },
  {
    slug: 'slashing',
    title: 'Slashing and Economic Security',
    description: 'The economic defense mechanism that makes attacking the network extremely expensive.',
    date: '2025',
  },
];

export default function DeepDivesIndex() {
  return (
    <PageContainer>
      <h1 className="text-3xl font-bold tracking-tight mb-2">Deep Dives</h1>
      <p className="text-slate-400 max-w-3xl mb-12">
        In-depth explanations of core THORChain concepts and mechanisms.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {deepDives.map((dive) => (
          <Link
            key={dive.slug}
            href={`/deep-dives/${dive.slug}`}
            className="block p-6 rounded-lg bg-surface-elevated border border-border hover:border-accent/30 transition-colors group"
          >
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-lg font-semibold group-hover:text-accent transition-colors">{dive.title}</h3>
              <span className="text-[11px] text-slate-500">{dive.date}</span>
            </div>
            <p className="text-sm text-slate-400 leading-relaxed">{dive.description}</p>
            <div className="mt-4 text-xs text-accent group-hover:underline">Read deep dive →</div>
          </Link>
        ))}
      </div>

      <div className="mt-12 text-sm text-slate-500">
        More deep dives coming soon. Interested in contributing? See the <Link href="https://github.com/reedtrullz/thorchain-wiki" className="underline hover:text-accent">GitHub repo</Link>.
      </div>
    </PageContainer>
  );
}
