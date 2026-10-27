# Runtime performance baseline (proposal PR-26, issue #191)

## Scope and measured decision

This candidate adds an explicitly requested local measurement lane and browser-only marks around existing Lunr index construction. It collects no reader queries and changes no search ranking, chart loading, caching or Durable Object architecture. It builds on PR247 and includes the offline search corpus from PR245.

The measured mixed requests do not demonstrate a material content serialization problem: reference pages finish while readiness reads remain in flight. Retain the baseline before considering architectural changes. Search construction takes about 83–95 ms on this machine; this is a useful investigation signal, not proof of reader impact on slower devices.

## Reproduction and limits

Build each target, start its existing candidate launcher with CSP enforcement, then run `WIKI_PERF_REPORT=1 PLAYWRIGHT_BASE_URL=http://127.0.0.1:PORT PLAYWRIGHT_RUNTIME=next|cloudflare CSP_ENFORCE=1 npm run test:e2e -- tests/performance-baseline.spec.ts --project=chromium --workers=1 --reporter=line`. The Cloudflare launcher exercises the actual WikiDO artifact and validates its manifest. The ordinary CI lane skips this hardware-dependent measurement; no timing threshold can turn an unrelated runner speed into a product failure.

The committed Next and Cloudflare JSON files contain artifact receipt hashes, runtime identity response, device, query timings, every captured asset size and every mixed request result. Conditions: Apple M1 Pro, ten logical CPUs, 16 GiB RAM, Darwin 27.2, Chromium 153.0.8010.12, loopback, no CPU/network throttling, fresh contexts and disabled browser HTTP cache. One sample per runtime; no other owned browser/build loop ran during the samples, while a separate bounded unit/typecheck task could run. Unrelated machine activity was not controlled. Upstream readiness cache state was not assumed cold.

Decoded response bodies and modeled gzip/Brotli sizes are recorded; these are not negotiated wire bytes. Asset collection includes browser prefetch during the 500 ms observation window. The Cloudflare home window includes a 94 ms search-construction mark, so those assets must not be interpreted as exclusively required home-route code. Fill/submit-to-results timings include automation overhead. These samples are not production percentiles, Core Web Vitals, INP, screen-reader timing or evidence of globally safe DO concurrency.

The Next identity endpoint returned development/unknown metadata; its exact input receipt hash identifies this local built artifact, but the response does not establish verified release identity. Cloudflare returned manifest-bound immutable artifact metadata; `verified` means validation, not attestation.

## Observations

| Measurement | Next | Actual WikiDO |
|---|---:|---:|
| Search construction on search page | 86.2 ms | 82.7 ms |
| Home/search/stats heading visible | 355/377/200 ms | 529/236/162 ms |
| Three submitted query journeys | 107/140/56 ms | 157/157/59 ms |
| Initial mixed reference responses | 107–111 ms | 97–125 ms |
| Initial mixed readiness responses | about 3.42 s | about 3.18 s |
| Warm mixed batch total | 78 ms | 95 ms |

The mixed batch contains four reference requests and four readiness requests, concurrently. Readiness returned contract-valid 503 responses in these samples; that is retained degraded evidence, not healthy production readiness. Home/search/stats observed modeled gzip asset totals are approximately 266/336/392 kB on Next and 540/426/407 kB on WikiDO. Read the JSON for exact paths and byte counts before attributing a size to a dependency or route. A production trace and a representative slower device are needed before selecting prebuilt indexes, deferred charts or caching changes.

## Verification

Both target builds and Next standalone smoke passed. The explicit baseline test passed once per runtime. The 31 focused search unit tests, typecheck and lint passed (zero lint errors; existing Cloudflare default-export warning). Another 21 runtime/search/network browser checks passed on each target with enforced CSP. No main merge, deployment or production benchmarking occurred. Candidate commits use per-command unsigned Git because the interactive signer is unavailable; global signing configuration is preserved.
