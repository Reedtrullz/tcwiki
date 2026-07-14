import type { NetworkStatusSourceWarning } from '../../src/lib/types';

export function normalizeReadinessWarningMessage(value: unknown): string;

export function isNonBlockingReadinessWarning(detail: NetworkStatusSourceWarning | undefined): boolean;

export function partitionReadinessWarnings(
  warnings: string[],
  details: NetworkStatusSourceWarning[]
): {
  blocking: string[];
  nonBlocking: string[];
};
