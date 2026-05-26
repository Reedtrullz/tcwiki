# ui/ — Design System Primitives

Pure presentational components that only use tokens from the design system (`globals.css`).

Intended contents:
- `Card.tsx` (variants: elevated, bordered, hoverable)
- `Badge.tsx` (semantic: success / warning / danger / info)
- `SectionHeader.tsx` (the recurring uppercase tracking-wider h2)
- `StatCard.tsx`
- Button / LinkCard primitives as needed

**Rules:**
- No business logic, no data fetching.
- All styling uses `--color-surface*`, `--color-border`, `--color-accent`, `--color-rune`, and slate neutrals.
- Keep these small and highly reusable.

See the top-level improvement plan for the target component architecture.