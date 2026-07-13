import LiquidityActionsContent from '../../../../content/deep-dives/liquidity-actions.mdx';
import { DeepDiveShell } from '@/components/features/DeepDiveShell';
import { getContentEntry } from '@/lib/content/registry';
import { createRouteMetadata } from '@/lib/metadata';

const entry = getContentEntry('deep-dive-liquidity-actions');

export const metadata = createRouteMetadata({
  title: `${entry.title} | THORChain Wiki`,
  description: entry.description,
  path: entry.href,
});

export default function LiquidityActionsDeepDive() {
  return (
    <DeepDiveShell entryId="deep-dive-liquidity-actions" editPath="content/deep-dives/liquidity-actions.mdx">
      <LiquidityActionsContent />
    </DeepDiveShell>
  );
}
