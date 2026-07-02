import BifrostContent from '../../../../content/deep-dives/bifrost.mdx';
import { DeepDiveShell } from '@/components/features/DeepDiveShell';
import { getContentEntry } from '@/lib/content/registry';
import { createRouteMetadata } from '@/lib/metadata';

const entry = getContentEntry('deep-dive-bifrost');

export const metadata = createRouteMetadata({
  title: `${entry.title} | THORChain Wiki`,
  description: entry.description,
  path: entry.href,
});

export default function BifrostDeepDive() {
  return (
    <DeepDiveShell entryId="deep-dive-bifrost" editPath="content/deep-dives/bifrost.mdx">
      <BifrostContent />
    </DeepDiveShell>
  );
}
