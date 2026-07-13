import MidgardThornodeDataContent from '../../../../content/deep-dives/midgard-thornode-data.mdx';
import { DeepDiveShell } from '@/components/features/DeepDiveShell';
import { getContentEntry } from '@/lib/content/registry';
import { createRouteMetadata } from '@/lib/metadata';

const entry = getContentEntry('deep-dive-midgard-thornode-data');

export const metadata = createRouteMetadata({
  title: `${entry.title} | THORChain Wiki`,
  description: entry.description,
  path: entry.href,
});

export default function MidgardThornodeDataDeepDive() {
  return (
    <DeepDiveShell entryId="deep-dive-midgard-thornode-data" editPath="content/deep-dives/midgard-thornode-data.mdx">
      <MidgardThornodeDataContent />
    </DeepDiveShell>
  );
}
