import { describe, expect, it } from 'vitest';
import {
  buildSourceMapEvidencePacket,
  deriveSourceMapExplorer,
  type SourceMapExplorerChoice,
  type SourceMapExplorerDecision,
  type SourceMapExplorerSection,
} from '@/lib/source-map-explorer';

const choices: SourceMapExplorerChoice[] = [
  {
    id: 'current-state',
    label: 'Current state',
    question: 'Is something live, paused, quoteable, or enabled right now?',
    startWith: 'Network diagnostics',
    href: '/network#network-diagnostics',
    avoid: 'Durable uptime, future availability, or safety claims.',
  },
  {
    id: 'interface',
    label: 'Third-party surfaces',
    question: 'Are you checking a wallet, interface, explorer, or SDK listing?',
    startWith: 'Interface Sources',
    href: '#third-party-interfaces-wallets',
    avoid: 'Wallet safety, app uptime, endorsement, or quote quality.',
  },
];

const decisions: SourceMapExplorerDecision[] = [
  {
    id: 'current-live-state',
    claim: 'Something is available, paused, enabled, or healthy right now.',
    startWith: {
      label: 'Current Protocol State',
      href: '/docs#current-protocol-state',
    },
    why: 'Current availability claims need live protocol evidence.',
    nextChecks: [
      {
        label: 'Network diagnostics',
        href: '/network#network-diagnostics',
        description: 'Pause, halt, signing, LP, TCY, and chain evidence.',
      },
    ],
    avoidClaiming: 'Durable uptime, safety, or future availability from a single current-only response.',
    sourcePosture: {
      confidence: 'official',
      checkedAt: '2026-07-05',
      nextReviewDue: '2026-08-05',
      primarySource: {
        label: 'THORNode Mimir',
        url: 'https://thornode.ninerealms.com/thorchain/mimir',
      },
    },
  },
  {
    id: 'wallet-interface',
    claim: 'A wallet, interface, explorer, or integration surface is safe to use.',
    startWith: {
      label: 'Interface checklist',
      href: '/ecosystem#interface-use-checklist',
    },
    why: 'Third-party surfaces need source integrity, quote, memo, recipient, and route checks.',
    nextChecks: [
      {
        label: 'Ecosystem checklist',
        href: '/ecosystem#interface-use-checklist',
        description: 'Interface trust checks before signing.',
      },
    ],
    avoidClaiming: 'Wallet safety, endorsement, uptime, quote quality, or transaction success from a listing alone.',
  },
];

const sections: SourceMapExplorerSection[] = [
  {
    id: 'current-protocol-state',
    title: 'Current Protocol State',
    decision: 'Is an operational control active right now?',
    use: 'Use live THORNode evidence.',
    caveat: 'Current-only snapshots do not prove future availability.',
    claimExamples: ['Current halt or pause state.'],
    nonClaims: ['Durable uptime or safety.'],
    linkLabels: ['THORNode Mimir'],
  },
  {
    id: 'third-party-interfaces-wallets',
    title: 'Third-Party Interfaces And Wallets',
    decision: 'Which interface or wallet surface needs verification?',
    use: 'Use interface source checks for wallet and explorer claims.',
    caveat: 'A listing does not prove wallet safety or app uptime.',
    claimExamples: ['Which interface source should be inspected.'],
    nonClaims: ['Wallet safety, endorsement, quote quality, or transaction success.'],
    linkLabels: ['RuneScan', 'THORSwap'],
  },
];

describe('source map explorer', () => {
  it('matches risky claim wording across triage choices, claim paths, and source families', () => {
    const explorer = deriveSourceMapExplorer({
      triageChoices: choices,
      decisions,
      sections,
      filters: {
        query: 'wallet safety',
        view: 'all',
      },
    });

    expect(explorer.triageChoices.map((choice) => choice.id)).toEqual(['interface']);
    expect(explorer.decisions.map((decision) => decision.id)).toEqual(['wallet-interface']);
    expect(explorer.sections.map((section) => section.id)).toEqual(['third-party-interfaces-wallets']);
    expect(explorer.summary).toBe('Showing 2 claim paths and 1 source family after filters.');
    expect(explorer.activeFilterLabels).toEqual(['Search: wallet safety']);
  });

  it('can scope results to claim paths or source families without losing active labels', () => {
    const claimPaths = deriveSourceMapExplorer({
      triageChoices: choices,
      decisions,
      sections,
      filters: {
        query: 'safety',
        view: 'claim-paths',
      },
    });

    expect(claimPaths.triageChoices.map((choice) => choice.id)).toEqual(['current-state', 'interface']);
    expect(claimPaths.decisions.map((decision) => decision.id)).toEqual(['current-live-state', 'wallet-interface']);
    expect(claimPaths.sections).toEqual([]);
    expect(claimPaths.activeFilterLabels).toEqual(['Search: safety', 'View: Claim paths']);

    const sourceFamilies = deriveSourceMapExplorer({
      triageChoices: choices,
      decisions,
      sections,
      filters: {
        query: 'safety',
        view: 'source-families',
      },
    });

    expect(sourceFamilies.triageChoices).toEqual([]);
    expect(sourceFamilies.decisions).toEqual([]);
    expect(sourceFamilies.sections.map((section) => section.id)).toEqual([
      'current-protocol-state',
      'third-party-interfaces-wallets',
    ]);
    expect(sourceFamilies.activeFilterLabels).toEqual(['Search: safety', 'View: Source families']);
  });

  it('keeps empty states explicit instead of implying missing sources are unavailable', () => {
    const explorer = deriveSourceMapExplorer({
      triageChoices: choices,
      decisions,
      sections,
      filters: {
        query: 'martian banana',
        view: 'all',
      },
    });

    expect(explorer.totalVisible).toBe(0);
    expect(explorer.emptyMessage).toBe('No source-map paths match "martian banana". Try another claim, source family, or proof boundary.');
  });

  it('builds copyable evidence packets with source paths and non-claim boundaries', () => {
    const packet = buildSourceMapEvidencePacket(decisions[0]);

    expect(packet).toContain('THORChain Wiki source-map evidence packet');
    expect(packet).toContain('Claim to check: Something is available, paused, enabled, or healthy right now.');
    expect(packet).toContain('Start with: Current Protocol State (/docs#current-protocol-state)');
    expect(packet).toContain('Source posture: official');
    expect(packet).toContain('Checked / review due: 2026-07-05 / 2026-08-05');
    expect(packet).toContain('Primary source: THORNode Mimir (https://thornode.ninerealms.com/thorchain/mimir)');
    expect(packet).toContain('- Network diagnostics: Pause, halt, signing, LP, TCY, and chain evidence. (/network#network-diagnostics)');
    expect(packet).toContain('Do not claim from this alone: Durable uptime, safety, or future availability from a single current-only response.');
    expect(packet).not.toContain('proves');
  });
});
