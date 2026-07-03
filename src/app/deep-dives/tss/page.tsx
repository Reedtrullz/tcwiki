import TssContent from '../../../../content/deep-dives/tss.mdx';
import { DeepDiveShell } from '@/components/features/DeepDiveShell';
import { getContentEntry } from '@/lib/content/registry';
import { createRouteMetadata } from '@/lib/metadata';

const entry = getContentEntry('deep-dive-tss');

export const metadata = createRouteMetadata({
  title: `${entry.title} | THORChain Wiki`,
  description: entry.description,
  path: entry.href,
});

export default function TSSDeepDive() {
  return (
    <DeepDiveShell entryId="deep-dive-tss" editPath="content/deep-dives/tss.mdx">
      <TssContent />
    </DeepDiveShell>
  );
}
