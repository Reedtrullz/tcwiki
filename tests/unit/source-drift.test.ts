import { describe, expect, it } from 'vitest';

type SourceDescriptor = {
  id: string;
  sourceKey: string;
  label: string;
  url: string;
  allowedHosts: string[];
  format: 'html' | 'markdown';
  affectedRecords: string[];
};

type Snapshot = {
  id: string;
  sourceUrl: string;
  status: string;
  finalUrl?: string;
  httpStatus?: number;
  etag?: string;
  lastModified?: string;
  contentHash?: string;
  normalizedText?: string;
  links?: string[];
};

type SourceDriftModule = {
  CANONICAL_SOURCE_DESCRIPTORS: Array<Omit<SourceDescriptor, 'label' | 'url' | 'affectedRecords'>>;
  MAX_SOURCE_BODY_BYTES: number;
  MAX_REDIRECTS: number;
  MAX_CONCURRENCY: number;
  REQUEST_TIMEOUT_MS: number;
  REPORT_TIMEOUT_MS: number;
  resolveCanonicalSources(input: {
    sourceGraph: Record<string, { label: string; url: string }>;
    contentEntries: Array<{ id: string; sources: Array<{ url: string }> }>;
    descriptors?: Array<Omit<SourceDescriptor, 'label' | 'url' | 'affectedRecords'>>;
  }): SourceDescriptor[];
  normalizeSourceBody(input: { body: string; format: 'html' | 'markdown'; finalUrl: string }): {
    status: string;
    normalizedText?: string;
    links?: string[];
  };
  createContentHash(input: { normalizedText: string; links: string[] }): string;
  buildSourceDriftReport(input: {
    sources: SourceDescriptor[];
    baseline: { sources: Snapshot[] };
    current: { sources: Snapshot[] };
  }): { schemaVersion: number; kind: string; generatedAt: string; summary: Record<string, number>; checks: Array<Record<string, unknown>> };
  fetchSourceSnapshot(source: SourceDescriptor, options: {
    fetchImpl?: typeof fetch;
    sleepImpl?: (milliseconds: number, signal?: AbortSignal) => Promise<void>;
    now?: () => string;
    requestTimeoutMs?: number;
    signal?: AbortSignal;
    baselineSnapshot?: Snapshot;
  }): Promise<Snapshot>;
  captureSourceSnapshots(sources: SourceDescriptor[], options: {
    fetchImpl?: typeof fetch;
    sleepImpl?: (milliseconds: number, signal?: AbortSignal) => Promise<void>;
    now?: () => string;
    requestTimeoutMs?: number;
    reportTimeoutMs?: number;
  }): Promise<{ sources: Snapshot[] }>;
  loadCanonicalSources(options?: { root?: string }): Promise<SourceDescriptor[]>;
};

const sourceDrift = await import('../../scripts/lib/source-drift.mjs') as SourceDriftModule;

const sampleSource: SourceDescriptor = {
  id: 'halts',
  sourceKey: 'networkHaltsSource',
  label: 'Network halts',
  url: 'https://dev.thorchain.org/concepts/network-halts.html',
  allowedHosts: ['dev.thorchain.org'],
  format: 'html',
  affectedRecords: ['network', 'protocol'],
};

function snapshot(overrides: Partial<Snapshot> = {}): Snapshot {
  return {
    id: 'halts',
    sourceUrl: sampleSource.url,
    status: 'captured',
    finalUrl: sampleSource.url,
    httpStatus: 200,
    contentHash: 'baseline-hash',
    normalizedText: 'Old official wording.',
    links: [],
    ...overrides,
  };
}

describe('canonical source drift', () => {
  it('uses only the five named source-graph entries and maps them to exact curated record IDs', async () => {
    const sources = await sourceDrift.loadCanonicalSources();

    expect(sources.map(({ id }) => id)).toEqual([
      'network-halts',
      'fees',
      'memos',
      'swap-guide',
      'dynamic-l1-fees-adr',
    ]);
    expect(sources.find(({ id }) => id === 'fees')?.affectedRecords).toEqual([
      'deep-dive-build-query-data',
      'deep-dive-streaming-swaps-refunds',
      'deep-dives',
      'dynamic-fees',
      'economics',
      'glossary',
    ]);
    expect(sources.find(({ id }) => id === 'dynamic-l1-fees-adr')?.affectedRecords).toEqual([
      'dynamic-fees',
      'glossary',
    ]);
  });

  it('rejects missing source keys, non-HTTPS hosts, and sources with no curated dependents', () => {
    const descriptor = [{
      id: 'sample',
      sourceKey: 'primary',
      allowedHosts: ['docs.example.org'],
      format: 'html' as const,
    }];

    expect(() => sourceDrift.resolveCanonicalSources({
      sourceGraph: { primary: { label: 'Primary', url: 'http://docs.example.org/page' } },
      contentEntries: [{ id: 'record', sources: [{ url: 'http://docs.example.org/page' }] }],
      descriptors: descriptor,
    })).toThrow(/https/i);
    expect(() => sourceDrift.resolveCanonicalSources({
      sourceGraph: { primary: { label: 'Primary', url: 'https://docs.example.org/page' } },
      contentEntries: [],
      descriptors: descriptor,
    })).toThrow(/curated record/i);
  });

  it('ignores page chrome and harmless whitespace while retaining canonical article links', () => {
    const first = sourceDrift.normalizeSourceBody({
      body: '<header>Old nav</header><main><h1>Official source</h1><p> A   statement <a href="/policy"> policy </a>.</p></main><footer>old</footer>',
      format: 'html',
      finalUrl: sampleSource.url,
    });
    const second = sourceDrift.normalizeSourceBody({
      body: '<nav>New nav</nav>\n<main>\n  <h1>Official source</h1>\n  <p>A statement <a href="/policy">policy</a>.</p>\n</main>\n<script>new chrome</script>',
      format: 'html',
      finalUrl: sampleSource.url,
    });

    expect(first.status).toBe('captured');
    expect(second.status).toBe('captured');
    expect(first.normalizedText).toBe(second.normalizedText);
    expect(first.links).toEqual(['https://dev.thorchain.org/policy']);
    expect(sourceDrift.createContentHash({ normalizedText: first.normalizedText!, links: first.links! }))
      .toBe(sourceDrift.createContentHash({ normalizedText: second.normalizedText!, links: second.links! }));
  });

  it('marks unexpected markup inside the selected article unverified instead of stripping it', () => {
    const result = sourceDrift.normalizeSourceBody({
      body: '<main><h1>Policy</h1><script>unknown behavior</script></main>',
      format: 'html',
      finalUrl: sampleSource.url,
    });

    expect(result.status).toBe('unverified-content');
    expect(result.normalizedText).toBeUndefined();
  });

  it('keeps Markdown placeholders and fenced code while rejecting embedded HTML markup', () => {
    const content = sourceDrift.normalizeSourceBody({
      body: '# Query input\n\nUse `<asset>` in the memo.\n\n```html\n<widget>example</widget>\n```',
      format: 'markdown',
      finalUrl: 'https://gitlab.com/thorchain/thornode/-/raw/develop/docs/example.md',
    });
    const markup = sourceDrift.normalizeSourceBody({
      body: '# Query input\n\n<div>uncertain markup</div>',
      format: 'markdown',
      finalUrl: 'https://gitlab.com/thorchain/thornode/-/raw/develop/docs/example.md',
    });

    expect(content.status).toBe('captured');
    expect(content.normalizedText).toContain('<widget>example</widget>');
    expect(markup.status).toBe('unverified-content');
  });

  it('captures safe named anchors in primary Markdown without treating them as page prose', () => {
    const result = sourceDrift.normalizeSourceBody({
      body: '<a id="fee-policy"></a>\n# Dynamic fee policy\n\nCurrent behavior.',
      format: 'markdown',
      finalUrl: 'https://gitlab.com/thorchain/thornode/-/raw/develop/docs/fee-policy.md',
    });

    expect(result.status).toBe('captured');
    expect(result.normalizedText).toBe('# Dynamic fee policy\n\nCurrent behavior.');
    expect(result.links).toEqual(['https://gitlab.com/thorchain/thornode/-/raw/develop/docs/fee-policy.md#fee-policy']);
  });

  it('reports a content and link change with the exact affected records and a bounded useful diff', () => {
    const report = sourceDrift.buildSourceDriftReport({
      sources: [sampleSource],
      baseline: { sources: [snapshot()] },
      current: { sources: [snapshot({
        contentHash: 'changed-hash',
        normalizedText: 'New official wording.',
        links: ['https://dev.thorchain.org/new-policy'],
        etag: '"new"',
      })] },
    });
    const check = report.checks[0];

    expect(report.kind).toBe('tcwiki-canonical-source-drift');
    expect(check.status).toBe('changed');
    expect(check.affectedRecords).toEqual(['network', 'protocol']);
    expect(check.diff).toMatchObject({
      removedLines: ['Old official wording.'],
      addedLines: ['New official wording.'],
      removedLinks: [],
      addedLinks: ['https://dev.thorchain.org/new-policy'],
    });
  });

  it('treats validator rotation as metadata while flagging a changed final URL', () => {
    const validatorOnly = sourceDrift.buildSourceDriftReport({
      sources: [sampleSource],
      baseline: { sources: [snapshot({ etag: '"old"' })] },
      current: { sources: [snapshot({ etag: '"new"' })] },
    }).checks[0];
    const redirected = sourceDrift.buildSourceDriftReport({
      sources: [sampleSource],
      baseline: { sources: [snapshot()] },
      current: { sources: [snapshot({ finalUrl: `${sampleSource.url}?version=2` })] },
    }).checks[0];

    expect(validatorOnly.status).toBe('unchanged');
    expect(validatorOnly.validatorsChanged).toBe(true);
    expect(redirected.status).toBe('changed');
    expect(redirected.finalUrlChanged).toBe(true);
  });

  it('follows only bounded HTTPS redirects on the source allowlist and retains redirect status evidence', async () => {
    const requests: string[] = [];
    const fetchImpl = async (input: RequestInfo | URL) => {
      const url = String(input);
      requests.push(url);
      if (requests.length === 1) return new Response(null, { status: 302, headers: { location: '/current' } });
      return new Response('<main><p>Current policy.</p></main>', {
        headers: { 'content-type': 'text/html', etag: '"policy-v3"' },
      });
    };
    const captured = await sourceDrift.fetchSourceSnapshot(sampleSource, { fetchImpl, now: () => '2026-10-03T00:00:00.000Z' });

    expect(requests).toEqual([sampleSource.url, 'https://dev.thorchain.org/current']);
    expect(captured).toMatchObject({
      status: 'captured',
      httpStatus: 200,
      finalUrl: 'https://dev.thorchain.org/current',
      etag: '"policy-v3"',
    });

    const rejected = await sourceDrift.fetchSourceSnapshot(sampleSource, {
      fetchImpl: async () => new Response(null, { status: 301, headers: { location: 'http://outside.example/path' } }),
    });
    expect(rejected.status).toBe('redirect-rejected');

    let redirectAttempts = 0;
    const redirectLimit = await sourceDrift.fetchSourceSnapshot(sampleSource, {
      fetchImpl: async () => {
        redirectAttempts += 1;
        return new Response(null, { status: 302, headers: { location: `/hop-${redirectAttempts}` } });
      },
    });
    expect(redirectLimit.status).toBe('too-many-redirects');
    expect(redirectAttempts).toBe(4);
  });

  it('retries 429 once after Retry-After and retries a timed-out request once', async () => {
    const waits: number[] = [];
    let rateAttempts = 0;
    const success = () => new Response('# Official policy\n\nCurrent text.', { headers: { 'content-type': 'text/plain' } });
    const rateLimited = await sourceDrift.fetchSourceSnapshot({ ...sampleSource, format: 'markdown' }, {
      fetchImpl: async () => ++rateAttempts === 1
        ? new Response('rate limited', { status: 429, headers: { 'retry-after': '2' } })
        : success(),
      sleepImpl: async (milliseconds) => { waits.push(milliseconds); },
    });
    let timeoutAttempts = 0;
    const recovered = await sourceDrift.fetchSourceSnapshot({ ...sampleSource, format: 'markdown' }, {
      fetchImpl: async () => {
        if (++timeoutAttempts === 1) throw Object.assign(new Error('request deadline'), { name: 'TimeoutError' });
        return success();
      },
      sleepImpl: async (milliseconds) => { waits.push(milliseconds); },
    });

    expect(rateAttempts).toBe(2);
    expect(waits).toContain(2000);
    expect(rateLimited.status).toBe('captured');
    expect(timeoutAttempts).toBe(2);
    expect(recovered.status).toBe('captured');

    let exhaustedAttempts = 0;
    const exhausted = await sourceDrift.fetchSourceSnapshot({ ...sampleSource, format: 'markdown' }, {
      fetchImpl: async () => {
        exhaustedAttempts += 1;
        throw Object.assign(new Error('request deadline'), { name: 'TimeoutError' });
      },
      sleepImpl: async () => {},
    });
    expect(exhausted.status).toBe('timeout');
    expect(exhaustedAttempts).toBe(2);
  });

  it('returns timeout evidence when Retry-After exceeds the whole-report deadline', async () => {
    const result = await sourceDrift.captureSourceSnapshots([sampleSource], {
      fetchImpl: async () => new Response('rate limited', { status: 429, headers: { 'retry-after': '3600' } }),
      reportTimeoutMs: 15,
    });
    expect(result.sources[0].status).toBe('timeout');
  });

  it('retains partial-body timeout evidence instead of discarding the whole report', async () => {
    const result = await sourceDrift.captureSourceSnapshots([sampleSource], {
      fetchImpl: async (_url, options) => new Response(new ReadableStream({
        start(controller) {
          controller.enqueue(new TextEncoder().encode('<main>'));
          options?.signal?.addEventListener('abort', () => controller.error(new DOMException('Request expired', 'AbortError')), { once: true });
        },
      }), { headers: { 'content-type': 'text/html' } }),
      reportTimeoutMs: 15,
    });
    expect(result.sources[0].status).toBe('timeout');
    expect(result.sources[0].contentHash).toBeUndefined();
  });

  it('never reuses a 304 baseline belonging to another canonical URL', async () => {
    let conditional: HeadersInit | undefined;
    const result = await sourceDrift.fetchSourceSnapshot(sampleSource, {
      baselineSnapshot: snapshot({ sourceUrl: 'https://dev.thorchain.org/old', etag: 'old' }),
      fetchImpl: async (_url, options) => { conditional = options?.headers; return new Response(null, { status: 304 }); },
    });
    expect(new Headers(conditional).get('if-none-match')).toBeNull();
    expect(result.status).toBe('http-error');
    expect(result.contentHash).toBeUndefined();
  });

  it('rejects decoded bodies over 256 KiB and keeps unverified responses out of the hash', async () => {
    const oversized = await sourceDrift.fetchSourceSnapshot(sampleSource, {
      fetchImpl: async () => new Response(`<main>${'x'.repeat(262144)}</main>`, { headers: { 'content-type': 'text/html' } }),
    });
    const unexpected = await sourceDrift.fetchSourceSnapshot(sampleSource, {
      fetchImpl: async () => new Response('<main><widget>new</widget></main>', { headers: { 'content-type': 'text/html' } }),
    });

    expect(sourceDrift.MAX_SOURCE_BODY_BYTES).toBe(262144);
    expect(oversized.status).toBe('body-too-large');
    expect(unexpected.status).toBe('unverified-content');
    expect(unexpected.contentHash).toBeUndefined();
  });

  it('keeps capture concurrency and total runtime budgets bounded', async () => {
    let active = 0;
    let maximumActive = 0;
    const sources = Array.from({ length: 5 }, (_, index) => ({
      ...sampleSource,
      id: `source-${index}`,
      url: `https://dev.thorchain.org/${index}`,
      affectedRecords: [`record-${index}`],
    }));
    await sourceDrift.captureSourceSnapshots(sources, {
      fetchImpl: async () => {
        active += 1;
        maximumActive = Math.max(maximumActive, active);
        await new Promise((resolve) => setTimeout(resolve, 5));
        active -= 1;
        return new Response('<main><p>Content.</p></main>', { headers: { 'content-type': 'text/html' } });
      },
    });

    expect(maximumActive).toBe(2);
    expect(sourceDrift.MAX_CONCURRENCY).toBe(2);
    expect(sourceDrift.REQUEST_TIMEOUT_MS).toBe(8000);
    expect(sourceDrift.REPORT_TIMEOUT_MS).toBe(40000);
    expect(sourceDrift.MAX_REDIRECTS).toBe(3);

    const deadline = await sourceDrift.captureSourceSnapshots([sampleSource], {
      reportTimeoutMs: 5,
      requestTimeoutMs: 1000,
      fetchImpl: async (_url, init) => new Promise((_resolve, reject) => {
        init?.signal?.addEventListener('abort', () => reject(new Error('aborted')), { once: true });
      }),
    });
    expect(deadline.sources[0].status).toBe('timeout');
  });
});
