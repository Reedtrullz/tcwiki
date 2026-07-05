import AppLayerContent from '../../../../content/deep-dives/app-layer.mdx';
import { DeepDiveShell } from '@/components/features/DeepDiveShell';
import { getContentEntry } from '@/lib/content/registry';
import { createRouteMetadata } from '@/lib/metadata';

const entry = getContentEntry('deep-dive-app-layer');

export const metadata = createRouteMetadata({
  title: `${entry.title} | THORChain Wiki`,
  description: entry.description,
  path: entry.href,
});

export default function AppLayerDeepDive() {
  return (
    <DeepDiveShell entryId="deep-dive-app-layer" editPath="content/deep-dives/app-layer.mdx">
      <AppLayerContent />
    </DeepDiveShell>
  );
}
