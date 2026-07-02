import RuneSettlementContent from '../../../../content/deep-dives/rune-settlement.mdx';
import { DeepDiveShell } from '@/components/features/DeepDiveShell';
import { getContentEntry } from '@/lib/content/registry';
import { createRouteMetadata } from '@/lib/metadata';

const entry = getContentEntry('deep-dive-rune-settlement');

export const metadata = createRouteMetadata({
  title: `${entry.title} | THORChain Wiki`,
  description: entry.description,
  path: entry.href,
});

export default function RuneSettlementDeepDive() {
  return (
    <DeepDiveShell entryId="deep-dive-rune-settlement" editPath="content/deep-dives/rune-settlement.mdx">
      <RuneSettlementContent />
    </DeepDiveShell>
  );
}
