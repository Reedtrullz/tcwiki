# features/ — Domain-Specific Composed Components

Higher-level components that combine ui/ primitives with specific THORChain domain concepts.

Intended examples (future):
- `EcosystemCard.tsx`
- `GovernanceProposalCard.tsx`
- `NetworkNodeTypeCard.tsx`
- `LiveStatsStrip.tsx`
- `EarningsChart.tsx` (Recharts wrapper using design tokens)
- `SearchResultCard.tsx`

These are allowed to know about the shape of data from `lib/data/static.ts` or Midgard responses, but should still prefer composition over duplication.