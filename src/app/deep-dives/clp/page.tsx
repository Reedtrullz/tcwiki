import ClpContent from '../../../../content/deep-dives/clp.mdx';
import { DeepDiveShell } from '@/components/features/DeepDiveShell';
import { getContentEntry } from '@/lib/content/registry';
import { createRouteMetadata } from '@/lib/metadata';

const entry = getContentEntry('deep-dive-clp');

export const metadata = createRouteMetadata({
  title: `${entry.title} | THORChain Wiki`,
  description: entry.description,
  path: entry.href,
});

export default function CLPDeepDive() {
  return (
    <DeepDiveShell entryId="deep-dive-clp" editPath="content/deep-dives/clp.mdx">
      <ClpContent />
    </DeepDiveShell>
  );
}
