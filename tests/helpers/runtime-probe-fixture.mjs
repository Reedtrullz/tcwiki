// Test-only virtual clock and transport; the real CLI and contracts run unchanged.
import timers from 'node:timers/promises';
import { syncBuiltinESMExports } from 'node:module';

const fixture = JSON.parse(process.env.RUNTIME_PROBE_FIXTURE);
let elapsedMs = 0;
let cancelled = 0;
const requests = [];
const signals = new WeakMap();
Object.defineProperty(performance, 'now', { value: () => elapsedMs });
timers.setTimeout = async (ms) => { elapsedMs += ms; };
syncBuiltinESMExports();
AbortSignal.timeout = (ms) => {
  const controller = new AbortController();
  signals.set(controller.signal, { ms, controller });
  return controller.signal;
};

globalThis.fetch = async (url, init) => {
  const path = new URL(url).pathname;
  const timer = signals.get(init.signal);
  if (!timer || timer.ms < 1 || timer.ms > 5000 || timer.ms > 90000 - elapsedMs) {
    throw new Error('Fixture observed missing or out-of-budget cancellation');
  }
  requests.push({ path, elapsedMs, timeoutMs: timer.ms });
  if (fixture.stalledPath === path) {
    elapsedMs += timer.ms;
    timer.controller.abort(new DOMException('Fixture timeout', 'TimeoutError'));
    cancelled += 1;
    throw init.signal.reason;
  }
  elapsedMs += Math.min(fixture.responseMs ?? 1, timer.ms);
  if (path === '/') {
    return new Response('', { headers: {
      'strict-transport-security': 'max-age=31536000',
      'x-content-type-options': 'nosniff',
      'x-frame-options': 'DENY',
      'referrer-policy': 'strict-origin-when-cross-origin',
      'permissions-policy': 'camera=(), microphone=(), geolocation=(), payment=(), usb=()',
      [fixture.enforcedCsp ? 'content-security-policy' : 'content-security-policy-report-only']:
        fixture.badCsp ? "script-src 'unsafe-inline'" : "default-src 'self'; report-uri /api/csp-report",
    } });
  }
  if (path === '/api/csp-report') {
    if (init.method !== 'POST' || init.body !== '{}') throw new Error('Unexpected CSP report request');
    return new Response(null, { status: 204, headers: { 'cache-control': 'no-store' } });
  }
  const current = elapsedMs >= (fixture.convergesAt?.[path] ?? 0);
  const identity = current ? fixture.expected : fixture.previous;
  const json = { ...(path === '/api/ready' ? fixture.ready : { status: 'healthy' }), ...identity };
  if (fixture.missingStrict) delete json.runtime;
  if (fixture.wrongArtifact) {
    json.image = `cloudflare-worker@sha256:${'d'.repeat(64)}`;
    json.runtime.image = json.image;
  }
  return Response.json(json, { status: path === '/api/ready' && !fixture.ready.ready ? 503 : 200, headers: { 'cache-control': 'no-store' } });
};

process.on('exit', () => {
  console.error('RUNTIME_FIXTURE_SUMMARY '+JSON.stringify({ elapsedMs, cancelled, requests }));
});
