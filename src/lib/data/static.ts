import type {
  Chain,
export const WIKI_CHANGE_RECORDS: SourcedRecord<WikiChangeRecord>[] = [
  record({
    id: 'ilp-history-boundary-2026-10-02',
    title: 'Clarified that impermanent loss protection is historical',
    summary: 'The liquidity guide now distinguishes impermanent loss from protection against it. Official documentation and the amended ADR describe ILP as removed; this review does not imply current coverage.',
    href: '/deep-dives/clp',
    sourceDate: '2026-10-02',
    reviewedAt: '2026-10-02',
  }, [{ ...continuousLiquidityPoolsSource, retrievedAt: '2026-10-02' }, { label: 'ADR-005 amendment', url: 'https://dev.thorchain.org/architecture/adr-005-deprecate-ilp.html#amendment-1-nov-23-permanently-sunset-ilp', retrievedAt: '2026-10-02' }], 'curated', {
    checkedAt: '2026-10-02',
    nextReviewDue: '2026-11-02',
  }),
  record({
    id: 'memoless-claim-evidence-2026-10-03',
    title: 'Separated memoless release evidence from incident history',
    summary: 'The v3.20.0 release supports the listed memoless ERC20 handler, refund-simulation and inbound-observation work. It does not establish the historical halt sequence or present availability; those remain separate evidence questions.',
    href: '/governance#incident-memoless-spam-2026-08',
    sourceDate: '2026-10-03',
    reviewedAt: '2026-10-03',
  }, [{ ...protocolUpgradeV320Source, retrievedAt: '2026-10-03' }], 'curated', {
    checkedAt: '2026-10-03',
    nextReviewDue: '2026-11-03',
  }),
];
