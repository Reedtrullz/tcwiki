import RunePoolPolContent from '../../../../content/deep-dives/runepool-pol.mdx';
import { DeepDiveShell } from '@/components/features/DeepDiveShell';
import { getContentEntry } from '@/lib/content/registry';
import { createRouteMetadata } from '@/lib/metadata';

const entry = getContentEntry('deep-dive-runepool-pol');

export const metadata = createRouteMetadata({
  title: `${entry.title} | THORChain Wiki`,
  description: entry.description,
  path: entry.href,
});

export default function RunePoolPolDeepDive() {
  return (
    <DeepDiveShell entryId="deep-dive-runepool-pol" editPath="content/deep-dives/runepool-pol.mdx">
      <RunePoolPolContent />
    </DeepDiveShell>
  );
}
