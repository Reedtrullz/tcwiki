import MimirHaltControlsContent from '../../../../content/deep-dives/mimir-halt-controls.mdx';
import { DeepDiveShell } from '@/components/features/DeepDiveShell';
import { getContentEntry } from '@/lib/content/registry';
import { createRouteMetadata } from '@/lib/metadata';

const entry = getContentEntry('deep-dive-mimir-halt-controls');

export const metadata = createRouteMetadata({
  title: `${entry.title} | THORChain Wiki`,
  description: entry.description,
  path: entry.href,
});

export default function MimirHaltControlsDeepDive() {
  return (
    <DeepDiveShell entryId="deep-dive-mimir-halt-controls" editPath="content/deep-dives/mimir-halt-controls.mdx">
      <MimirHaltControlsContent />
    </DeepDiveShell>
  );
}
