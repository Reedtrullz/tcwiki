import { describe, expect, it } from 'vitest';
import {
  isNonBlockingReadinessWarning,
  normalizeReadinessWarningMessage,
  partitionReadinessWarnings,
} from '../../scripts/lib/readiness-warning-policy.mjs';
import type { NetworkStatusSourceWarning } from '@/lib/types';

function detail(
  message: string,
  overrides: Partial<NetworkStatusSourceWarning> = {}
): NetworkStatusSourceWarning {
  return {
    severity: 'review',
    category: 'mimir-support',
    message,
    action: 'Inspect this support key before inferring a user-facing pause.',
    ...overrides,
  };
}

describe('readiness warning policy', () => {
  it('recognizes only review-severity Mimir support warnings as non-blocking', () => {
    const message = 'Known operational-support Mimir keys present: SCHEDULEDMIGRATION.';

    expect(isNonBlockingReadinessWarning(detail(message))).toBe(true);
    expect(isNonBlockingReadinessWarning(detail(message, { severity: 'warning' }))).toBe(false);
    expect(isNonBlockingReadinessWarning(detail(message, { category: 'unknown-operation' }))).toBe(false);
  });

  it('normalizes message whitespace consistently', () => {
    expect(normalizeReadinessWarningMessage('  support warning  ')).toBe('support warning');
    expect(normalizeReadinessWarningMessage(undefined)).toBe('');

    expect(partitionReadinessWarnings(
      ['  Known operational-support Mimir keys present: SCHEDULEDMIGRATION.  '],
      [detail('Known operational-support Mimir keys present: SCHEDULEDMIGRATION.')]
    )).toEqual({
      blocking: [],
      nonBlocking: ['Known operational-support Mimir keys present: SCHEDULEDMIGRATION.'],
    });
  });

  it('blocks every warning when structured details are absent', () => {
    expect(partitionReadinessWarnings(['Unclassified warning.'], [])).toEqual({
      blocking: ['Unclassified warning.'],
      nonBlocking: [],
    });
  });

  it('treats unknown-chain review warnings as non-blocking because unrecognized chains are not routable', () => {
    const typoKeyMessage = 'Unknown chain-scoped Mimir key ignored: HALTTRRONTRADING.';

    expect(isNonBlockingReadinessWarning(detail(typoKeyMessage, { category: 'unknown-chain' }))).toBe(true);
    expect(partitionReadinessWarnings(
      [typoKeyMessage],
      [detail(typoKeyMessage, { category: 'unknown-chain' })]
    )).toEqual({
      blocking: [],
      nonBlocking: [typoKeyMessage],
    });
  });

  it('still blocks unknown-chain warnings that escape review severity', () => {
    const escalated = 'Unknown chain-scoped Mimir key ignored: HALTSOMETHINGTRADING.';

    expect(isNonBlockingReadinessWarning(detail(escalated, { category: 'unknown-chain', severity: 'warning' }))).toBe(false);
    expect(partitionReadinessWarnings(
      [escalated],
      [detail(escalated, { category: 'unknown-chain', severity: 'warning' })]
    )).toEqual({
      blocking: [escalated],
      nonBlocking: [],
    });
  });

  it('fails raw, unmatched, and conflicting warning messages closed', () => {
    const support = 'Known operational-support Mimir keys present: SCHEDULEDMIGRATION.';
    const raw = 'Unclassified warning.';
    const conflicting = 'Conflicting warning policy.';

    expect(partitionReadinessWarnings(
      [support, raw, conflicting],
      [
        detail(support),
        detail(conflicting),
        detail(conflicting, { severity: 'warning' }),
      ]
    )).toEqual({
      blocking: [raw, conflicting],
      nonBlocking: [support],
    });
  });
});
