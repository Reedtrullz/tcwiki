# THORChain Wiki — Current serving and verification boundaries

Source reviewed 2 October 2026 from main `686b63b1b04f9f6c3045904a552c519a89cced91`. This note distinguishes the current source/configuration from runtime, content and human acceptance.

The serving architecture is a thin Cloudflare forwarding Worker plus SQLite WikiDO running the vinext build (`cloudflare/do-entry.mjs`, `wrangler.do.jsonc`). Static assets use the asset binding. Next standalone/Docker remains a supported verification target and guarded VPS rollback path. Repository variables were independently read as Cloudflare enabled / VPS disabled on the review date. Do not recreate retired serving containers or remove the primary marker, backups or rollback image incidentally.

Current CI builds/dry-runs and retains a Cloudflare preview but the ordinary Playwright server is standalone. A build or upload dry-run does not prove Cloudflare browser behavior. Runtime metadata is self-reported, not cryptographic attestation; artifact promotion and full deploy-input identity remain separate roadmap work.

PR #205 already reassesses THORNode freshness after retrieval and readiness delivery and expires cached fresh evidence earlier. Preserve the existing warning/stale policy and review residual browser/timing gaps before another fix. Curated content stays in React/MDX registries; source/version review, current-versus-historical meaning and live operational availability remain separate.

The preserved older primary checkout has installed React and Vitest versions that differ from its lockfile. `node scripts/check-workspace.mjs --root /absolute/checkout` reports those mismatches without changing files; use the pinned Node22 runtime. A clean `npm ci --include=optional` in an isolated current-main worktree reproduced locked versions. Do not auto-install, clean, switch or repin the owner's WIP.

See [the 69-proposal plan](docs/superpowers/plans/2026-10-02-entire-workplan.md) and [execution ledger](docs/superpowers/plans/2026-10-02-workplan-progress.md). Local tests/CI/production readback/protocol source review/human learning acceptance have distinct receipts. This source note alone certifies none of them.
