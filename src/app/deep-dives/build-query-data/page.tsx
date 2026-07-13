import BuildQueryDataContent from '../../../../content/deep-dives/build-query-data.mdx';
import { DeepDiveShell } from '@/components/features/DeepDiveShell';
import { getContentEntry } from '@/lib/content/registry';
import { createRouteMetadata } from '@/lib/metadata';

const entry = getContentEntry('deep-dive-build-query-data');

export const metadata = createRouteMetadata({
  title: `${entry.title} | THORChain Wiki`,
  description: entry.description,
  path: entry.href,
});

export default function BuildQueryDataDeepDive() {
  return (
    <DeepDiveShell entryId="deep-dive-build-query-data" editPath="content/deep-dives/build-query-data.mdx">
      <BuildQueryDataContent />
    </DeepDiveShell>
  );
}
