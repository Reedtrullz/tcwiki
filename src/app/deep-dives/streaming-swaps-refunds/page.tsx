import StreamingSwapsRefundsContent from '../../../../content/deep-dives/streaming-swaps-refunds.mdx';
import { DeepDiveShell } from '@/components/features/DeepDiveShell';
import { getContentEntry } from '@/lib/content/registry';
import { createRouteMetadata } from '@/lib/metadata';

const entry = getContentEntry('deep-dive-streaming-swaps-refunds');

export const metadata = createRouteMetadata({
  title: `${entry.title} | THORChain Wiki`,
  description: entry.description,
  path: entry.href,
});

export default function StreamingSwapsRefundsDeepDive() {
  return (
    <DeepDiveShell entryId="deep-dive-streaming-swaps-refunds" editPath="content/deep-dives/streaming-swaps-refunds.mdx">
      <StreamingSwapsRefundsContent />
    </DeepDiveShell>
  );
}
