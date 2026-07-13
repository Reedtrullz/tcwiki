export type SourceMapExplorerView = 'all' | 'claim-paths' | 'source-families';

export interface SourceMapExplorerChoice {
  id: string;
  label: string;
  question: string;
  startWith: string;
  href: string;
  avoid: string;
}

export interface SourceMapExplorerDecision {
  id: string;
  claim: string;
  startWith: {
    label: string;
    href: string;
  };
  sourcePosture?: {
    confidence: string;
    checkedAt: string;
    nextReviewDue: string;
    primarySource: {
      label: string;
      url: string;
    };
  };
  why: string;
  nextChecks: Array<{
    label: string;
    href: string;
    description: string;
  }>;
  avoidClaiming: string;
}

export interface SourceMapExplorerSection {
  id: string;
  title: string;
  decision: string;
  use: string;
  caveat: string;
  claimExamples: string[];
  nonClaims: string[];
  linkLabels: string[];
}

export interface SourceMapExplorerFilters {
  query: string;
  view: SourceMapExplorerView;
}

export interface SourceMapExplorerResult {
  triageChoices: SourceMapExplorerChoice[];
  decisions: SourceMapExplorerDecision[];
  sections: SourceMapExplorerSection[];
  totalVisible: number;
  activeFilterLabels: string[];
  summary: string;
  emptyMessage: string;
}

export function buildSourceMapEvidencePacket(decision: SourceMapExplorerDecision) {
  const lines = [
    'THORChain Wiki source-map evidence packet',
    `Claim to check: ${decision.claim}`,
    `Start with: ${decision.startWith.label} (${decision.startWith.href})`,
    ...(decision.sourcePosture ? [
      `Source posture: ${decision.sourcePosture.confidence}`,
      `Checked / review due: ${decision.sourcePosture.checkedAt} / ${decision.sourcePosture.nextReviewDue}`,
      `Primary source: ${decision.sourcePosture.primarySource.label} (${decision.sourcePosture.primarySource.url})`,
    ] : []),
    `Why this source path: ${decision.why}`,
    'Next checks:',
    ...decision.nextChecks.map((check) => `- ${check.label}: ${check.description} (${check.href})`),
    `Do not claim from this alone: ${decision.avoidClaiming}`,
  ];

  return lines.join('\n');
}

function normalizeText(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
}

function queryWords(query: string) {
  return normalizeText(query).split(/\s+/).filter((word) => word.length > 1);
}

function matchesQuery(searchText: string, query: string) {
  const words = queryWords(query);
  if (words.length === 0) {
    return true;
  }

  const haystack = normalizeText(searchText);
  return words.every((word) => haystack.includes(word));
}

function choiceSearchText(choice: SourceMapExplorerChoice) {
  return [
    choice.label,
    choice.question,
    choice.startWith,
    choice.href,
    choice.avoid,
  ].join(' ');
}

function decisionSearchText(decision: SourceMapExplorerDecision) {
  return [
    decision.claim,
    decision.startWith.label,
    decision.startWith.href,
    decision.why,
    decision.avoidClaiming,
    ...decision.nextChecks.flatMap((check) => [check.label, check.href, check.description]),
  ].join(' ');
}

function sectionSearchText(section: SourceMapExplorerSection) {
  return [
    section.title,
    section.decision,
    section.use,
    section.caveat,
    ...section.claimExamples,
    ...section.nonClaims,
    ...section.linkLabels,
  ].join(' ');
}

function viewLabel(view: SourceMapExplorerView) {
  switch (view) {
    case 'claim-paths':
      return 'Claim paths';
    case 'source-families':
      return 'Source families';
    case 'all':
      return 'All';
  }
}

function pluralize(count: number, singular: string, plural: string) {
  return `${count} ${count === 1 ? singular : plural}`;
}

export function deriveSourceMapExplorer({
  triageChoices,
  decisions,
  sections,
  filters,
}: {
  triageChoices: SourceMapExplorerChoice[];
  decisions: SourceMapExplorerDecision[];
  sections: SourceMapExplorerSection[];
  filters: SourceMapExplorerFilters;
}): SourceMapExplorerResult {
  const query = filters.query.trim();
  const showClaimPaths = filters.view === 'all' || filters.view === 'claim-paths';
  const showSourceFamilies = filters.view === 'all' || filters.view === 'source-families';
  const filteredChoices = showClaimPaths
    ? triageChoices.filter((choice) => matchesQuery(choiceSearchText(choice), query))
    : [];
  const filteredDecisions = showClaimPaths
    ? decisions.filter((decision) => matchesQuery(decisionSearchText(decision), query))
    : [];
  const filteredSections = showSourceFamilies
    ? sections.filter((section) => matchesQuery(sectionSearchText(section), query))
    : [];
  const claimPathCount = filteredChoices.length + filteredDecisions.length;
  const sourceFamilyCount = filteredSections.length;
  const totalVisible = claimPathCount + sourceFamilyCount;
  const activeFilterLabels = [
    query ? `Search: ${query}` : null,
    filters.view !== 'all' ? `View: ${viewLabel(filters.view)}` : null,
  ].filter((label): label is string => label !== null);
  const summary = activeFilterLabels.length > 0
    ? `Showing ${pluralize(claimPathCount, 'claim path', 'claim paths')} and ${pluralize(sourceFamilyCount, 'source family', 'source families')} after filters.`
    : `Showing ${pluralize(claimPathCount, 'claim path', 'claim paths')} and ${pluralize(sourceFamilyCount, 'source family', 'source families')}.`;
  const emptyMessage = query
    ? `No source-map paths match "${query}". Try another claim, source family, or proof boundary.`
    : 'No source-map paths match the current filters. Try another claim, source family, or proof boundary.';

  return {
    triageChoices: filteredChoices,
    decisions: filteredDecisions,
    sections: filteredSections,
    totalVisible,
    activeFilterLabels,
    summary,
    emptyMessage,
  };
}
