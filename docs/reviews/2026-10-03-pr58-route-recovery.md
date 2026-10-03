# PR-58 route recovery review

Reviewed against `codex/wiki-route-recovery` with PR247 integrated (`d833ad9` before parent verification).

## Change

The root `error.tsx` now offers an in-place retry and keeps the root layout around it. The root `not-found.tsx` provides a useful unmatched-route explanation. Both use the same small panel, which focuses its heading, announces the message through a polite status region, and links to the wiki home, source map, and search. The error object is not rendered or logged, and existing provider-specific error states are unchanged.

The panel accepts the documented Next `retry()` callback and the installed vinext `reset()` callback. It prefers `retry` when both are present. It does not add a global error page, telemetry, route redirect, or production error trigger.

## Runtime evidence and limits

- Installed Next is 16.3.8. Its `node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/error.md` documents `retry()` as the normal recovery action; `reset()` is available for a specific state-only reset case. The installed Next error-info declaration includes both callbacks.
- The same Next guide says `error.tsx` does not catch failures in its parent layout. Root-layout failures remain outside this route-boundary scope.
- Installed vinext's `dist/shims/error-boundary.d.ts` gives error fallbacks `{ error, reset }`. In `dist/shims/error-boundary.js:146-158`, the client boundary's `reset` clears its captured error; the serialized server-error fallback at lines 12-21 uses `location.reload()`. `dist/server/app-page-route-wiring.js:684-709` installs the configured root not-found and route error boundaries. This verifies callback and file-convention support in the installed source, and the parent verified a controlled client throw/recovery cycle on both built runtimes.
- Next's `node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/not-found.md` says a streamed not-found response can carry HTTP 200, while a non-streamed response carries 404; it also says root `app/not-found.js` handles unmatched URLs (line 133). The vinext not-found boundary adds `noindex` (`dist/shims/error-boundary.js:212-216`). This change makes no unconditional HTTP-status claim; the status emitted by the selected deployment runtime must be verified against its actual streamed response.

## Parent runtime proof: disposable fixture overlay

The committed route smoke test checks unmatched-route content, focus, URL retention, root header, and navigation, and records the navigation response status as a Playwright annotation. To prove that a rendering error can recover without adding a production trigger, apply this temporary overlay only in a disposable copy of the candidate checkout:

1. Add `src/app/pr58-recovery-probe/page.tsx`:

   ```tsx
   import RecoveryProbe from './RecoveryProbe';

   export default function Page() {
     return <RecoveryProbe />;
   }
   ```

2. Add `src/app/pr58-recovery-probe/RecoveryProbe.tsx`:

   ```tsx
   'use client';

   import { useEffect, useState } from 'react';

   // Local-only fixture. Persist the throw until the test explicitly permits recovery.

   export default function RecoveryProbe() {
     const [armed, setArmed] = useState(false);

     useEffect(() => { const timer = setTimeout(() => setArmed(true), 0); return () => clearTimeout(timer); }, []);

     if (armed && sessionStorage.getItem('tcwiki-pr58-recovered') !== 'yes') {
       throw new Error('PR-58 local recovery fixture');
     }

     return <p>PR-58 recovery fixture rendered successfully.</p>;
   }
   ```

3. Temporarily add this Playwright case:

   ```ts
   test('PR-58 route render errors recover in place', async ({ page }) => {
     const response = await page.goto('/pr58-recovery-probe');
     await expect(page.getByRole('status')).toContainText('This page hit a problem');
     await expect(page.getByRole('banner')).toBeVisible();
     await expect(page.getByRole('heading', { name: 'This page hit a problem' })).toBeFocused();
     await page.evaluate(() => sessionStorage.setItem('tcwiki-pr58-recovered', 'yes'));
     await page.getByRole('button', { name: 'Try again' }).focus();
     await page.keyboard.press('Enter');
     await expect(page.getByText('PR-58 recovery fixture rendered successfully.')).toBeVisible();

     test.info().annotations.push({
       type: 'pr58-navigation-status',
       description: String(response?.status() ?? 'no response'),
     });
   });
   ```

   Run it against the candidate's intended runtime, including its normal CSP settings. Record the response status and whether that runtime streamed the not-found response; Next documents HTTP 200 for streamed not-found responses and 404 for non-streamed ones. The throw is client-render-only; the local temporary test permits retry through sessionStorage. No query, header, environment variable or error trigger remains in the published source. A throw-once render flag is insufficient because React may automatically retry before the fallback can be checked. The temporary public fixture intentionally violates sitemap route invariants, so run its isolated browser proof, remove it and regenerate Next route types before the final full gate.
4. Remove the fixture route and temporary test after the run. Keep the probe out of the PR.

## Checks in this patch

- Focused red run failed because the new route files did not yet exist.
- `npm run test:unit -- tests/unit/route-recovery.test.tsx`: 1 file, 3 tests passed after implementation.
- `npm run typecheck`: passed.
- Scoped `npm run lint` over the five changed source and test files: passed.
- Route-level Playwright test was added but not run.
- No build, app server, browser, full unit suite, install, commit, push, PR, merge, deploy, other checkout, or vault operation was run.

## Parent checks on final source

The disposable fixture passed once on Next standalone and once on the actual WikiDO artifact under enforced CSP, including keyboard retry, heading focus, root-header retention and no visible raw error. All three owned temporary files were removed; no fixture ships. The temporary full unit run correctly failed the sitemap invariant (655 passed, one failed). Removing the fixture then produced 656 passing tests across 57 files. Stale generated Next route types still referenced the removed fixture; `next typegen` regenerated them, after which typecheck and lint passed (zero errors, existing default-export warning). Final Next/Cloudflare builds and standalone smoke passed. Final route/navigation/runtime browser proof is recorded below after completion. These are local artifact checks, not deployed behavior or human screen-reader acceptance. No main merge/deployment. Per-command unsigned candidate commits preserve global signing configuration.

Final browser evidence: 12 applicable route/navigation/runtime checks passed on each runtime, one desktop-inapplicable mobile test skipped. Initial Next unmatched-route assertion failed because robots metadata had two tags, rather than missing noindex; the final assertion examines all returned directives. The corrected unmatched-route check passed on both targets; both emitted HTTP404 and robots directives `["noindex", "index, follow"]`. This records the actual responses without claiming all streamed not-found cases have the same status. Public-route metadata and CSP crawling remain covered.
