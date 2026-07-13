import lunr from 'lunr';
import { describe, expect, it } from 'vitest';
import { SEARCH_DOCUMENTS } from '@/lib/search/registry';
import { runSafeLunrSearch } from '@/lib/search/lunr-query';
import { rankSearchResults } from '@/lib/search/ranking';

const searchIndex = lunr(function () {
  this.ref('id');
  this.field('title');
  this.field('content');
  SEARCH_DOCUMENTS.forEach((doc) => this.add(doc));
});

const searchDocumentsById = new Map(SEARCH_DOCUMENTS.map((doc) => [doc.id, doc]));

function rankedIds(query: string) {
  const mapped = runSafeLunrSearch(searchIndex, query).flatMap((result) => {
    const doc = searchDocumentsById.get(result.ref);
    return doc ? [{ ...doc, score: result.score }] : [];
  });

  return rankSearchResults(query, mapped).map((result) => result.id);
}

describe('task-aware search ranking', () => {
  it('promotes task journeys for reader-job queries', () => {
    expect(rankedIds('how does thorchain work')[0]).toBe('task:learn-thorchain');
    expect(rankedIds('getting started')[0]).toBe('task:learn-thorchain');
    expect(rankedIds('dynamic L1 fee')[0]).toBe('task:fees-and-adr026');
    expect(rankedIds('Mimir halt')[0]).toBe('task:why-paused');
    expect(rankedIds('wallet safety')[0]).toBe('task:choose-interface');
    expect(rankedIds('is ShapeShift safe')[0]).toBe('task:choose-interface');
    expect(rankedIds('app endorsement')[0]).toBe('task:choose-interface');
    expect(rankedIds('TCY recovery')[0]).toBe('task:tcy-recovery');
    expect(rankedIds('current TCY controls')[0]).toBe('task:tcy-current-controls');
    expect(rankedIds('current TCY claim')[0]).toBe('task:tcy-current-controls');
    expect(rankedIds('TCY claim now')[0]).toBe('task:tcy-current-controls');
    expect(rankedIds('can I claim TCY')[0]).toBe('task:tcy-current-controls');
    expect(rankedIds('TCY distribution now')[0]).toBe('task:tcy-current-controls');
    expect(rankedIds('current TCY distribution')[0]).toBe('task:tcy-current-controls');
    expect(rankedIds('TCY trading halted')[0]).toBe('task:tcy-current-controls');
    expect(rankedIds('HALTTCYTRADING')[0]).toBe('task:tcy-current-controls');
    expect(rankedIds('can I borrow')[0]).toBe('task:tcy-recovery');
    expect(rankedIds('is Savers available')[0]).toBe('task:tcy-recovery');
    expect(rankedIds('TCY recovery history')[0]).toBe('task:tcy-recovery');
    expect(rankedIds('what is TCY')[0]).toBe('glossary:tcy');
    expect(rankedIds('RUNE fair value')[0]).toBe('task:rune-tokenomics');
    expect(rankedIds('RUNE tokenomics')[0]).toBe('task:rune-tokenomics');
    expect(rankedIds('RUNE investment claim')[0]).toBe('task:rune-tokenomics');
    expect(rankedIds('how to buy RUNE')[0]).toBe('task:rune-actions');
    expect(rankedIds('where to swap RUNE')[0]).toBe('task:rune-actions');
    expect(rankedIds('rune staking')[0]).toBe('task:rune-actions');
    expect(rankedIds('stake rune')[0]).toBe('task:rune-actions');
    expect(rankedIds('can I stake RUNE')[0]).toBe('task:rune-actions');
    expect(rankedIds('is trading halted')[0]).toBe('task:swap-availability');
    expect(rankedIds('is swapping enabled')[0]).toBe('task:swap-availability');
    expect(rankedIds('route available')[0]).toBe('task:swap-availability');
    expect(rankedIds('is route available')[0]).toBe('task:swap-availability');
    expect(rankedIds('can this route quote')[0]).toBe('task:swap-availability');
    expect(rankedIds('current quote')[0]).toBe('task:swap-availability');
    expect(rankedIds('fresh quote')[0]).toBe('task:swap-availability');
    expect(rankedIds('latest quote')[0]).toBe('task:swap-availability');
    expect(rankedIds('BTC ETH route')[0]).toBe('task:swap-availability');
    expect(rankedIds('eth to btc swap')[0]).toBe('task:swap-availability');
    expect(rankedIds('current inbound address')[0]).toBe('task:build-query');
    expect(rankedIds('stale inbound address')[0]).toBe('task:swap-refund-lifecycle');
    expect(rankedIds('is THORChain down')[0]).toBe('task:why-paused');
    expect(rankedIds('network down')[0]).toBe('task:why-paused');
    expect(rankedIds('why did my swap refund')[0]).toBe('task:swap-refund-lifecycle');
    expect(rankedIds('quote failed')[0]).toBe('task:swap-refund-lifecycle');
    expect(rankedIds('track transaction')[0]).toBe('task:swap-refund-lifecycle');
    expect(rankedIds('pending outbound')[0]).toBe('task:swap-refund-lifecycle');
    expect(rankedIds('missing outbound')[0]).toBe('task:swap-refund-lifecycle');
    expect(rankedIds('outbound delay')[0]).toBe('task:swap-refund-lifecycle');
    expect(rankedIds('outbound observed but not sent')[0]).toBe('task:swap-refund-lifecycle');
    expect(rankedIds('outbound sent but not received')[0]).toBe('task:swap-refund-lifecycle');
    expect(rankedIds('transaction stuck')[0]).toBe('task:swap-refund-lifecycle');
    expect(rankedIds('where is my swap')[0]).toBe('task:swap-refund-lifecycle');
    expect(rankedIds('streaming swaps')[0]).toBe('task:swap-refund-lifecycle');
    expect(rankedIds('minimum receive')[0]).toBe('task:swap-refund-lifecycle');
    expect(rankedIds('min amount')[0]).toBe('task:swap-refund-lifecycle');
    expect(rankedIds('memo too long')[0]).toBe('task:swap-refund-lifecycle');
    expect(rankedIds('wrong refund address')[0]).toBe('task:swap-refund-lifecycle');
    expect(rankedIds('liquidity tolerance')[0]).toBe('task:swap-refund-lifecycle');
    expect(rankedIds('why are fees high')[0]).toBe('task:ordinary-fee-mechanics');
    expect(rankedIds('fee too high')[0]).toBe('task:ordinary-fee-mechanics');
    expect(rankedIds('how to lower fees')[0]).toBe('task:ordinary-fee-mechanics');
    expect(rankedIds('affiliate fee')[0]).toBe('task:ordinary-fee-mechanics');
    expect(rankedIds('affiliate bps')[0]).toBe('task:ordinary-fee-mechanics');
    expect(rankedIds('liquidity fee')[0]).toBe('task:ordinary-fee-mechanics');
    expect(rankedIds('slip fee')[0]).toBe('task:ordinary-fee-mechanics');
    expect(rankedIds('outbound gas fee')[0]).toBe('task:ordinary-fee-mechanics');
    expect(rankedIds('can i add liquidity')[0]).toBe('task:liquidity-actions');
    expect(rankedIds('is pool open')[0]).toBe('task:liquidity-actions');
    expect(rankedIds('pool deposits halted')[0]).toBe('task:liquidity-actions');
    expect(rankedIds('LP withdraw paused')[0]).toBe('task:liquidity-actions');
    expect(rankedIds('IL protection available')[0]).toBe('task:liquidity-actions');
    expect(rankedIds('LP APY safe')[0]).toBe('task:liquidity-actions');
    expect(rankedIds('LP deposit')[0]).toBe('task:liquidity-actions');
    expect(rankedIds('RUNEPool PnL')[0]).toBe('task:runepool-pol');
    expect(rankedIds('RUNEPool live')[0]).toBe('task:runepool-pol');
    expect(rankedIds('RUNEPool deposit')[0]).toBe('task:runepool-pol');
    expect(rankedIds('POL evidence')[0]).toBe('task:runepool-pol');
    expect(rankedIds('Midgard API')[0]).toBe('task:build-query');
    expect(rankedIds('quote cache')[0]).toBe('task:build-query');
    expect(rankedIds('quote warning')[0]).toBe('task:build-query');
    expect(rankedIds('quote rate limit')[0]).toBe('task:build-query');
    expect(rankedIds('429 quote')[0]).toBe('task:build-query');
    expect(rankedIds('THORName')[0]).toBe('glossary:thorname');
    expect(rankedIds('what is thorname')[0]).toBe('glossary:thorname');
    expect(rankedIds('thorname lookup')[0]).toBe('glossary:thorname');
    expect(rankedIds('thorname guide')[0]).toBe('glossary:thorname');
    expect(rankedIds('thorname affiliate')[0]).toBe('glossary:thorname');
    expect(rankedIds('Midgard vs THORNode')[0]).toBe('deep-dive-midgard-thornode-data');
    expect(rankedIds('THORNode vs Midgard')[0]).toBe('deep-dive-midgard-thornode-data');
    expect(rankedIds('submit proposal')[0]).toBe('task:governance-proposals');
    expect(rankedIds('vote proposal')[0]).toBe('task:governance-proposals');
    expect(rankedIds('proposal voting')[0]).toBe('task:governance-proposals');
    expect(rankedIds('governance proposal')[0]).toBe('task:governance-proposals');
    expect(rankedIds('governance vote')[0]).toBe('task:governance-proposals');
    expect(rankedIds('how to vote on proposal')[0]).toBe('task:governance-proposals');
    expect(rankedIds('ADR proposal')[0]).toBe('task:governance-proposals');
    expect(rankedIds('governance claim checks')[0]).toBe('task:governance-proposals');
    expect(rankedIds('proposal 6')[0]).toBe('task:tcy-recovery');
    expect(rankedIds('node operator guide')[0]).toBe('task:node-operator-guide');
    expect(rankedIds('how to run a thorchain node')[0]).toBe('task:node-operator-guide');
    expect(rankedIds('run thorchain node')[0]).toBe('task:node-operator-guide');
    expect(rankedIds('node setup')[0]).toBe('task:node-operator-guide');
    expect(rankedIds('become a node operator')[0]).toBe('task:node-operator-guide');
    expect(rankedIds('validator node')[0]).toBe('task:node-operator-guide');
    expect(rankedIds('Symbiosis dynamic fee')[0]).toBe('task:fees-and-adr026');
    expect(rankedIds('ShapeShift dynamic fee')[0]).toBe('task:fees-and-adr026');
    expect(rankedIds('dynamic fee thorname')[0]).toBe('task:fees-and-adr026');
    expect(rankedIds('dynamic fee partner thorname')[0]).toBe('task:fees-and-adr026');
    expect(rankedIds('which source should i trust')[0]).toBe('task:source-choice');
    expect(rankedIds('SECURE+')[0]).toBe('task:app-layer-and-secured-assets');
    expect(rankedIds('secured asset redemption')[0]).toBe('task:app-layer-and-secured-assets');
    expect(rankedIds('secured asset deposit available')[0]).toBe('task:app-layer-and-secured-assets');
    expect(rankedIds('secured asset withdrawal halted')[0]).toBe('task:app-layer-and-secured-assets');
    expect(rankedIds('can I deposit secured assets')[0]).toBe('task:app-layer-and-secured-assets');
    expect(rankedIds('trade account deposit halted')[0]).toBe('task:app-layer-and-secured-assets');
    expect(rankedIds('App Layer claim checks')[0]).toBe('task:app-layer-and-secured-assets');
    expect(rankedIds('contract availability')[0]).toBe('task:app-layer-and-secured-assets');
    expect(rankedIds('contract halted')[0]).toBe('task:app-layer-and-secured-assets');
    expect(rankedIds('app layer route available')[0]).toBe('task:app-layer-and-secured-assets');
    expect(rankedIds('is app layer available now')[0]).toBe('task:app-layer-and-secured-assets');
    expect(rankedIds('HaltWasmContract')[0]).toBe('mimir:official-halt-controls');
    expect(rankedIds('TradeAccountsEnabled')[0]).toBe('mimir:official-halt-controls');
  });

  it('promotes explicit reader-path queries without displacing operational tasks', () => {
    expect(rankedIds('network security path')[0]).toBe('deep-dive-path:network-security');
    expect(rankedIds('swap economics path')[0]).toBe('deep-dive-path:swap-economics');
    expect(rankedIds('liquidity actions path')[0]).toBe('deep-dive-path:liquidity-actions');
    expect(rankedIds('historical recovery path')[0]).toBe('deep-dive-path:historical-recovery');
    expect(rankedIds('can i swap right now')[0]).toBe('task:swap-availability');
    expect(rankedIds('which source should i trust')[0]).toBe('task:source-choice');
    expect(rankedIds('why did my swap refund')[0]).toBe('task:swap-refund-lifecycle');
  });

  it('promotes exact deep-dive guide queries above broad paths', () => {
    expect(rankedIds('mimir halt controls')[0]).toBe('deep-dive-mimir-halt-controls');
    expect(rankedIds('live data guide')[0]).toBe('deep-dive-midgard-thornode-data');
    expect(rankedIds('liquidity actions guide')[0]).toBe('deep-dive-liquidity-actions');
    expect(rankedIds('RUNEPool guide')[0]).toBe('task:runepool-pol');
    expect(rankedIds('Mimir halt')[0]).toBe('task:why-paused');
    expect(rankedIds('Midgard API')[0]).toBe('task:build-query');
  });

  it('keeps the Home starting-point page findable for root-page language', () => {
    expect(rankedIds('start with the claim').slice(0, 8)).toContain('home');
    expect(rankedIds('live operations snapshot').slice(0, 8)).toContain('home');
  });

  it('promotes explicit source-map queries to exact source-map sections', () => {
    expect(rankedIds('current protocol state')[0]).toBe('source-map:current-protocol-state');
    expect(rankedIds('current protocol evidence')[0]).toBe('source-map:current-protocol-state');
    expect(rankedIds('current protocol source')[0]).toBe('source-map:current-protocol-state');
    expect(rankedIds('current-only snapshots')[0]).toBe('source-map:current-protocol-state');
    expect(rankedIds('dynamic fee source map')[0]).toBe('source-map:dynamic-fee-experiment');
    expect(rankedIds('current protocol source map')[0]).toBe('source-map:current-protocol-state');
    expect(rankedIds('live data failover')[0]).toBe('source-map:runtime-live-data-failover');
    expect(rankedIds('provider failover')[0]).toBe('source-map:runtime-live-data-failover');
    expect(rankedIds('runtime failover source section')[0]).toBe('source-map:runtime-live-data-failover');
    expect(rankedIds('provider mismatch')[0]).toBe('source-map:runtime-live-data-failover');
    expect(rankedIds('stale Midgard data')[0]).toBe('source-map:runtime-live-data-failover');
    expect(rankedIds('stale THORNode data')[0]).toBe('source-map:runtime-live-data-failover');
    expect(rankedIds('RUNEPool source map')[0]).toBe('source-map:runepool-pol-evidence');
    expect(rankedIds('dynamic L1 fee')[0]).toBe('task:fees-and-adr026');
    expect(rankedIds('which source should i trust')[0]).toBe('task:source-choice');
    expect(rankedIds('source freshness')[0]).toBe('task:source-choice');
    expect(rankedIds('stale source')[0]).toBe('task:source-choice');
    expect(rankedIds('data provenance')[0]).toBe('task:source-choice');
    expect(rankedIds('source boundary')[0]).toBe('task:source-choice');
    expect(rankedIds('source posture')[0]).toBe('task:source-choice');
    expect(rankedIds('page source posture')[0]).toBe('task:source-choice');
    expect(rankedIds('where did this number come from')[0]).toBe('task:source-choice');
    expect(rankedIds('where did this metric come from')[0]).toBe('task:source-choice');
  });

  it('routes exact ADR-number queries to the matching governance record', () => {
    for (const query of ['ADR-028', 'ADR 028', 'ADR028', 'ADR28']) {
      expect(rankedIds(query)[0], query).toBe('governance:adr-028-recovery');
    }
    for (const query of ['ADR-026', 'ADR 026', 'ADR026', 'ADR26']) {
      expect(rankedIds(query)[0], query).toBe('governance:adr-026-dynamic-l1-fees');
    }
  });

  it('promotes live diagnostics for literal Mimir pause keys', () => {
    expect(rankedIds('StreamingSwapPause')[0]).toBe('task:why-paused');
    expect(rankedIds('streaming swap pause')[0]).toBe('task:why-paused');
    expect(rankedIds('HaltMemoless')[0]).toBe('task:why-paused');
    expect(rankedIds('RUNEPoolHaltDeposit')[0]).toBe('task:why-paused');
    expect(rankedIds('PauseLP')[0]).toBe('mimir:official-halt-controls');
    expect(rankedIds('PauseLPDeposit-BTC')[0]).toBe('mimir:official-halt-controls');
    expect(rankedIds('PauseAsymWithdrawal-BTC')[0]).toBe('mimir:official-halt-controls');
  });

  it('routes chain-scoped halt searches to live diagnostics before static chain records', () => {
    expect(rankedIds('why is BSC halted')[0]).toBe('task:why-paused');
    expect(rankedIds('which chains are halted')[0]).toBe('task:why-paused');
    expect(rankedIds('how to know if THORChain is paused')[0]).toBe('task:why-paused');
    expect(rankedIds('SOL chain halted')[0]).toBe('task:swap-availability');
    expect(rankedIds('withdraw bond')[0]).toBe('task:node-operator-actions');
    expect(rankedIds('can I withdraw node bond')[0]).toBe('task:node-operator-actions');
    expect(rankedIds('node unbond')[0]).toBe('task:node-operator-actions');
    expect(rankedIds('can I unbond')[0]).toBe('task:node-operator-actions');
    expect(rankedIds('unbonding halted')[0]).toBe('task:node-operator-actions');
    expect(rankedIds('PauseBond')[0]).toBe('task:node-operator-actions');
    expect(rankedIds('PauseUnbond')[0]).toBe('task:node-operator-actions');
    expect(rankedIds('HaltRebond')[0]).toBe('task:node-operator-actions');
    expect(rankedIds('HaltOperatorRotate')[0]).toBe('task:node-operator-actions');
    expect(rankedIds('node operator rewards current')[0]).toBe('task:node-operator-actions');
    expect(rankedIds('HALTBSCTRADING')[0]).toBe('mimir:official-halt-controls');
    expect(rankedIds('HALTSOLCHAIN')[0]).toBe('mimir:official-halt-controls');
    expect(rankedIds('BTC.BTC')[0]).toBe('chain:btc');
    expect(rankedIds('RUNEPool paused')[0]).toBe('task:runepool-pol');
    expect(rankedIds('outbound fee')[0]).toBe('task:ordinary-fee-mechanics');
  });

  it('routes post-exploit TSS cryptography terms to source-backed security context', () => {
    for (const query of ['DKLS', 'Schnorr', 'GG20 DKLS', 'key-sign failures', 'Paillier']) {
      expect(rankedIds(query)[0], query).toBe('task:tss-security-claims');
    }

    const dklsResults = rankedIds('DKLS');
    expect(dklsResults.indexOf('deep-dive-tss')).toBeGreaterThan(-1);
    expect(dklsResults.indexOf('network')).toBe(-1);

    const paillierResults = rankedIds('Paillier');
    expect(paillierResults).toContain('deep-dive-tss');
    expect(paillierResults).toContain('incident:gg20-vault-exploit-2026');
    expect(paillierResults).not.toContain('governance');
  });

  it('separates protocol vault safety from wallet and live-operation intent', () => {
    for (const query of [
      'vault safety',
      'is the vault safe',
      'THORChain vault safety',
      'Asgard vault safe',
      'are vaults safe',
      'are THORChain vaults safe',
      'vault security',
      'TSS safety',
    ]) {
      expect(rankedIds(query)[0], query).toBe('task:tss-security-claims');
    }

    expect(rankedIds('wallet safety')[0]).toBe('task:choose-interface');
    expect(rankedIds('is ShapeShift safe')[0]).toBe('task:choose-interface');
    expect(rankedIds('Vultisig vault safety')[0]).toBe('task:choose-interface');
    expect(rankedIds('Asgard vault')[0]).toBe('glossary:asgard-vault');
    expect(rankedIds('compromised vault')[0]).toBe('glossary:compromised-vault');
    expect(rankedIds('vault signing halted')[0]).toBe('task:swap-availability');
    expect(rankedIds('vault exploit')[0]).toBe('incident:gg20-vault-exploit-2026');
    expect(rankedIds('GG20 attack')[0]).toBe('incident:gg20-vault-exploit-2026');
  });

  it('routes supported-chain queries to exact chain anchors', () => {
    expect(rankedIds('SOL supported chain')[0]).toBe('chain:sol');
    expect(rankedIds('XRP Ledger')[0]).toBe('chain:xrp');
    expect(rankedIds('BTC supported chain')[0]).toBe('chain:btc');
    expect(rankedIds('BTC.BTC')[0]).toBe('chain:btc');
  });

  it('routes aggregate and unknown supported-chain questions to the catalog without guessing a chain', () => {
    for (const query of [
      'supported chains',
      'which chains are supported',
      'list supported chains',
      'what chains does THORChain support',
      'chain support',
      'is TON supported',
      'is Arbitrum supported',
    ]) {
      const ids = rankedIds(query);

      expect(ids[0], query).toBe('task:supported-chain-catalog');
      expect(ids.slice(0, 3), query).not.toContain('chain:tron');
    }

    expect(rankedIds('is ShapeShift supported')[0]).toBe('task:choose-interface');
    expect(rankedIds('is BTC supported')[0]).toBe('chain:btc');
  });

  it('routes glossary concept queries to source-aware definitions', () => {
    expect(rankedIds('what is TSS')[0]).toBe('glossary:tss');
    expect(rankedIds('what is Asgard vault')[0]).toBe('glossary:asgard-vault');
    expect(rankedIds('what is Bifrost')[0]).toBe('glossary:bifrost');
    expect(rankedIds('what is RUNEPool')[0]).toBe('glossary:runepool');
    expect(rankedIds('what are liquidity units')[0]).toBe('glossary:liquidity-units');
    expect(rankedIds('RUNEPool POL')[0]).toBe('task:runepool-pol');
    expect(rankedIds('what is a synth')[0]).toBe('glossary:synthetic-asset');
    expect(rankedIds('impermanent loss')[0]).toBe('glossary:impermanent-loss');
    expect(rankedIds('what is DKLS')[0]).toBe('glossary:dkls');
    expect(rankedIds('what is Paillier')[0]).toBe('glossary:paillier');
    expect(rankedIds('multi-prime modulus')[0]).toBe('glossary:multi-prime-modulus');
    expect(rankedIds('compromised vault')[0]).toBe('glossary:compromised-vault');
    expect(rankedIds('what is quote expiry')[0]).toBe('glossary:quote-expiry');
    expect(rankedIds('what is THORName')[0]).toBe('glossary:thorname');
    expect(rankedIds('refund address')[0]).toBe('glossary:refund-address');
    expect(rankedIds('recommended_min_amount_in')[0]).toBe('glossary:recommended-min-amount-in');
  });
});
