import type { DataConfidence } from '@/lib/types';

export const ECOSYSTEM_DIRECTORY_POSTURES = ['listed', 'needs-review', 'historical'] as const;

export type EcosystemDirectoryPosture = (typeof ECOSYSTEM_DIRECTORY_POSTURES)[number];

export function ecosystemDirectoryPosture(confidence: DataConfidence): EcosystemDirectoryPosture {
  if (confidence === 'needs-review') {
    return 'needs-review';
  }
  if (confidence === 'historical') {
    return 'historical';
  }

  return 'listed';
}

export function ecosystemDirectoryPostureLabel(posture: EcosystemDirectoryPosture) {
  switch (posture) {
    case 'listed':
      return 'Catalog listed';
    case 'needs-review':
      return 'Needs source review';
    case 'historical':
      return 'Historical reference';
  }
}
