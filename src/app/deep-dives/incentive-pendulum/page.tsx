import IncentivePendulumContent from '../../../../content/deep-dives/incentive-pendulum.mdx';
import { DeepDiveShell } from '@/components/features/DeepDiveShell';
import { getContentEntry } from '@/lib/content/registry';
import { createRouteMetadata } from '@/lib/metadata';

const entry = getContentEntry('deep-dive-incentive-pendulum');

export const metadata = createRouteMetadata({
  title: `${entry.title} | THORChain Wiki`,
  description: entry.description,
  path: entry.href,
});

export default function IncentivePendulumDeepDive() {
  return (
    <DeepDiveShell entryId="deep-dive-incentive-pendulum" editPath="content/deep-dives/incentive-pendulum.mdx">
      <IncentivePendulumContent />
    </DeepDiveShell>
  );
}
