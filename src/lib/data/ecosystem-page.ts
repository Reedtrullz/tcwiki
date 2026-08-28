export interface InterfaceIntentGuide {
  id: string;
  intent: string;
  startWith: string;
  verify: string;
  nonClaim: string;
  actionLabel: string;
  href: string;
}

export interface InterfaceJourneyStep {
  step: string;
  title: string;
  body: string;
  actionLabel: string;
  href: string;
}

export const interfaceIntentGuides: InterfaceIntentGuide[] = [
  {
    id: 'swap',
    intent: 'Swap or quote',
    startWith: 'Live route status and a fresh quote check.',
    verify: 'Trading, signing, chain state, quote amount, recipient, slippage, fees, and expiry.',
    nonClaim: 'Do not infer current route settlement from catalog presence.',
    actionLabel: 'Check a route',
    href: '/network#check-a-route',
  },
  {
    id: 'wallet',
    intent: 'Wallet or app',
    startWith: 'The project card, source map, and upstream release path.',
    verify: 'Download source, wallet permissions, connected accounts, signing prompts, and current support.',
    nonClaim: 'Do not infer wallet safety or custody quality.',
    actionLabel: 'Read interface source map',
    href: '/docs#third-party-interfaces-wallets',
  },
  {
    id: 'explorer',
    intent: 'Transaction or refund evidence',
    startWith: 'Explorer records plus the refund evidence ladder.',
    verify: 'Inbound transaction hash, observed memo, source chain, destination chain, outbound, and refund transaction.',
    nonClaim: 'Explorer display alone does not establish a refund cause.',
    actionLabel: 'Open refund triage',
    href: '/deep-dives/streaming-swaps-refunds#evidence-ladder',
  },
  {
    id: 'builder',
    intent: 'Build an integration',
    startWith: 'Developer docs, SDK records, and live quote behavior.',
    verify: 'Package version, API compatibility, memo handling, affiliate settings, quote errors, and production readiness.',
    nonClaim: 'A listed SDK is not production-safe by inclusion.',
    actionLabel: 'Open build/query guide',
    href: '/deep-dives/build-query-data#query-plan',
  },
];

export const interfaceJourneySteps: InterfaceJourneyStep[] = [
  {
    step: '1',
    title: 'Choose the surface',
    body: 'Decide whether you need a swap interface, wallet workflow, explorer evidence, or developer tooling. Directory filters narrow sourced pointers; they do not rank safety.',
    actionLabel: 'Review directory checks',
    href: '#ecosystem-directory',
  },
  {
    step: '2',
    title: 'Check live protocol state',
    body: 'Trading, signing, observation, LP actions, and chain-specific controls can change independently of catalog presence or directory posture; neither reports app uptime.',
    actionLabel: 'Open network diagnostics',
    href: '/network#network-diagnostics',
  },
  {
    step: '3',
    title: 'Read source posture',
    body: 'Source labels explain what the wiki backs. They do not prove uptime, route quality, wallet safety, current terms, or official endorsement.',
    actionLabel: 'Open source map',
    href: '/docs#third-party-interfaces-wallets',
  },
  {
    step: '4',
    title: 'Inspect signing risk',
    body: 'Before opening a third-party path, verify release source, wallet permissions, quoted route, recipient, slippage, fees, and product availability.',
    actionLabel: 'Find ecosystem entries',
    href: '#ecosystem-directory',
  },
];
