import type { DataConfidence } from '@/lib/types';
import type { DeepDiveReaderPath } from '@/lib/content/registry';

const defaultCurrentStateBoundary = 'Current protocol constants, live Mimir state, chain availability, quote execution, or product status.';

const articleUseCases: Record<string, string> = {
  'deep-dive-mimir-halt-controls': 'A source-boundary guide for reading Mimir halt keys, scoped pauses, source warnings, and user-facing availability labels.',
  'deep-dive-midgard-thornode-data': 'A source-selection guide for deciding when to use THORNode operational evidence versus Midgard indexed dashboard metrics.',
  'deep-dive-build-query-data': 'A builder query plan for choosing THORChain endpoint families, quote flow, inbound-address checks, units, and source-warning behavior.',
  'deep-dive-clp': 'A mechanism and evidence-boundary guide for CLP pricing, slip/liquidity fees, route availability, and refund non-claims.',
  'deep-dive-liquidity-actions': 'An evidence guide for separating LP adds, withdrawals, pool-deposit pauses, asymmetric withdrawals, and LP metrics from ordinary swap availability.',
  'deep-dive-runepool-pol': 'An evidence guide for separating RUNEPool/POL accounting, operation availability, pool scope, and yield non-claims.',
  'deep-dive-streaming-swaps-refunds': 'A triage guide for swap refunds, quote limits, memo issues, live halts, and transaction evidence.',
  'deep-dive-incentive-pendulum': 'A mechanism guide for explaining THORChain incentive balancing without turning design incentives into live yield, APY, revenue, or price claims.',
  'deep-dive-tss': 'A security explainer for threshold signing, vault-key risk, GG20 incident language, and what current signing-health claims must verify separately.',
  'deep-dive-churning': 'A validator-lifecycle guide for churn timing, vault rotation, membership changes, and why scheduled rotation is not the same as current signing health.',
  'deep-dive-slashing': 'An economic-security guide for bond risk, punishment mechanics, and the evidence needed before calling current validator behavior safe or unsafe.',
  'deep-dive-bifrost': 'A chain-client and observation guide for external-chain monitoring, finality, solvency proofs, and why observations are not complete swap-settlement proof by themselves.',
  'deep-dive-rune-settlement': 'A settlement-role guide for RUNE as the pool-pairing and security asset without turning mechanism language into price, fair-value, or investment claims.',
  'deep-dive-tcy-recovery-timeline': 'A dated recovery-context guide for TCY, deprecated THORFi products, and current-state claims that need separate proof.',
  'deep-dive-app-layer': 'A source-boundary guide for app-layer contracts, secured assets, trade accounts, and live control checks.',
  'deep-dive-savers': 'A historical-product guide for archived Savers/Lending context, THORFi unwind boundaries, and why old yield mechanics are not current user instructions.',
};

const articleClaimBoundaries: Record<string, string> = {
  'deep-dive-mimir-halt-controls': 'Current THORNode/Mimir snapshot, source freshness, checked height, exact key scope, and operation-specific evidence.',
  'deep-dive-midgard-thornode-data': 'Current provider, source freshness, block height, endpoint family, warning list, and whether the claim needs THORNode or Midgard evidence.',
  'deep-dive-build-query-data': 'Fresh quote response, inbound-address state, Mimir halt posture, source provider, source warnings, expiry, units, and integration-specific validation.',
  'deep-dive-clp': 'Current quote, route availability, pool depth, LP action state, source quality, transaction evidence, and whether the claim belongs in the refund or liquidity-action evidence ladder.',
  'deep-dive-liquidity-actions': 'Current LP controls, pool-deposit scope, asymmetric-withdrawal state, pool data health, memo shape, and transaction-level evidence.',
  'deep-dive-runepool-pol': 'Current RUNEPool enablement, deposit/withdraw halts, runepool accounting fields, POL-enabled pool set, source freshness, and checked height.',
  'deep-dive-streaming-swaps-refunds': 'Current quote result, memo, inbound address, amount thresholds, transaction evidence, and live halt/signing state.',
  'deep-dive-incentive-pendulum': 'Current Midgard health, visible metric source, earnings intervals, APY calculation, reward distribution, token value, and whether the claim is a design incentive or measured outcome.',
  'deep-dive-tcy-recovery-timeline': 'Current TCY claiming, staking, trading, distribution, recovery progress, solvency, market value, or ADR-028 state.',
  'deep-dive-tss': 'Current signing state, vault safety, validator upgrade coverage, active TSS implementation, or whether GG20, DKLS, or Schnorr wording applies to the running release.',
  'deep-dive-churning': 'Current churn schedule, active validator set, vault migration state, signing availability, node status, and whether a chain is paused during rotation.',
  'deep-dive-slashing': 'Current validator evidence, bond state, slash event records, protocol version, source freshness, and whether a safety claim is economic design or observed behavior.',
  'deep-dive-bifrost': 'Current inbound-address state, observation lag, finality assumptions, chain halts, signing state, transaction evidence, and whether a chain-client claim is live or architectural.',
  'deep-dive-app-layer': 'Current Mimir app-layer controls, contract/deployer/checksum state, secured/trade-asset enablement, source warnings, and dated product scope.',
  'deep-dive-rune-settlement': 'Current RUNE price, supply framing, pooled RUNE, security constants, route liquidity, source freshness, and whether the claim belongs to live metrics or tokenomics records.',
  'deep-dive-savers': 'Current product availability, archived Savers/Lending status, TCY recovery context, THORFi unwind records, and whether old yield or lending behavior is being misread as live.',
};

function uniqueItems(items: string[], limit: number) {
  const seen = new Set<string>();
  const unique: string[] = [];

  for (const item of items) {
    if (!seen.has(item)) {
      seen.add(item);
      unique.push(item);
    }
    if (unique.length >= limit) {
      break;
    }
  }

  return unique;
}

export function getDeepDiveArticleUseCase(
  entryId: string,
  title: string,
  confidence: DataConfidence,
) {
  if (articleUseCases[entryId]) {
    return articleUseCases[entryId];
  }

  return confidence === 'historical'
    ? `Historical context for ${title}; not current product instructions.`
    : `Curated explanation of ${title} mechanics and terminology.`;
}

export function getDeepDiveArticleClaimBoundary(
  entryId: string,
  confidence: DataConfidence,
  readerPaths: DeepDiveReaderPath[],
) {
  if (articleClaimBoundaries[entryId]) {
    return articleClaimBoundaries[entryId];
  }

  const historicalBoundary = confidence === 'historical'
    ? ['Current product availability, user-action instructions, or recovery completion claims.']
    : [];
  const readerPathBoundaries = readerPaths.flatMap((path) => path.verifyBeforeClaiming);

  return uniqueItems([
    ...historicalBoundary,
    ...readerPathBoundaries,
    defaultCurrentStateBoundary,
  ], 1)[0] ?? defaultCurrentStateBoundary;
}
