# Dependency maintenance receipt — 2 October 2026

## Current-source decisions

Main686b63b already locks Next16.3.8 after the immediate fix in132/205. Preserve it. Align @next/mdx and eslint-config-next to16.3.8; apply compatible lucide-react1.48.0 and Vitest5.0.3 (resolved from the compatible ^5.0.2 range) maintenance. Node stays22; Docker22.23.3-alpine's exact digest was verified with docker buildx imagetools inspect: sha256:0a7108bf6c7bf5de370ffb1a3ed6be93d405b43ff159f681a8d18c0e2bc2e402.

Old PR130,131,133,134,135 all failed at npm run audit:prod, respectively runs36818977064,36818993908,36819027562,36819047202,36819055759. They did not reach their framework/browser compatibility gates. Their old-base failure is not evidence that these package patches are incompatible. This candidate supersedes the package/image proposals after owner merge; they remain open until that decision.

## Reachability and remediation

- Old node_modules/next16.3.5: production Next/next-og dependency; two public image routes consume ImageResponse, so the owning Next patch is relevant. Old report included GHSA-vcvr-r3jv-pc5j; current main already16.3.8. Do not downgrade or infer that production was exploited.
- node_modules/undici7.29.1: npm explain identifies miniflare as its owner, through Wrangler/Cloudflare local/build tooling. This is in the full tooling tree, not a new direct runtime fetch dependency. Remediate through the owner; no application override of undici is added. Both full/production audits are required.
- No dated audit exception or lower severity threshold is introduced. Framework maintenance groups limit to minor/patch updates; incompatible majors stay separately reviewed.

## Consumer-checked removal (PR56)

Search of src/content/Next/Vite config found no rehype-katex, remark-math or KaTeX consumer, and no MDX math delimiters (currency template strings are not formulas). CLP math is deliberately fenced plain text. Neither build enables these plugins. Remove the two unused direct math dependencies.

Search of src/content/docs/package/Next/Vite config found no URLs/imports for public/file.svg, globe.svg, next.svg, vercel.svg or window.svg. Remove those five tracked starter assets; preserve _headers and real share-image routes. Re-render representative MDX tables/anchors and search on both supported runtimes, with ordinary build/runtime gates. Verification results are recorded in the workplan ledger/PR after the checks complete.
