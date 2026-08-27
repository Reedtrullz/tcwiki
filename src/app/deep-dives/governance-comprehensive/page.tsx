import GovernanceComprehensiveContent from '../../../../content/deep-dives/governance-comprehensive.mdx';
import { DeepDiveShell } from '@/components/features/DeepDiveShell';
import { getContentEntry } from '@/lib/content/registry';
import { createRouteMetadata } from '@/lib/metadata';

const entry = getContentEntry('deep-dive-governance-comprehensive');

export const metadata = createRouteMetadata({
  title: `${entry.title} | THORChain Wiki`,
  description: entry.description,
  path: entry.href,
});

export default function GovernanceComprehensiveDeepDive() {
  return (
    <DeepDiveShell entryId="deep-dive-governance-comprehensive" editPath="content/deep-dives/governance-comprehensive.mdx">
      <GovernanceComprehensiveContent />
    </DeepDiveShell>
  );
}
