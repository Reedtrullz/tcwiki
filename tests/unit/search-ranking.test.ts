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
    expect(rankedIds('TCY recovery')[0]).toBe('task:tcy-recovery');
    expect(rankedIds('is trading halted')[0]).toBe('task:swap-availability');
    expect(rankedIds('why did my swap refund')[0]).toBe('task:swap-refund-lifecycle');
    expect(rankedIds('quote failed')[0]).toBe('task:swap-refund-lifecycle');
    expect(rankedIds('streaming swaps')[0]).toBe('task:swap-refund-lifecycle');
    expect(rankedIds('can i add liquidity')[0]).toBe('task:liquidity-actions');
    expect(rankedIds('LP deposit')[0]).toBe('task:liquidity-actions');
    expect(rankedIds('Midgard API')[0]).toBe('task:build-query');
    expect(rankedIds('which source should i trust')[0]).toBe('task:source-choice');
    expect(rankedIds('SECURE+')[0]).toBe('task:app-layer-and-secured-assets');
  });

  it('promotes live diagnostics for literal Mimir pause keys', () => {
    expect(rankedIds('StreamingSwapPause')[0]).toBe('task:why-paused');
    expect(rankedIds('streaming swap pause')[0]).toBe('task:why-paused');
    expect(rankedIds('HaltMemoless')[0]).toBe('task:why-paused');
    expect(rankedIds('RUNEPoolHaltDeposit')[0]).toBe('task:why-paused');
  });

  it('routes post-exploit TSS cryptography terms to source-backed security context', () => {
    for (const query of ['DKLS', 'Schnorr', 'GG20 DKLS', 'key-sign failures', 'Paillier']) {
      expect(rankedIds(query)[0], query).toBe('task:tss-security-claims');
    }

    const dklsResults = rankedIds('DKLS');
    expect(dklsResults.indexOf('deep-dive-tss')).toBeGreaterThan(-1);
    expect(dklsResults.indexOf('network')).toBe(-1);

    const paillierResults = rankedIds('Paillier');
    expect(paillierResults.indexOf('deep-dive-tss')).toBeLessThan(paillierResults.indexOf('incident:gg20-vault-exploit-2026'));
    expect(paillierResults).not.toContain('governance');
  });

  it('routes supported-chain queries to exact chain anchors', () => {
    expect(rankedIds('SOL supported chain')[0]).toBe('chain:sol');
    expect(rankedIds('XRP Ledger')[0]).toBe('chain:xrp');
    expect(rankedIds('BTC supported chain')[0]).toBe('chain:btc');
    expect(rankedIds('BTC.BTC')[0]).toBe('chain:btc');
  });

  it('routes glossary concept queries to source-aware definitions', () => {
    expect(rankedIds('what is a synth')[0]).toBe('glossary:synthetic-asset');
    expect(rankedIds('impermanent loss')[0]).toBe('glossary:impermanent-loss');
    expect(rankedIds('what is DKLS')[0]).toBe('glossary:dkls');
    expect(rankedIds('what is Paillier')[0]).toBe('glossary:paillier');
    expect(rankedIds('multi-prime modulus')[0]).toBe('glossary:multi-prime-modulus');
    expect(rankedIds('compromised vault')[0]).toBe('glossary:compromised-vault');
  });
});
