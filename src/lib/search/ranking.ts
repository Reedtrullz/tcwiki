import { CONTENT_ENTRIES, DEEP_DIVE_READER_PATHS, TASK_INTENT_GUIDES } from '@/lib/content/registry';
import { CHAIN_RECORDS, ECOSYSTEM_PROJECT_RECORDS, GOVERNANCE_PROPOSAL_RECORDS, SOURCE_MAP_SECTION_RECORDS } from '@/lib/data/static';
import type { SearchDoc } from '@/lib/search/registry';

export type SearchResultWithScore = SearchDoc & { score: number };

const taskGuidesBySearchId = new Map(TASK_INTENT_GUIDES.map((guide) => [`task:${guide.id}`, guide]));
const deepDivePathsBySearchId = new Map(DEEP_DIVE_READER_PATHS.map((path) => [`deep-dive-path:${path.id}`, path]));
const sourceMapSectionsBySearchId = new Map(SOURCE_MAP_SECTION_RECORDS.map((record) => [`source-map:${record.data.id}`, record.data]));
const contentEntriesBySearchId = new Map(CONTENT_ENTRIES.map((entry) => [entry.id, entry]));
const chainAssetQueriesBySearchId = new Map(CHAIN_RECORDS.map((record) => [`chain:${record.data.chain.toLowerCase()}`, `${record.data.chain}.${record.data.chain}`.toLowerCase()]));
const governanceProposalNumbersBySearchId = new Map(GOVERNANCE_PROPOSAL_RECORDS.flatMap((record) => {
  const recordId = String(record.data.id);
  const match = /\badr-(\d+)\b/i.exec(recordId) ?? /\badr[-\s]?(\d+)\b/i.exec(record.data.title);
  const proposalNumber = match?.[1]?.replace(/^0+/, '') || null;
  return proposalNumber ? [[`governance:${recordId}`, proposalNumber]] : [];
}));
const chainIdentifiers = CHAIN_RECORDS.map((record) => ({
  code: record.data.chain.toLowerCase(),
  name: normalizeSearchText(record.data.name),
}));
const ecosystemProjectIdentifiers = ECOSYSTEM_PROJECT_RECORDS.map((record) => ({
  id: normalizeSearchText(record.data.id),
  name: normalizeSearchText(record.data.name),
}));
const TASK_QUERY_STOPWORDS = new Set([
  'a',
  'an',
  'are',
  'can',
  'did',
  'do',
  'does',
  'for',
  'how',
  'i',
  'is',
  'me',
  'my',
  'of',
  'should',
  'the',
  'to',
  'use',
  'what',
  'when',
  'where',
  'which',
  'who',
  'why',
]);
const SOURCE_MAP_QUERY_WORDS = new Set([
  'canonical',
  'docs',
  'documentation',
  'evidence',
  'map',
  'proof',
  'section',
  'sections',
  'source',
  'sources',
]);

function normalizeSearchText(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function normalizedWords(value: string) {
  return normalizeSearchText(value)
    .split(/\s+/)
    .filter((word) => word.length > 1);
}

function taskQueryBoost(query: string, doc: SearchDoc) {
  if (doc.type !== 'task') {
    return 0;
  }

  const guide = taskGuidesBySearchId.get(doc.id);
  if (!guide) {
    return 0;
  }

  const normalizedQuery = normalizeSearchText(query);
  if (!normalizedQuery) {
    return 0;
  }

  const candidateTexts = [
    guide.label,
    guide.question,
    guide.description,
    ...guide.searchTerms,
  ].map(normalizeSearchText);

  if (candidateTexts.some((text) => text === normalizedQuery)) {
    return 1000;
  }

  if (candidateTexts.some((text) => text.includes(normalizedQuery) || normalizedQuery.includes(text))) {
    return 750;
  }

  const words = normalizedWords(query).filter((word) => !TASK_QUERY_STOPWORDS.has(word));
  const combined = candidateTexts.join(' ');
  if (words.length > 1 && words.every((word) => combined.includes(word))) {
    return 500;
  }

  return 0;
}

function deepDivePathQueryBoost(query: string, doc: SearchDoc) {
  if (doc.type !== 'deep-dive-path') {
    return 0;
  }

  const path = deepDivePathsBySearchId.get(doc.id);
  if (!path) {
    return 0;
  }

  const normalizedQuery = normalizeSearchText(query);
  if (!normalizedQuery) {
    return 0;
  }

  const candidateTexts = [
    path.title,
    `${path.title} path`,
    `${path.title} learning path`,
    `${path.title} reader path`,
    path.audience,
    path.description,
    ...path.searchTerms,
  ].map(normalizeSearchText);

  const hasPathIntent = /\b(?:path|paths|reader path|learning path)\b/.test(normalizedQuery);

  if (candidateTexts.some((text) => text === normalizedQuery)) {
    return hasPathIntent ? 1200 : 650;
  }

  if (candidateTexts.some((text) => text.includes(normalizedQuery) || normalizedQuery.includes(text))) {
    return hasPathIntent ? 900 : 450;
  }

  const words = normalizedWords(query).filter((word) => !TASK_QUERY_STOPWORDS.has(word));
  const combined = candidateTexts.join(' ');
  if (words.length > 1 && words.every((word) => combined.includes(word))) {
    return hasPathIntent ? 700 : 300;
  }

  return 0;
}

function sourceMapQueryBoost(query: string, doc: SearchDoc) {
  if (doc.type !== 'source-map') {
    return 0;
  }

  const section = sourceMapSectionsBySearchId.get(doc.id);
  if (!section) {
    return 0;
  }

  const normalizedQuery = normalizeSearchText(query);
  if (!normalizedQuery) {
    return 0;
  }

  const candidateTexts = [
    section.id,
    section.title,
    section.decision,
    section.use,
    section.caveat,
    ...section.claimExamples,
    ...section.nonClaims,
    ...section.links.map((source) => `${source.label} ${source.notes ?? ''}`),
  ].map(normalizeSearchText);

  if (normalizeSearchText(section.title) === normalizedQuery) {
    return 1300;
  }

  const hasSourceMapIntent =
    /\bsource\s+(?:map|section|sections|triage|warning|warnings|label|labels)\b|\b(?:proof|evidence)\s+(?:map|source|section)\b/.test(normalizedQuery) ||
    /\b(?:current only|snapshot|snapshots|provider|providers|failover|degraded source|live data failover)\b/.test(normalizedQuery) ||
    /\b(?:current|live)\s+protocol\s+evidence\b/.test(normalizedQuery);
  if (!hasSourceMapIntent) {
    return 0;
  }

  if (candidateTexts.some((text) => text === normalizedQuery)) {
    return 1100;
  }

  if (candidateTexts.some((text) => text.includes(normalizedQuery) || normalizedQuery.includes(text))) {
    return 850;
  }

  const words = normalizedWords(query)
    .filter((word) => !TASK_QUERY_STOPWORDS.has(word))
    .filter((word) => !SOURCE_MAP_QUERY_WORDS.has(word));
  const combined = candidateTexts.join(' ');
  if (words.length > 0 && words.every((word) => combined.includes(word))) {
    return 1200;
  }

  return 0;
}

function contentEntryQueryBoost(query: string, doc: SearchDoc) {
  if (doc.type !== 'deep-dive' && doc.id !== 'home') {
    return 0;
  }

  const entry = contentEntriesBySearchId.get(doc.id);
  if (!entry) {
    return 0;
  }

  const normalizedQuery = normalizeSearchText(query);
  if (!normalizedQuery) {
    return 0;
  }

  const words = normalizedWords(query).filter((word) => !TASK_QUERY_STOPWORDS.has(word));
  const titleWords = normalizedWords(entry.title).filter((word) => !TASK_QUERY_STOPWORDS.has(word));
  const candidateTexts = [
    entry.title,
    `${entry.title} guide`,
    entry.description,
    entry.body,
    ...entry.tags,
  ].map(normalizeSearchText);
  const combined = candidateTexts.join(' ');

  if (candidateTexts.some((text) => text === normalizedQuery)) {
    return 1000;
  }

  if (words.length >= 3 && words.every((word) => titleWords.includes(word))) {
    return 950;
  }

  if (words.length >= 2 && normalizedQuery.includes('guide') && words.every((word) => combined.includes(word))) {
    return 750;
  }

  if (words.length >= 2 && words.every((word) => combined.includes(word))) {
    return doc.href === '/' ? 850 : 350;
  }

  return 0;
}

function chainAssetQueryBoost(query: string, doc: SearchDoc) {
  if (doc.type !== 'chain') {
    return 0;
  }

  const assetQuery = chainAssetQueriesBySearchId.get(doc.id);
  if (!assetQuery) {
    return 0;
  }

  return query.trim().toLowerCase() === assetQuery ? 10_000 : 0;
}

function findMatchingChainIdentifier(normalizedQuery: string) {
  const queryWords = normalizedQuery.split(/\s+/);
  return chainIdentifiers.find(({ code, name }) => (
    queryWords.includes(code) || (name && normalizedQuery.includes(name))
  ));
}

function chainHaltIntentBoost(query: string, doc: SearchDoc) {
  const normalizedQuery = normalizeSearchText(query);
  if (!normalizedQuery) {
    return 0;
  }

  const compactQuery = normalizedQuery.replace(/\s+/g, '');
  const matchedChain = findMatchingChainIdentifier(normalizedQuery) ?? chainIdentifiers.find(({ code }) => (
    [
      `halt${code}trading`,
      `halttrading${code}`,
      `halt${code}chain`,
      `haltsigning${code}`,
      `halt${code}signing`,
      `solvencyhalt${code}chain`,
    ].includes(compactQuery)
  ));
  if (!matchedChain) {
    return 0;
  }

  const exactScopedKey = [
    `halt${matchedChain.code}trading`,
    `halttrading${matchedChain.code}`,
    `halt${matchedChain.code}chain`,
    `haltsigning${matchedChain.code}`,
    `halt${matchedChain.code}signing`,
    `solvencyhalt${matchedChain.code}chain`,
  ].includes(compactQuery);
  const haltIntent = exactScopedKey || /\b(?:halt|halted|pause|paused|trading|signing|observation)\b/.test(normalizedQuery);
  if (!haltIntent) {
    return 0;
  }

  const wantsReason = /\b(?:why|reason|mimir|key|evidence)\b/.test(normalizedQuery);

  if (exactScopedKey) {
    if (doc.id === 'mimir:official-halt-controls') {
      return 8_000;
    }
    if (doc.id === 'task:why-paused') {
      return 4_000;
    }
    if (doc.id === 'task:swap-availability') {
      return 3_500;
    }
    return 0;
  }

  if (wantsReason) {
    if (doc.id === 'task:why-paused') {
      return 8_000;
    }
    if (doc.id === 'task:swap-availability') {
      return 5_000;
    }
    if (doc.id === 'mimir:official-halt-controls') {
      return 4_500;
    }
    return 0;
  }

  if (doc.id === 'task:swap-availability') {
    return 8_000;
  }
  if (doc.id === 'task:why-paused') {
    return 5_000;
  }
  if (doc.id === 'mimir:official-halt-controls') {
    return 4_500;
  }

  return 0;
}

function operationalStateIntentBoost(query: string, doc: SearchDoc) {
  const normalizedQuery = normalizeSearchText(query);
  if (!normalizedQuery) {
    return 0;
  }

  if (/\b(?:app layer|cosmwasm|wasm|contract|contracts|secured asset|secured assets|trade account|trade accounts)\b/.test(normalizedQuery)) {
    return 0;
  }

  const hasOperationalStateIntent = /\b(?:halt|halted|halts|pause|paused|pauses|limited|disabled|enabled|available|availability|status|down|offline|outage|unavailable)\b/.test(normalizedQuery);
  if (!hasOperationalStateIntent) {
    return 0;
  }

  const hasOperationalScope = /\b(?:thorchain|network|chains?|operations?|swaps?|swapping|trading|signing|route|routes)\b/.test(normalizedQuery);
  if (!hasOperationalScope) {
    return 0;
  }

  const namesOperationalControl = /\b(?:streaming swap pause|haltmemoless|runepoolhaltdeposit|runepoolhaltwithdraw|halt key|mimir key)\b/.test(normalizedQuery);
  if (namesOperationalControl) {
    if (doc.id === 'task:why-paused') {
      return 9_500;
    }
    if (doc.id === 'mimir:official-halt-controls') {
      return 8_000;
    }
    return 0;
  }

  const asksForNetworkWideOutage = /\b(?:down|offline|outage|unavailable)\b/.test(normalizedQuery) &&
    /\b(?:thorchain|network|protocol|operations?)\b/.test(normalizedQuery);
  if (asksForNetworkWideOutage) {
    if (doc.id === 'task:why-paused') {
      return 9_500;
    }
    if (doc.id === 'task:swap-availability') {
      return 6_500;
    }
    if (doc.id === 'network') {
      return 5_500;
    }
    if (doc.id === 'source-map:current-protocol-state') {
      return 4_500;
    }
    return 0;
  }

  const asksForReasonOrScope = /\b(?:why|how|which|reason|mimir|evidence|source)\b/.test(normalizedQuery);
  const asksForRouteOrSwap = /\b(?:swap|swaps|swapping|route|routes|quote|trading|enabled|available|availability)\b/.test(normalizedQuery);

  if (asksForReasonOrScope && !asksForRouteOrSwap) {
    if (doc.id === 'task:why-paused') {
      return 9_000;
    }
    if (doc.id === 'mimir:official-halt-controls') {
      return 7_000;
    }
    if (doc.id === 'task:swap-availability') {
      return 6_000;
    }
    return 0;
  }

  if (doc.id === 'task:swap-availability') {
    return 9_000;
  }
  if (doc.id === 'task:why-paused') {
    return 6_500;
  }
  if (doc.id === 'mimir:official-halt-controls') {
    return 6_000;
  }

  return 0;
}

function assetPairRouteIntentBoost(query: string, doc: SearchDoc) {
  const normalizedQuery = normalizeSearchText(query);
  if (!normalizedQuery) {
    return 0;
  }

  const hasPairRouteIntent = /\b(?:swap|swaps|route|routes|quote|quotes|exchange|from|to)\b/.test(normalizedQuery);
  if (!hasPairRouteIntent) {
    return 0;
  }

  const words = new Set(normalizedWords(query));
  const matchedCodes = new Set(
    chainIdentifiers.flatMap((chain) => words.has(chain.code) ? [chain.code] : [])
  );
  if (matchedCodes.size < 2) {
    return 0;
  }

  if (doc.id === 'task:swap-availability') {
    return 12_000;
  }
  if (doc.id === 'network') {
    return 6_000;
  }
  if (doc.id === 'task:build-query') {
    return 4_500;
  }

  return 0;
}

function tcyCurrentActionIntentBoost(query: string, doc: SearchDoc) {
  const normalizedQuery = normalizeSearchText(query);
  if (!normalizedQuery) {
    return 0;
  }

  const hasTcyScope = /\btcy\b/.test(normalizedQuery) ||
    /\b(?:tcyclaiminghalt|tcyclaimingswaphalt|tcystakinghalt|tcystakedistributionhalt|tcyunstakinghalt|halttcytrading)\b/.test(normalizedQuery);
  if (!hasTcyScope) {
    return 0;
  }

  const hasCurrentActionIntent =
    /\b(?:current|now|available|availability|halt|halted|claim|claiming|stake|staking|unstake|unstaking|distribution|distributions|receive|trade|trading|controls?)\b/.test(normalizedQuery) ||
    /\b(?:tcyclaiminghalt|tcyclaimingswaphalt|tcystakinghalt|tcystakedistributionhalt|tcyunstakinghalt|halttcytrading)\b/.test(normalizedQuery);
  if (!hasCurrentActionIntent) {
    return 0;
  }

  if (doc.id === 'task:tcy-current-controls') {
    return 12_000;
  }
  if (doc.id === 'tcy') {
    return 7_000;
  }
  if (doc.id === 'source-map:historical-features-and-recovery') {
    return 5_500;
  }
  if (doc.id === 'mimir:official-halt-controls') {
    return 5_000;
  }
  if (doc.id === 'task:tcy-recovery') {
    return 3_000;
  }

  return 0;
}

function liquidityControlKeyIntentBoost(query: string, doc: SearchDoc) {
  const compactQuery = query.trim().replace(/[^a-z0-9]+/gi, '').toLowerCase();
  if (!compactQuery) {
    return 0;
  }

  const exactLiquidityControl =
    compactQuery === 'pauselp' ||
    compactQuery.startsWith('pauselpdeposit') ||
    compactQuery.startsWith('pauseasymwithdrawal');
  if (!exactLiquidityControl) {
    return 0;
  }

  if (doc.id === 'mimir:official-halt-controls') {
    return 12_000;
  }
  if (doc.id === 'task:liquidity-actions') {
    return 8_000;
  }
  if (doc.id === 'deep-dive-mimir-halt-controls') {
    return 7_000;
  }
  if (doc.id === 'deep-dive-liquidity-actions') {
    return 6_000;
  }

  return 0;
}

function appLayerActionIntentBoost(query: string, doc: SearchDoc) {
  const normalizedQuery = normalizeSearchText(query);
  if (!normalizedQuery) {
    return 0;
  }

  const hasAppLayerScope =
    /\b(?:app layer|cosmwasm|wasm|contract|contracts|secured asset|secured assets|secure|trade account|trade accounts|rujira|ruji)\b/.test(normalizedQuery) ||
    /\b(?:haltwasmglobal|haltwasmcontract|haltwasmdeployer|haltwasmcs|haltoracle|haltsecuredglobal|haltsecureddeposit|haltsecuredwithdraw|tradeaccountsenabled|wasmpermissionless)\b/.test(normalizedQuery);
  if (!hasAppLayerScope) {
    return 0;
  }

  const hasActionIntent =
    /\b(?:available|availability|live|enabled|halt|halted|paused|deposit|deposits|withdraw|withdrawal|redemption|redeem|route|safe|safety|support|claim checks?)\b/.test(normalizedQuery) ||
    /\b(?:haltwasmglobal|haltwasmcontract|haltwasmdeployer|haltwasmcs|haltoracle|haltsecuredglobal|haltsecureddeposit|haltsecuredwithdraw|tradeaccountsenabled|wasmpermissionless)\b/.test(normalizedQuery);
  if (!hasActionIntent) {
    return 0;
  }

  const isExactControlKey = /\b(?:haltwasmglobal|haltwasmcontract|haltwasmdeployer|haltwasmcs|haltoracle|haltsecuredglobal|haltsecureddeposit|haltsecuredwithdraw|tradeaccountsenabled|wasmpermissionless)\b/.test(normalizedQuery);
  if (isExactControlKey) {
    if (doc.id === 'mimir:official-halt-controls') {
      return 12_000;
    }
    if (doc.id === 'task:app-layer-and-secured-assets') {
      return 10_000;
    }
    if (doc.id === 'deep-dive-mimir-halt-controls') {
      return 7_000;
    }
    if (doc.id === 'deep-dive-app-layer') {
      return 5_000;
    }
    return 0;
  }

  if (doc.id === 'task:app-layer-and-secured-assets') {
    return 12_000;
  }
  if (doc.id === 'deep-dive-app-layer') {
    return 7_000;
  }
  if (doc.id === 'mimir:official-halt-controls') {
    return 6_000;
  }
  if (doc.id === 'task:why-paused') {
    return 5_000;
  }
  if (doc.id === 'task:swap-availability') {
    return 4_500;
  }
  if (doc.id === 'task:choose-interface') {
    return 4_000;
  }

  return 0;
}

function liquidityActionIntentBoost(query: string, doc: SearchDoc) {
  const normalizedQuery = normalizeSearchText(query);
  if (!normalizedQuery) {
    return 0;
  }

  if (/\b(?:bond|bonding|unbond|unbonding|rebond|operator|node|secured asset|secured assets|trade account|trade accounts|app layer|cosmwasm|wasm|contract)\b/.test(normalizedQuery)) {
    return 0;
  }

  const hasLiquidityScope =
    /\b(?:lp|liquidity|pool|pools|deposit|deposits|withdraw|withdrawal|apy|yield)\b/.test(normalizedQuery) ||
    /\b(?:impermanent loss protection|il protection)\b/.test(normalizedQuery);
  const hasActionOrRiskIntent =
    /\b(?:add|deposit|deposits|withdraw|withdrawal|open|available|availability|halted|paused|safe|safety|apy|yield)\b/.test(normalizedQuery) ||
    /\b(?:impermanent loss protection|il protection)\b/.test(normalizedQuery);
  if (!hasLiquidityScope || !hasActionOrRiskIntent) {
    return 0;
  }

  const hasRunepoolScope = /\b(?:runepool|pol|protocol owned liquidity)\b/.test(normalizedQuery);
  if (hasRunepoolScope) {
    if (doc.id === 'task:runepool-pol') {
      return 9_500;
    }
    if (doc.id === 'task:liquidity-actions') {
      return 5_500;
    }
    return 0;
  }

  const asksAboutPause = /\b(?:halted|paused|pause|halt)\b/.test(normalizedQuery);
  const asksAboutMetricSafety = /\b(?:apy|yield|safe|safety|profitability|risk)\b/.test(normalizedQuery);

  if (doc.id === 'task:liquidity-actions') {
    return 10_000;
  }
  if (doc.id === 'deep-dive-liquidity-actions') {
    return 6_000;
  }
  if (asksAboutPause && doc.id === 'task:why-paused') {
    return 5_000;
  }
  if (asksAboutMetricSafety && doc.id === 'stats') {
    return 4_000;
  }
  if (doc.id === 'deep-dive-clp') {
    return 3_500;
  }

  return 0;
}

function quoteAndMemoInputIntentBoost(query: string, doc: SearchDoc) {
  const normalizedQuery = normalizeSearchText(query);
  if (!normalizedQuery) {
    return 0;
  }

  const hasDefinitionIntent = /\b(?:what is|what are|define|definition)\b/.test(normalizedQuery);
  const asksForQuoteResponseHandling =
    /\b(?:quote warning|quote warnings|quote response warning|quote rate limit|quote endpoint rate limit|rate limited quote|429 quote|quote 429)\b/.test(normalizedQuery);
  const asksForUserSwapInputLimit =
    !hasDefinitionIntent &&
    !/\brecommended\b/.test(normalizedQuery) &&
    /\b(?:minimum receive|min receive|minimum output|min output|min amount|minimum amount|memo too long|invalid memo|bad memo|wrong refund address|bad refund address|price tolerance|liquidity tolerance|liquidity_tolerance_bps)\b/.test(normalizedQuery);

  if (asksForQuoteResponseHandling) {
    if (doc.id === 'task:build-query') {
      return 11_000;
    }
    if (doc.id === 'deep-dive-build-query-data') {
      return 8_000;
    }
    if (doc.id === 'task:swap-refund-lifecycle') {
      return 6_000;
    }
    return 0;
  }

  if (asksForUserSwapInputLimit) {
    if (doc.id === 'task:swap-refund-lifecycle') {
      return 11_000;
    }
    if (doc.id === 'task:ordinary-fee-mechanics') {
      return 8_500;
    }
    if (doc.id === 'deep-dive-streaming-swaps-refunds') {
      return 7_000;
    }
    if (doc.id === 'task:build-query') {
      return 5_500;
    }
  }

  return 0;
}

function thornameGeneralIntentBoost(query: string, doc: SearchDoc) {
  const normalizedQuery = normalizeSearchText(query);
  if (!/\bthorname\b/.test(normalizedQuery)) {
    return 0;
  }

  const hasDynamicFeeContext = /\b(?:adr\s*0?26|adr026|dynamic fee|dynamic l1 fee|dynamicfee|l1dynamicfeeenabled|fee floor|fee floors|partner|symbiosis|shapeshift|fees_tor|volume_tor)\b/.test(normalizedQuery);
  if (hasDynamicFeeContext) {
    return 0;
  }

  if (doc.id === 'glossary:thorname') {
    return 12_000;
  }
  if (doc.id === 'task:build-query') {
    return 6_000;
  }
  if (doc.id === 'glossary:affiliate-fee') {
    return 4_500;
  }
  if (doc.id === 'task:fees-and-adr026') {
    return -2_000;
  }
  if (doc.id === 'dynamic-fees') {
    return -2_000;
  }

  return 0;
}

function routeExecutionInputIntentBoost(query: string, doc: SearchDoc) {
  const normalizedQuery = normalizeSearchText(query);
  if (!normalizedQuery) {
    return 0;
  }

  const hasQuoteScope = /\b(?:quote|quotes|quoteable|quoteability)\b/.test(normalizedQuery);
  const hasInboundScope = /\b(?:inbound address|inbound addresses|inbound_addresses)\b/.test(normalizedQuery);
  if (!hasQuoteScope && !hasInboundScope) {
    return 0;
  }

  const hasFreshnessIntent = /\b(?:current|fresh|latest|live|now|available)\b/.test(normalizedQuery);
  const hasCacheIntent = /\b(?:cache|cached|caching)\b/.test(normalizedQuery);
  const hasStaleIntent = /\b(?:stale|expired|old)\b/.test(normalizedQuery);
  if (!hasFreshnessIntent && !hasStaleIntent && !hasCacheIntent) {
    return 0;
  }

  if (hasQuoteScope && hasCacheIntent && !hasStaleIntent) {
    if (doc.id === 'task:build-query') {
      return 10_000;
    }
    if (doc.id === 'task:swap-refund-lifecycle') {
      return 5_500;
    }
    if (doc.id === 'deep-dive-build-query-data') {
      return 5_000;
    }
    return 0;
  }

  if (hasQuoteScope && hasFreshnessIntent && !hasStaleIntent) {
    if (doc.id === 'task:swap-availability') {
      return 10_000;
    }
    if (doc.id === 'task:build-query') {
      return 6_000;
    }
    if (doc.id === 'task:swap-refund-lifecycle') {
      return 5_500;
    }
    return 0;
  }

  if (hasInboundScope && hasFreshnessIntent && !hasStaleIntent) {
    if (doc.id === 'task:build-query') {
      return 10_000;
    }
    if (doc.id === 'task:swap-refund-lifecycle') {
      return 6_500;
    }
    if (doc.id === 'task:swap-availability') {
      return 5_500;
    }
    return 0;
  }

  if (hasStaleIntent) {
    if (doc.id === 'task:swap-refund-lifecycle') {
      return 10_000;
    }
    if (doc.id === 'task:build-query') {
      return 6_500;
    }
    if (doc.id === 'deep-dive-streaming-swaps-refunds') {
      return 5_500;
    }
    return 0;
  }

  return 0;
}

function midgardThornodeComparisonBoost(query: string, doc: SearchDoc) {
  const normalizedQuery = normalizeSearchText(query);
  if (!normalizedQuery) {
    return 0;
  }

  const hasMidgard = /\bmidgard\b/.test(normalizedQuery);
  const hasThornode = /\b(?:thornode|thor node)\b/.test(normalizedQuery);
  if (!hasMidgard || !hasThornode) {
    return 0;
  }

  if (doc.id === 'deep-dive-midgard-thornode-data') {
    return 10_000;
  }
  if (doc.id === 'source-map:current-protocol-state') {
    return 7_000;
  }
  if (doc.id === 'task:build-query') {
    return 6_000;
  }
  if (doc.id === 'task:source-choice') {
    return 5_500;
  }
  if (doc.id === 'deep-dive-build-query-data') {
    return 5_000;
  }

  return 0;
}

function sourceProvenanceIntentBoost(query: string, doc: SearchDoc) {
  const normalizedQuery = normalizeSearchText(query);
  if (!normalizedQuery) {
    return 0;
  }

  const asksForCurrentProtocolSource = /\bcurrent\s+protocol\s+(?:source|sources|evidence|state)\b/.test(normalizedQuery);
  const asksForProviderPosture =
    /\b(?:provider mismatch|provider mismatched|same provider|cross provider|failover|failed over|degraded source|source warning|source warnings|stale midgard|stale thornode|stale thor node|stale live data)\b/.test(normalizedQuery) ||
    /\b(?:midgard|thornode|thor node|provider)\b/.test(normalizedQuery) && /\b(?:stale|freshness|warning|warnings|mismatch|degraded|lag|sync)\b/.test(normalizedQuery);
  const asksForSourceBoundary =
    /\b(?:source freshness|stale source|source boundary|source posture|page source posture|source review date|data provenance|docs provenance|metric provenance|number provenance|where did (?:this|the) (?:number|metric|data|value) come from)\b/.test(normalizedQuery);

  if (!asksForCurrentProtocolSource && !asksForProviderPosture && !asksForSourceBoundary) {
    return 0;
  }

  if (asksForProviderPosture) {
    if (doc.id === 'source-map:runtime-live-data-failover') {
      return 12_000;
    }
    if (doc.id === 'source-map:current-protocol-state') {
      return 9_000;
    }
    if (doc.id === 'task:source-choice') {
      return 8_000;
    }
    if (doc.id === 'deep-dive-midgard-thornode-data') {
      return 6_500;
    }
    if (doc.id === 'task:build-query') {
      return 5_000;
    }
    return 0;
  }

  if (asksForCurrentProtocolSource) {
    if (doc.id === 'source-map:current-protocol-state') {
      return 12_000;
    }
    if (doc.id === 'task:source-choice') {
      return 8_000;
    }
    if (doc.id === 'docs') {
      return 6_000;
    }
    return 0;
  }

  if (doc.id === 'task:source-choice') {
    return 12_000;
  }
  if (doc.id === 'source-map:current-protocol-state') {
    return 10_000;
  }
  if (doc.id === 'source-map:runtime-live-data-failover') {
    return 9_000;
  }
  if (doc.id === 'docs') {
    return 7_000;
  }
  if (doc.id === 'deep-dive-midgard-thornode-data') {
    return 6_000;
  }

  return 0;
}

function transactionStatusIntentBoost(query: string, doc: SearchDoc) {
  const normalizedQuery = normalizeSearchText(query);
  if (!normalizedQuery) {
    return 0;
  }

  const hasTransactionScope = /\b(?:swap|transaction|tx|outbound|hash)\b/.test(normalizedQuery);
  const hasStatusIntent = /\b(?:track|tracking|pending|stuck|delayed|delay|where|status|missing|missed|no|observed|sent|received)\b/.test(normalizedQuery);
  const feeOnlyLookup = /\b(?:fee|fees|gas|bps)\b/.test(normalizedQuery);
  if (!hasTransactionScope || !hasStatusIntent || feeOnlyLookup) {
    return 0;
  }

  if (doc.id === 'task:swap-refund-lifecycle') {
    return 9_000;
  }
  if (doc.id === 'deep-dive-streaming-swaps-refunds') {
    return 5_000;
  }
  if (doc.id === 'ecosystem:runescan') {
    return 4_000;
  }

  return 0;
}

function namesEcosystemProject(normalizedQuery: string) {
  return ecosystemProjectIdentifiers.some(({ id, name }) => (
    normalizedQuery.includes(name) || normalizedQuery.split(/\s+/).includes(id)
  ));
}

function supportedChainCatalogIntentBoost(query: string, doc: SearchDoc) {
  const normalizedQuery = normalizeSearchText(query);
  const hasSupportIntent = /\b(?:catalog|listed|support|supported|supports)\b/.test(normalizedQuery);
  if (!hasSupportIntent) {
    return 0;
  }

  if (namesEcosystemProject(normalizedQuery)) {
    return doc.id === 'task:supported-chain-catalog' ? -10_000 : 0;
  }

  const matchedChain = findMatchingChainIdentifier(normalizedQuery);
  if (matchedChain) {
    return doc.id === `chain:${matchedChain.code}` ? 20_000 : 0;
  }

  const hasChainScope = /\b(?:chain|chains|network|networks)\b/.test(normalizedQuery);
  const hasNamedSupportQuestion = /^(?:are|can|do|does|is)\b.+\b(?:support|supported|supports)\b/.test(normalizedQuery);
  const clearlyOtherScope = /\b(?:app|application|asset|contract|feature|interface|lending|liquidity|memo|quote|rune|runepool|savers|staking|streaming|swap|token|transaction|wallet)\b/.test(normalizedQuery);
  if (!hasChainScope && clearlyOtherScope) {
    return doc.id === 'task:supported-chain-catalog' ? -10_000 : 0;
  }
  if (!hasChainScope && !hasNamedSupportQuestion) {
    return 0;
  }

  if (doc.id === 'task:supported-chain-catalog') {
    return 20_000;
  }
  if (doc.id === 'protocol') {
    return 14_000;
  }
  if (doc.id === 'task:swap-availability') {
    return 10_000;
  }
  if (doc.id === 'source-map:current-protocol-state') {
    return 9_000;
  }
  if (doc.type === 'chain') {
    return -12_000;
  }
  if (doc.id === 'task:app-layer-and-secured-assets' || doc.id === 'deep-dive-path:app-layer-integrations') {
    return -8_000;
  }
  if (doc.id === 'source-map:third-party-interfaces-wallets') {
    return -8_000;
  }

  return 0;
}

function vaultIncidentIntentBoost(query: string, doc: SearchDoc) {
  const normalizedQuery = normalizeSearchText(query);
  const hasVaultScope = /\b(?:vaults?|gg20)\b/.test(normalizedQuery);
  const hasIncidentIntent = /\b(?:exploit|incident|attack|breach|drain|drained|draining)\b/.test(normalizedQuery);
  if (!hasVaultScope || !hasIncidentIntent) {
    return 0;
  }

  return doc.id === 'incident:gg20-vault-exploit-2026' ? 18_000 : 0;
}

function protocolVaultSafetyIntentBoost(query: string, doc: SearchDoc) {
  const normalizedQuery = normalizeSearchText(query);
  if (!normalizedQuery) {
    return 0;
  }

  const hasProtocolVaultScope = /\b(?:vaults?|asgard|tss)\b/.test(normalizedQuery);
  const hasSafetyIntent = /\b(?:safe|safety|secure|security|risk|solvency)\b/.test(normalizedQuery);
  if (!hasProtocolVaultScope || !hasSafetyIntent) {
    return 0;
  }

  const hasInterfaceScope =
    namesEcosystemProject(normalizedQuery) ||
    /\b(?:wallet|interface|app|download|permissions|device|custody|third party)\b/.test(normalizedQuery);
  if (hasInterfaceScope) {
    return 0;
  }

  if (doc.id === 'task:choose-interface') {
    return -10_000;
  }
  if (doc.id === 'source-map:third-party-interfaces-wallets') {
    return -8_000;
  }
  if (doc.id === 'task:tss-security-claims') {
    return 14_000;
  }
  if (doc.id === 'deep-dive-tss') {
    return 9_000;
  }
  if (doc.id === 'deep-dive-path:network-security') {
    return 7_500;
  }

  return 0;
}

function interfaceSafetyIntentBoost(query: string, doc: SearchDoc) {
  const normalizedQuery = normalizeSearchText(query);
  if (!normalizedQuery) {
    return 0;
  }

  const hasSafetyIntent = /\b(?:safe|safety|endorsement|endorsed|download integrity|wallet permissions|quote recipient|interface trust|check before use)\b/.test(normalizedQuery);
  if (!hasSafetyIntent) {
    return 0;
  }

  const hasProtocolVaultScope = /\b(?:vaults?|asgard|tss)\b/.test(normalizedQuery);
  const hasInterfaceScope =
    namesEcosystemProject(normalizedQuery) ||
    /\b(?:wallet|interface|app|download|permissions|device|custody|third party)\b/.test(normalizedQuery);
  if (hasProtocolVaultScope && !hasInterfaceScope) {
    return 0;
  }

  if (hasInterfaceScope && doc.id === 'task:tss-security-claims') {
    return -10_000;
  }
  if (hasInterfaceScope && doc.id === 'deep-dive-path:network-security') {
    return -8_000;
  }
  if (doc.id === 'task:choose-interface') {
    return 9_000;
  }
  if (doc.id === 'source-map:third-party-interfaces-wallets') {
    return 5_000;
  }

  return 0;
}

function glossaryDefinitionBoost(query: string, doc: SearchDoc) {
  if (doc.type !== 'glossary') {
    return 0;
  }

  const normalizedQuery = normalizeSearchText(query);
  const normalizedTitle = normalizeSearchText(doc.title);
  if (!normalizedQuery || !normalizedTitle) {
    return 0;
  }

  const definitionQueries = [
    `what is ${normalizedTitle}`,
    `what are ${normalizedTitle}`,
    `define ${normalizedTitle}`,
    `${normalizedTitle} definition`,
    `definition of ${normalizedTitle}`,
  ];

  if (definitionQueries.includes(normalizedQuery)) {
    return 1000;
  }

  const exactExecutionGlossaryIds = new Set([
    'glossary:quote',
    'glossary:quote-expiry',
    'glossary:recommended-min-amount-in',
    'glossary:dust-threshold',
    'glossary:refund-address',
    'glossary:streaming-swap',
    'glossary:liquidity-tolerance-bps',
  ]);

  if (normalizedQuery === normalizedTitle && normalizedWords(normalizedTitle).length > 1) {
    return exactExecutionGlossaryIds.has(doc.id) ? 5000 : 750;
  }

  return 0;
}

function governanceProposalNumberBoost(query: string, doc: SearchDoc) {
  if (doc.type !== 'governance') {
    return 0;
  }

  const proposalNumber = governanceProposalNumbersBySearchId.get(doc.id);
  if (!proposalNumber) {
    return 0;
  }

  const normalizedQuery = normalizeSearchText(query);
  const match = /^adr\s*0*(\d+)$/.exec(normalizedQuery);
  if (!match) {
    return 0;
  }

  return match[1] === proposalNumber ? 12_000 : 0;
}

function governanceActionIntentBoost(query: string, doc: SearchDoc) {
  const normalizedQuery = normalizeSearchText(query);
  if (!normalizedQuery) {
    return 0;
  }

  const compactQuery = normalizedQuery.replace(/\s+/g, '');
  const isExactAdrNumber = /^adr0*\d+$/.test(compactQuery);
  const isSpecificProposalNumber = /^proposal\s*0*\d+$/.test(normalizedQuery);
  if (isExactAdrNumber || isSpecificProposalNumber) {
    return 0;
  }

  const hasGovernanceScope = /\b(?:governance|proposal|proposals|adr|vote|voting)\b/.test(normalizedQuery);
  const hasActionOrBoundaryIntent = /\b(?:submit|create|propose|proposal|proposals|vote|voting|status|claim|proof|source|boundary|community)\b/.test(normalizedQuery);
  if (!hasGovernanceScope || !hasActionOrBoundaryIntent) {
    return 0;
  }

  if (doc.id === 'task:governance-proposals') {
    return 12_000;
  }
  if (doc.id === 'governance') {
    return 7_000;
  }
  if (doc.id === 'task:source-choice') {
    return 4_000;
  }

  return 0;
}

function nodeOperatorGuideIntentBoost(query: string, doc: SearchDoc) {
  const normalizedQuery = normalizeSearchText(query);
  if (!normalizedQuery) {
    return 0;
  }

  const compactQuery = normalizedQuery.replace(/\s+/g, '');
  const currentActionIntent =
    /\b(?:current|now|available|availability|halt|halted|paused|pause|withdraw|withdrawal|unbond|unbonding|rebond|rotate|rotation|bond withdrawal)\b/.test(normalizedQuery) ||
    /^(?:pausebond|pauseunbond|haltrebond|haltoperatorrotate)$/.test(compactQuery);
  if (currentActionIntent) {
    return 0;
  }

  const hasNodeScope =
    /\b(?:node operator|node setup|node operations?|node lifecycle|validator node|thorchain node|thornode|thor node|thorchain validator|thornode operator)\b/.test(normalizedQuery) ||
    /\bnode\b/.test(normalizedQuery) && /\b(?:operator|validator|setup|operate|running|run)\b/.test(normalizedQuery);
  const hasGuideIntent =
    /\b(?:guide|setup|run|running|operate|operating|become|validator|operator|lifecycle|learn)\b/.test(normalizedQuery);
  if (!hasNodeScope || !hasGuideIntent) {
    return 0;
  }

  if (doc.id === 'task:node-operator-guide') {
    return 12_000;
  }
  if (doc.id === 'network') {
    return 7_000;
  }
  if (doc.id === 'task:node-operator-actions') {
    return 5_500;
  }
  if (doc.id === 'deep-dive-churning') {
    return 4_500;
  }
  if (doc.id === 'deep-dive-slashing') {
    return 4_000;
  }
  if (doc.id === 'deep-dive-incentive-pendulum') {
    return 3_500;
  }

  return 0;
}

function runeActionIntentBoost(query: string, doc: SearchDoc) {
  const normalizedQuery = normalizeSearchText(query);
  if (!normalizedQuery) {
    return 0;
  }

  const hasRuneScope = /\brune\b/.test(normalizedQuery);
  if (!hasRuneScope) {
    return 0;
  }

  const isSpecificNonActionRuneQuery = /\b(?:fair value|price target|tokenomics|supply|market cap|exchange float|minimum bond|slash settings|runepool|pol|protocol owned liquidity)\b/.test(normalizedQuery);
  if (isSpecificNonActionRuneQuery) {
    return 0;
  }

  const isSwapTroubleshooting = /\b(?:refund|failed|failure|stuck|pending|outbound|memo|dust|minimum receive|min receive|min output|slippage tolerance|liquidity tolerance|wrong refund|stale quote)\b/.test(normalizedQuery);
  if (isSwapTroubleshooting) {
    return 0;
  }

  const hasActionIntent = /\b(?:buy|acquire|swap|route|quote|wallet|interface|stake|staking|earn|yield|bond|bonding)\b/.test(normalizedQuery);
  if (!hasActionIntent) {
    return 0;
  }

  if (doc.id === 'task:rune-actions') {
    return 14_000;
  }
  if (doc.id === 'rune') {
    return 7_000;
  }
  if (doc.id === 'task:swap-availability') {
    return 5_500;
  }
  if (doc.id === 'task:choose-interface') {
    return 5_000;
  }
  if (doc.id === 'task:runepool-pol') {
    return 4_500;
  }
  if (doc.id === 'task:node-operator-guide') {
    return 4_000;
  }
  if (doc.id === 'task:rune-tokenomics') {
    return 3_000;
  }

  return 0;
}

export function rankSearchResults<T extends SearchResultWithScore>(query: string, results: T[]): T[] {
  return results
    .map((result, index) => ({
      result,
      index,
      adjustedScore: result.score + taskQueryBoost(query, result) + deepDivePathQueryBoost(query, result) + sourceMapQueryBoost(query, result) + contentEntryQueryBoost(query, result) + chainAssetQueryBoost(query, result) + chainHaltIntentBoost(query, result) + operationalStateIntentBoost(query, result) + assetPairRouteIntentBoost(query, result) + tcyCurrentActionIntentBoost(query, result) + liquidityControlKeyIntentBoost(query, result) + appLayerActionIntentBoost(query, result) + liquidityActionIntentBoost(query, result) + quoteAndMemoInputIntentBoost(query, result) + thornameGeneralIntentBoost(query, result) + routeExecutionInputIntentBoost(query, result) + midgardThornodeComparisonBoost(query, result) + sourceProvenanceIntentBoost(query, result) + transactionStatusIntentBoost(query, result) + supportedChainCatalogIntentBoost(query, result) + vaultIncidentIntentBoost(query, result) + protocolVaultSafetyIntentBoost(query, result) + interfaceSafetyIntentBoost(query, result) + glossaryDefinitionBoost(query, result) + governanceProposalNumberBoost(query, result) + governanceActionIntentBoost(query, result) + nodeOperatorGuideIntentBoost(query, result) + runeActionIntentBoost(query, result),
    }))
    .sort((a, b) => {
      if (b.adjustedScore !== a.adjustedScore) {
        return b.adjustedScore - a.adjustedScore;
      }
      return a.index - b.index;
    })
    .map(({ result }) => result);
}
