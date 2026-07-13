import TCYRecoveryTimelineContent from '../../../../content/deep-dives/tcy-recovery-timeline.mdx';
import { DeepDiveShell } from '@/components/features/DeepDiveShell';
import { getContentEntry } from '@/lib/content/registry';
import { createRouteMetadata } from '@/lib/metadata';

const entry = getContentEntry('deep-dive-tcy-recovery-timeline');

export const metadata = createRouteMetadata({
  title: `${entry.title} | THORChain Wiki`,
  description: entry.description,
  path: entry.href,
});

export default function TCYRecoveryTimelineDeepDive() {
  return (
    <DeepDiveShell entryId="deep-dive-tcy-recovery-timeline" editPath="content/deep-dives/tcy-recovery-timeline.mdx">
      <TCYRecoveryTimelineContent />
    </DeepDiveShell>
  );
}
