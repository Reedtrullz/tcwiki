import ChurningContent from '../../../../content/deep-dives/churning.mdx';
import { DeepDiveShell } from '@/components/features/DeepDiveShell';
import { getContentEntry } from '@/lib/content/registry';
import { createRouteMetadata } from '@/lib/metadata';

const entry = getContentEntry('deep-dive-churning');

export const metadata = createRouteMetadata({
  title: `${entry.title} | THORChain Wiki`,
  description: entry.description,
  path: entry.href,
});

export default function ChurningDeepDive() {
  return (
    <DeepDiveShell entryId="deep-dive-churning" editPath="content/deep-dives/churning.mdx">
      <ChurningContent />
    </DeepDiveShell>
  );
}
