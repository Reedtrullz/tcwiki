import SlashingContent from '../../../../content/deep-dives/slashing.mdx';
import { DeepDiveShell } from '@/components/features/DeepDiveShell';
import { getContentEntry } from '@/lib/content/registry';
import { createRouteMetadata } from '@/lib/metadata';

const entry = getContentEntry('deep-dive-slashing');

export const metadata = createRouteMetadata({
  title: `${entry.title} | THORChain Wiki`,
  description: entry.description,
  path: entry.href,
});

export default function SlashingDeepDive() {
  return (
    <DeepDiveShell entryId="deep-dive-slashing" editPath="content/deep-dives/slashing.mdx">
      <SlashingContent />
    </DeepDiveShell>
  );
}
