import SaversContent from '../../../../content/deep-dives/savers.mdx';
import { DeepDiveShell } from '@/components/features/DeepDiveShell';
import { getContentEntry } from '@/lib/content/registry';
import { createRouteMetadata } from '@/lib/metadata';

const entry = getContentEntry('deep-dive-savers');

export const metadata = createRouteMetadata({
  title: `${entry.title} | THORChain Wiki`,
  description: entry.description,
  path: entry.href,
});

export default function SaversDeepDive() {
  return (
    <DeepDiveShell entryId="deep-dive-savers" editPath="content/deep-dives/savers.mdx">
      <SaversContent />
    </DeepDiveShell>
  );
}
