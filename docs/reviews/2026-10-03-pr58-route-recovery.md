# PR-58 route recovery review

Reviewed against `codex/wiki-route-recovery` at baseline `40fcee397cb10b33b9b49ba82681f7e94db7461e`.

## Change

The root `error.tsx` now offers an in-place retry and keeps the root layout around it. The root `not-found.tsx` provides a useful unmatched-route explanation. Both use the same small panel, which focuses its heading, announces the message through a polite status region, and links to the wiki home, source map, and search. The error object is not rendered or logged, and existing provider-specific error states are unchanged.

The panel accepts the documented Next `retry()` callback and the installed vinext `reset()` callback. It prefers `retry` when both are present. It does not add a global error page, telemetry, route redirect, or production error trigger.

## Runtime evidence and limits

- Installed Next is 16.3.8. Its `node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/error.md` documents `retry()` as the normal recovery action; `reset()` is available for a specific state-only reset case. The installed Next error-info declaration includes both callbacks.
- The same Next guide says `error.tsx` does not catch failures in its parent layout. Root-layout failures remain outside this route-boundary scope.
- Installed vinext's `dist/shims/error-boundary.d.ts` gives error fallbacks `{ error, reset }`. In `dist/shims/error-boundary.js:146-158`, the client boundary's `reset` clears its captured error; the serialized server-error fallback at lines 12-21 uses `location.reload()`. `dist/server/app-page-route-wiring.js:684-709` installs the configured root not-found and route error boundaries. This verifies callback and file-convention support in the installed source, but this patch did not run a server or browser to prove a throw/recovery cycle on either runtime.
- Next's `node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/not-found.md` says a streamed not-found response can carry HTTP 200, while a non-streamed response carries 404; it also says root `app/not-found.js` handles unmatched URLs (line 133). The vinext not-found boundary adds `noindex` (`dist/shims/error-boundary.js:212-216`). This change makes no unconditional HTTP-status claim; the status emitted by the selected deployment runtime must be verified against its actual streamed response.

## Parent runtime proof: disposable fixture overlay

The committed route smoke test checks unmatched-route content, focus, URL retention, root header, and navigation, and records the navigation response status as a Playwright annotation. To prove that a rendering error can recover without adding a production trigger, apply this temporary overlay only in a disposable copy of the candidate checkout:

1. Add `src/app/__pr58_recovery_probe/page.tsx`:

   ```tsx
   import RecoveryProbe from './RecoveryProbe';

   export default function Page() {
     return <RecoveryProbe />;
   }
   ```

2. Add `src/app/__pr58_recovery_probe/RecoveryProbe.tsx`:

   ```tsx
   'use client';

   import { useEffect, useState } from 'react';

   let throwOnce = true;

   export default function RecoveryProbe() {
     const [armed, setArmed] = useState(false);

     useEffect(() => setArmed(true), []);

     if (armed && throwOnce) {
       throwOnce = false;
       throw new Error('PR-58 local recovery fixture');
     }

     return <p>PR-58 recovery fixture rendered successfully.</p>;
   }
   ```

3. Temporarily add this Playwright case:

   ```ts
   test('PR-58 route render errors recover in place', async ({ page }) => {
     const response = await page.goto('/__pr58_recovery_probe');
     await expect(page.getByRole('status')).toContainText('This page hit a problem');
     await expect(page.getByRole('banner')).toBeVisible();
     await page.getByRole('button', { name: 'Try again' }).click();
     await expect(page.getByText('PR-58 recovery fixture rendered successfully.')).toBeVisible();

     test.info().annotations.push({
       type: 'pr58-navigation-status',
       description: String(response?.status() ?? 'no response'),
     });
   });
   ```

   Run it against the candidate's intended runtime, including its normal CSP settings. Record the response status and whether that runtime streamed the not-found response; Next documents HTTP 200 for streamed not-found responses and 404 for non-streamed ones. The throw is client-render-only and one-shot; no query, header, environment variable, or public error endpoint controls it.
4. Remove the fixture route and temporary test after the run. Keep the probe out of the PR.

## Checks in this patch

- Focused red run failed because the new route files did not yet exist.
- `npm run test:unit -- tests/unit/route-recovery.test.tsx`: 1 file, 3 tests passed after implementation.
- `npm run typecheck`: passed.
- Scoped `npm run lint` over the five changed source and test files: passed.
- Route-level Playwright test was added but not run.
- No build, app server, browser, full unit suite, install, commit, push, PR, merge, deploy, other checkout, or vault operation was run.
