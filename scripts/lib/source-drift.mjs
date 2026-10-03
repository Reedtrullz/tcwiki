import { createHash } from 'node:crypto';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createJiti } from 'jiti';

export const MAX_SOURCE_BODY_BYTES = 256 * 1024;
export const MAX_REDIRECTS = 3;
export const MAX_CONCURRENCY = 2;
export const REQUEST_TIMEOUT_MS = 8_000;
export const REPORT_TIMEOUT_MS = 40_000;

export const CANONICAL_SOURCE_DESCRIPTORS = [
  { id: 'network-halts', sourceKey: 'networkHaltsSource', allowedHosts: ['dev.thorchain.org'], format: 'html' },
  { id: 'fees', sourceKey: 'feesSource', allowedHosts: ['dev.thorchain.org'], format: 'html' },
  { id: 'memos', sourceKey: 'memosSource', allowedHosts: ['dev.thorchain.org'], format: 'html' },
  { id: 'swap-guide', sourceKey: 'swapGuideSource', allowedHosts: ['dev.thorchain.org'], format: 'html' },
  { id: 'dynamic-l1-fees-adr', sourceKey: 'adr026DynamicFeesSource', allowedHosts: ['gitlab.com'], format: 'markdown' },
];

const ROOT = dirname(dirname(dirname(fileURLToPath(import.meta.url))));
const HTML_CONTENT_TAGS = new Set([
  'a', 'abbr', 'article', 'b', 'blockquote', 'br', 'caption', 'cite', 'code', 'dd', 'del', 'details',
  'div', 'dl', 'dt', 'em', 'figcaption', 'figure', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'hr', 'i',
  'kbd', 'li', 'link', 'meta', 'ol', 'p', 'pre', 'q', 's', 'samp', 'section', 'small', 'span', 'strong', 'sub',
  'summary', 'sup', 'table', 'tbody', 'td', 'th', 'thead', 'tr', 'u', 'ul', 'var', 'wbr',
]);
const VOID_TAGS = new Set(['br', 'hr', 'link', 'meta', 'wbr']);
const BLOCK_TAGS = new Set([
  'article', 'blockquote', 'dd', 'div', 'dl', 'dt', 'figcaption', 'figure', 'h1', 'h2', 'h3', 'h4',
  'h5', 'h6', 'li', 'ol', 'p', 'pre', 'section', 'table', 'tr', 'ul',
]);
function unverified(note) {
  return { status: 'unverified-content', verificationNote: note };
}

function validPublicHttpsUrl(value, allowedHosts) {
  let url;
  try {
    url = new URL(value);
  } catch {
    return false;
  }
  return url.protocol === 'https:'
    && allowedHosts.includes(url.hostname)
    && (!url.port || url.port === '443')
    && !url.username
    && !url.password;
}

export function resolveCanonicalSources({
  sourceGraph,
  contentEntries,
  descriptors = CANONICAL_SOURCE_DESCRIPTORS,
}) {
  const seenIds = new Set();
  return descriptors.map((descriptor) => {
    if (!descriptor.id || seenIds.has(descriptor.id)) throw new Error(`Duplicate or missing source descriptor ID: ${descriptor.id ?? ''}`);
    seenIds.add(descriptor.id);
    const source = sourceGraph[descriptor.sourceKey];
    if (!source || typeof source.label !== 'string' || typeof source.url !== 'string') {
      throw new Error(`Canonical source key ${descriptor.sourceKey} is missing from src/lib/sources.ts`);
    }
    if (!validPublicHttpsUrl(source.url, descriptor.allowedHosts)) {
      throw new Error(`Canonical source ${descriptor.sourceKey} must use HTTPS on its allowlisted host`);
    }
    const affectedRecords = [...new Set(contentEntries
      .filter((entry) => typeof entry.id === 'string' && entry.sources?.some((item) => item.url === source.url))
      .map((entry) => entry.id))].sort();
    if (affectedRecords.length === 0) {
      throw new Error(`Canonical source ${descriptor.sourceKey} has no matching curated record ID`);
    }
    return { ...descriptor, label: source.label, url: source.url, affectedRecords };
  });
}

export async function loadCanonicalSources({ root = ROOT } = {}) {
  const absoluteRoot = root;
  const jiti = createJiti(import.meta.url, {
    alias: { '@': join(absoluteRoot, 'src') },
    moduleCache: false,
  });
  const [sourceGraph, registry] = await Promise.all([
    jiti.import(join(absoluteRoot, 'src/lib/sources.ts')),
    jiti.import(join(absoluteRoot, 'src/lib/content/registry.ts')),
  ]);
  return resolveCanonicalSources({ sourceGraph, contentEntries: registry.CONTENT_ENTRIES });
}

function decodeHtmlEntities(value) {
  return value.replace(/&(#x[\da-f]+|#\d+|amp|apos|gt|lt|nbsp|quot);/gi, (entity, name) => {
    const lower = name.toLowerCase();
    if (lower === 'amp') return '&';
    if (lower === 'apos') return "'";
    if (lower === 'gt') return '>';
    if (lower === 'lt') return '<';
    if (lower === 'nbsp') return ' ';
    if (lower === 'quot') return '"';
    const codePoint = lower.startsWith('#x') ? Number.parseInt(lower.slice(2), 16) : Number.parseInt(lower.slice(1), 10);
    if (!Number.isInteger(codePoint) || codePoint < 0 || codePoint > 0x10ffff || (codePoint >= 0xd800 && codePoint <= 0xdfff)) return entity;
    return String.fromCodePoint(codePoint);
  });
}

function normalizeWhitespace(value) {
  return value
    .replace(/\r\n?/g, '\n')
    .replace(/\u00a0/g, ' ')
    .split('\n')
    .map((line) => line.replace(/[\t\f\v ]+/g, ' ').trim())
    .join('\n')
    .replace(/\s+([.,;:!?])/g, '$1')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function readHref(attributes) {
  const match = attributes.match(/(?:^|\s)href\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/i);
  return match ? decodeHtmlEntities(match[1] ?? match[2] ?? match[3]) : undefined;
}

function normalizeHtml(body, finalUrl) {
  const candidates = ['main', 'article'].map((tag) => {
    const openings = [...body.matchAll(new RegExp(`<${tag}\\b[^>]*>`, 'gi'))];
    const closings = [...body.matchAll(new RegExp(`</${tag}\\s*>`, 'gi'))];
    const match = body.match(new RegExp(`<${tag}\\b[^>]*>([\\s\\S]*?)</${tag}\\s*>`, 'i'));
    return { tag, openings, closings, match };
  });
  const selected = candidates.find(({ tag }) => tag === 'main' && candidates[0].openings.length === 1 && candidates[0].closings.length === 1)
    ?? candidates.find(({ tag }) => tag === 'article' && candidates[1].openings.length === 1 && candidates[1].closings.length === 1);
  if (!selected?.match) return unverified('no-unique-main-or-article');
  const fragment = selected.match[1];
  if (fragment.includes('<!--')) return unverified('comment-in-content-region');
  if (/<\s*\/?\s*[a-z][^>]*(?:>|$)/i.test(fragment.replace(/<\/?[a-z][\w:-]*\b[^>]*>/gi, ''))) return unverified('malformed-markup');

  const tokens = [...fragment.matchAll(/<(\/?)([a-z][a-z\d:-]*)\b([^>]*)>/gi)];
  const stack = [];
  const links = [];
  for (const token of tokens) {
    const [, closing, rawName, attributes] = token;
    const name = rawName.toLowerCase();
    if (!HTML_CONTENT_TAGS.has(name)) return unverified(`unexpected-tag:${name}`);
    if (closing) {
      if (VOID_TAGS.has(name) || stack.pop() !== name) return unverified(`unbalanced-tag:${name}`);
      continue;
    }
    if (name === 'a') {
      const href = readHref(attributes);
      if (href) {
        let link;
        try {
          link = new URL(href, finalUrl);
        } catch {
          return unverified('invalid-link');
        }
        if (link.protocol === 'http:' || link.protocol === 'https:') links.push(link.toString());
        else if (link.protocol !== 'mailto:' && link.protocol !== 'tel:') return unverified('unsafe-link-scheme');
      }
    }
    if (!VOID_TAGS.has(name) && !/\/\s*$/.test(attributes)) stack.push(name);
  }
  if (stack.length > 0) return unverified(`unclosed-tag:${stack.at(-1)}`);

  const text = decodeHtmlEntities(fragment
    .replace(/<(br|hr|wbr)\b[^>]*>/gi, '\n')
    .replace(/<(td|th)\b[^>]*>/gi, ' | ')
    .replace(/<\/(td|th)\s*>/gi, ' | ')
    .replace(/<\/?([a-z][a-z\d:-]*)\b[^>]*>/gi, (tag, name) => BLOCK_TAGS.has(name.toLowerCase()) ? '\n' : ''));
  return { status: 'captured', normalizedText: normalizeWhitespace(text), links: [...new Set(links)].sort() };
}

function markdownOutsideCode(body) {
  const kept = [];
  let fence;
  for (const line of body.split('\n')) {
    const opening = line.match(/^ {0,3}(`{3,}|~{3,})/);
    if (!fence && opening) {
      fence = { marker: opening[1][0], length: opening[1].length };
      continue;
    }
    if (fence) {
      const closing = line.match(/^ {0,3}(`+|~+)[ \t]*$/);
      if (closing && closing[1][0] === fence.marker && closing[1].length >= fence.length) fence = undefined;
      continue;
    }
    kept.push(line);
  }
  return kept.join('\n').replace(/(`+)[^\n]*?\1/g, '');
}

function markdownMarkupNote(body) {
  const outsideCode = markdownOutsideCode(body);
  if (/<!--[\s\S]*?-->|<!doctype\b/i.test(outsideCode)) return 'html-comment-or-doctype-in-markdown';
  const paired = outsideCode.match(/<([a-z][a-z\d:-]*)\b[^>]*>[\s\S]*?<\/\1\s*>/i);
  if (paired) return `html-tag-in-markdown:${paired[1].toLowerCase()}`;
  const known = outsideCode.match(/<\/?(address|article|aside|body|br|button|canvas|div|embed|fieldset|footer|form|h[1-6]|head|header|iframe|img|input|label|link|main|map|meta|nav|noscript|object|ol|option|p|picture|script|section|select|source|style|svg|table|textarea|ul|video)\b[^>]*>/i);
  if (known) return `html-tag-in-markdown:${known[1].toLowerCase()}`;
  const attributed = outsideCode.match(/<([a-z][a-z\d:-]*)\s+[^>]*>|<([a-z][a-z\d:-]*)\s*\/\s*>/i);
  return attributed ? `html-tag-in-markdown:${(attributed[1] ?? attributed[2]).toLowerCase()}` : undefined;
}

function removeNamedMarkdownAnchors(body, finalUrl) {
  const links = [];
  let fence;
  const lines = body.split('\n').map((line) => {
    const opening = line.match(/^ {0,3}(`{3,}|~{3,})/);
    if (!fence && opening) {
      fence = { marker: opening[1][0], length: opening[1].length };
      return line;
    }
    if (fence) {
      const closing = line.match(/^ {0,3}(`+|~+)[ \t]*$/);
      if (closing && closing[1][0] === fence.marker && closing[1].length >= fence.length) fence = undefined;
      return line;
    }
    return line.replace(/(`+)[^`]*?\1|<a\s+(?:id|name)\s*=\s*(?:"([^"]+)"|'([^']+)')\s*>\s*<\/a\s*>/gi,
      (match, code, doubleQuoted, singleQuoted) => {
        if (code) return match;
        const id = decodeHtmlEntities(doubleQuoted ?? singleQuoted);
        links.push(new URL(`#${encodeURIComponent(id)}`, finalUrl).toString());
        return '';
      });
  });
  return { body: lines.join('\n'), links: [...new Set(links)].sort() };
}

function normalizeMarkdown(body, finalUrl) {
  const anchors = removeNamedMarkdownAnchors(body, finalUrl);
  const markupNote = markdownMarkupNote(anchors.body);
  if (markupNote) return unverified(markupNote);
  const normalizedText = anchors.body
    .replace(/\r\n?/g, '\n')
    .replace(/[\t ]+$/gm, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
  return { status: 'captured', normalizedText, links: anchors.links };
}

export function normalizeSourceBody({ body, format, finalUrl }) {
  if (typeof body !== 'string' || body.length === 0) return { status: 'unverified-content' };
  if (format === 'html') return normalizeHtml(body, finalUrl);
  return normalizeMarkdown(body, finalUrl);
}

export function createContentHash({ normalizedText, links }) {
  return createHash('sha256')
    .update(JSON.stringify([normalizedText, [...new Set(links)].sort()]), 'utf8')
    .digest('hex');
}

function snapshotBase(source, observedAt, status, extra = {}) {
  return { id: source.id, sourceUrl: source.url, observedAt, status, ...extra };
}

function parseRetryAfter(value, now = Date.now()) {
  if (!value) return 250;
  const seconds = Number(value);
  if (Number.isFinite(seconds) && seconds >= 0) return Math.ceil(seconds * 1000);
  const date = Date.parse(value);
  return Number.isFinite(date) ? Math.max(0, date - now) : 250;
}

function delay(milliseconds, signal) {
  if (signal?.aborted) return Promise.reject(signal.reason ?? new Error('Source report deadline exceeded'));
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      signal?.removeEventListener('abort', abort);
      resolve();
    }, milliseconds);
    function abort() {
      clearTimeout(timer);
      reject(signal.reason ?? new Error('Source report deadline exceeded'));
    }
    signal?.addEventListener('abort', abort, { once: true });
  });
}

function cancelBody(body) {
  // Cleanup runs independently of the bounded request/report deadline.
  void body?.cancel().catch(() => { console.warn('Source response body cleanup failed.'); });
}

async function waitWithinDeadline(milliseconds, signal, sleepImpl) {
  try {
    await sleepImpl(milliseconds, signal);
    return true;
  } catch (error) {
    if (signal?.aborted) return false;
    throw error;
  }
}

function isTimeout(error) {
  return error?.name === 'TimeoutError' || error?.name === 'AbortError';
}

async function requestWithRetry(url, { fetchImpl, signal, sleepImpl, requestTimeoutMs, validators }) {
  let latestStatus;
  for (let attempt = 0; attempt < 2; attempt += 1) {
    if (signal?.aborted) return { errorStatus: 'timeout' };
    try {
      const requestSignal = signal
        ? AbortSignal.any([signal, AbortSignal.timeout(requestTimeoutMs)])
        : AbortSignal.timeout(requestTimeoutMs);
      const headers = {
        accept: 'text/html, text/markdown;q=0.9, text/plain;q=0.8',
        'cache-control': 'no-cache',
      };
      if (validators?.etag) headers['if-none-match'] = validators.etag;
      if (validators?.lastModified) headers['if-modified-since'] = validators.lastModified;
      const response = await fetchImpl(url, { method: 'GET', redirect: 'manual', cache: 'no-store', headers, signal: requestSignal });
      latestStatus = response.status;
      const retryable = response.status === 429 || response.status >= 500;
      if (retryable && attempt === 0) {
        const wait = response.status === 429
          ? parseRetryAfter(response.headers.get('retry-after'))
          : 250;
        cancelBody(response.body);
        if (!await waitWithinDeadline(wait, signal, sleepImpl)) return { errorStatus: 'timeout' };
        continue;
      }
      return { response };
    } catch (error) {
      if (signal?.aborted) return { errorStatus: 'timeout' };
      if (attempt === 0) {
        if (!await waitWithinDeadline(250, signal, sleepImpl)) return { errorStatus: 'timeout' };
        continue;
      }
      return { errorStatus: isTimeout(error) ? 'timeout' : 'network-error' };
    }
  }
  return { errorStatus: latestStatus === 429 ? 'rate-limited' : latestStatus >= 500 ? 'upstream-error' : 'network-error' };
}

async function readBoundedText(response) {
  if (!response.body) return { status: 'empty-body' };
  const reader = response.body.getReader();
  const chunks = [];
  let size = 0;
  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > MAX_SOURCE_BODY_BYTES) {
        cancelBody(reader);
        return { status: 'body-too-large' };
      }
      chunks.push(value);
    }
    const bytes = new Uint8Array(size);
    let offset = 0;
    for (const chunk of chunks) {
      bytes.set(chunk, offset);
      offset += chunk.byteLength;
    }
    try {
      return { body: new TextDecoder('utf-8', { fatal: true }).decode(bytes) };
    } catch {
      return { status: 'unverified-content' };
    }
  } finally {
    cancelBody(reader);
  }
}

function mediaTypeAccepted(source, response) {
  const mediaType = (response.headers.get('content-type') ?? '').split(';', 1)[0].trim().toLowerCase();
  return source.format === 'html'
    ? mediaType === 'text/html'
    : mediaType === 'text/markdown' || mediaType === 'text/plain';
}

function redirectLocation(response, currentUrl) {
  const location = response.headers.get('location');
  if (!location) return undefined;
  try {
    return new URL(location, currentUrl).toString();
  } catch {
    return undefined;
  }
}

export async function fetchSourceSnapshot(source, {
  fetchImpl = fetch,
  sleepImpl = delay,
  now = () => new Date().toISOString(),
  requestTimeoutMs = REQUEST_TIMEOUT_MS,
  signal,
  baselineSnapshot,
} = {}) {
  let currentUrl = source.url;
  const visited = new Set([currentUrl]);
  const redirects = [];
  for (let followed = 0; ; followed += 1) {
    if (!validPublicHttpsUrl(currentUrl, source.allowedHosts)) {
      return snapshotBase(source, now(), 'redirect-rejected', { finalUrl: currentUrl, redirects });
    }
    const result = await requestWithRetry(currentUrl, {
      fetchImpl,
      signal,
      sleepImpl,
      requestTimeoutMs,
      validators: baselineSnapshot?.sourceUrl === source.url && baselineSnapshot.finalUrl === currentUrl ? baselineSnapshot : undefined,
    });
    if (result.errorStatus) return snapshotBase(source, now(), result.errorStatus, { finalUrl: currentUrl, redirects });
    const { response } = result;
    if ([301, 302, 303, 307, 308].includes(response.status)) {
      if (followed >= MAX_REDIRECTS) {
        return snapshotBase(source, now(), 'too-many-redirects', { finalUrl: currentUrl, httpStatus: response.status, redirects });
      }
      const nextUrl = redirectLocation(response, currentUrl);
      if (!nextUrl || !validPublicHttpsUrl(nextUrl, source.allowedHosts) || visited.has(nextUrl)) {
        cancelBody(response.body);
        return snapshotBase(source, now(), 'redirect-rejected', { finalUrl: nextUrl ?? currentUrl, httpStatus: response.status, redirects });
      }
      cancelBody(response.body);
      redirects.push({ status: response.status, from: currentUrl, to: nextUrl });
      visited.add(nextUrl);
      currentUrl = nextUrl;
      continue;
    }
    const metadata = {
      finalUrl: currentUrl,
      httpStatus: response.status,
      etag: response.headers.get('etag') ?? undefined,
      lastModified: response.headers.get('last-modified') ?? undefined,
      redirects,
    };
    if (response.status === 304 && baselineSnapshot?.status === 'captured' && baselineSnapshot.sourceUrl === source.url && baselineSnapshot.finalUrl === currentUrl) {
      return {
        ...baselineSnapshot,
        ...snapshotBase(source, now(), 'captured', {
          ...metadata,
          etag: metadata.etag ?? baselineSnapshot.etag,
          lastModified: metadata.lastModified ?? baselineSnapshot.lastModified,
        }),
      };
    }
    if (response.status === 429) return snapshotBase(source, now(), 'rate-limited', metadata);
    if (!response.ok) return snapshotBase(source, now(), response.status >= 500 ? 'upstream-error' : 'http-error', metadata);
    if (!mediaTypeAccepted(source, response)) return snapshotBase(source, now(), 'unverified-content', { ...metadata, verificationNote: 'unexpected-content-type' });
    let read;
    try {
      read = await readBoundedText(response);
    } catch (error) {
      return snapshotBase(source, now(), signal?.aborted || isTimeout(error) ? 'timeout' : 'network-error', metadata);
    }
    if (read.status) return snapshotBase(source, now(), read.status, metadata);
    const normalized = normalizeSourceBody({ body: read.body, format: source.format, finalUrl: currentUrl });
    if (normalized.status !== 'captured') return snapshotBase(source, now(), normalized.status, { ...metadata, verificationNote: normalized.verificationNote });
    return snapshotBase(source, now(), 'captured', {
      ...metadata,
      normalizedText: normalized.normalizedText,
      links: normalized.links,
      contentHash: createContentHash({ normalizedText: normalized.normalizedText, links: normalized.links }),
    });
  }
}

export async function captureSourceSnapshots(sources, {
  fetchImpl = fetch,
  sleepImpl = delay,
  now = () => new Date().toISOString(),
  requestTimeoutMs = REQUEST_TIMEOUT_MS,
  reportTimeoutMs = REPORT_TIMEOUT_MS,
  baseline,
} = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(new Error('Source report deadline exceeded')), reportTimeoutMs);
  const prior = new Map((baseline?.sources ?? []).map((snapshot) => [snapshot.id, snapshot]));
  const snapshots = Array(sources.length);
  let nextIndex = 0;
  async function worker() {
    while (true) {
      const index = nextIndex;
      nextIndex += 1;
      if (index >= sources.length) return;
      const source = sources[index];
      snapshots[index] = await fetchSourceSnapshot(source, {
        fetchImpl,
        sleepImpl,
        now,
        requestTimeoutMs,
        signal: controller.signal,
        baselineSnapshot: prior.get(source.id),
      });
    }
  }
  try {
    await Promise.all(Array.from({ length: Math.min(MAX_CONCURRENCY, sources.length) }, worker));
  } finally {
    clearTimeout(timer);
  }
  return { schemaVersion: 1, capturedAt: now(), sources: snapshots };
}

function indexSnapshots(snapshots = []) {
  const indexed = new Map();
  for (const snapshot of snapshots) {
    if (indexed.has(snapshot.id)) throw new Error(`Duplicate source snapshot ID: ${snapshot.id}`);
    indexed.set(snapshot.id, snapshot);
  }
  return indexed;
}

function boundedLineDiff(before = '', after = '', limit = 40) {
  const oldLines = before.split('\n');
  const newLines = after.split('\n');
  let prefix = 0;
  while (prefix < oldLines.length && prefix < newLines.length && oldLines[prefix] === newLines[prefix]) prefix += 1;
  let suffix = 0;
  while (
    suffix < oldLines.length - prefix
    && suffix < newLines.length - prefix
    && oldLines[oldLines.length - 1 - suffix] === newLines[newLines.length - 1 - suffix]
  ) suffix += 1;
  const removed = oldLines.slice(prefix, oldLines.length - suffix);
  const added = newLines.slice(prefix, newLines.length - suffix);
  return {
    removedLines: removed.slice(0, limit),
    addedLines: added.slice(0, limit),
    truncated: removed.length > limit || added.length > limit,
  };
}

function boundedSetDiff(before = [], after = [], limit = 20) {
  const beforeSet = new Set(before);
  const afterSet = new Set(after);
  const removed = [...beforeSet].filter((item) => !afterSet.has(item)).sort();
  const added = [...afterSet].filter((item) => !beforeSet.has(item)).sort();
  return {
    removed: removed.slice(0, limit),
    added: added.slice(0, limit),
    truncated: removed.length > limit || added.length > limit,
  };
}

export function buildSourceDriftReport({ sources, baseline, current }) {
  const before = indexSnapshots(baseline?.sources);
  const after = indexSnapshots(current?.sources);
  const checks = sources.map((source) => {
    const previous = before.get(source.id);
    const latest = after.get(source.id);
    const common = {
      id: source.id,
      label: source.label,
      sourceUrl: source.url,
      baselineSourceUrl: previous?.sourceUrl,
      finalUrl: latest?.finalUrl,
      httpStatus: latest?.httpStatus,
      etag: latest?.etag,
      lastModified: latest?.lastModified,
      contentHash: latest?.contentHash,
      verificationNote: latest?.verificationNote,
      baselineContentHash: previous?.contentHash,
      affectedRecords: source.affectedRecords,
      observedAt: latest?.observedAt,
      redirects: latest?.redirects ?? [],
    };
    if (!latest) return { ...common, status: 'baseline-missing', baselineStatus: previous?.status };
    if (latest.status !== 'captured') return { ...common, status: latest.status, baselineStatus: previous?.status };
    if (!previous || previous.status !== 'captured' || !previous.contentHash) {
      return { ...common, status: 'baseline-missing', baselineStatus: previous?.status };
    }
    const sourceUrlChanged = previous.sourceUrl !== source.url || latest.sourceUrl !== source.url;
    const finalUrlChanged = previous.finalUrl !== latest.finalUrl;
    const contentChanged = previous.contentHash !== latest.contentHash;
    const validatorsChanged = (previous.etag ?? '') !== (latest.etag ?? '')
      || (previous.lastModified ?? '') !== (latest.lastModified ?? '');
    const changed = sourceUrlChanged || finalUrlChanged || contentChanged;
    const contentDiff = contentChanged
      ? boundedLineDiff(previous.normalizedText, latest.normalizedText)
      : { removedLines: [], addedLines: [], truncated: false };
    const links = boundedSetDiff(previous.links, latest.links);
    const diff = {
      ...contentDiff,
      removedLinks: links.removed,
      addedLinks: links.added,
      truncated: contentDiff.truncated || links.truncated,
    };
    return {
      ...common,
      status: changed ? 'changed' : 'unchanged',
      sourceUrlChanged,
      finalUrlChanged,
      contentChanged,
      validatorsChanged,
      diff,
    };
  });
  return {
    schemaVersion: 1,
    kind: 'tcwiki-canonical-source-drift',
    generatedAt: current?.capturedAt ?? new Date().toISOString(),
    summary: {
      total: checks.length,
      changed: checks.filter(({ status }) => status === 'changed').length,
      unchanged: checks.filter(({ status }) => status === 'unchanged').length,
      baselineMissing: checks.filter(({ status }) => status === 'baseline-missing').length,
      unverified: checks.filter(({ status }) => status === 'unverified-content').length,
      unavailable: checks.filter(({ status }) => !['changed', 'unchanged', 'baseline-missing', 'unverified-content'].includes(status)).length,
    },
    checks,
  };
}

export function formatSourceDriftReport(report) {
  const lines = [
    '# Canonical source drift report',
    '',
    `Generated: ${report.generatedAt}`,
    `Sources: ${report.summary.total}; changed ${report.summary.changed}; unchanged ${report.summary.unchanged}; baseline missing ${report.summary.baselineMissing}; unverified ${report.summary.unverified}; unavailable ${report.summary.unavailable}`,
    '',
  ];
  for (const check of report.checks) {
    lines.push(`## ${check.label}: ${check.status}`, '', `- Canonical URL: ${check.sourceUrl}`);
    if (check.finalUrl) lines.push(`- Final URL: ${check.finalUrl}`);
    if (check.httpStatus !== undefined) lines.push(`- HTTP status: ${check.httpStatus}`);
    if (check.etag) lines.push(`- ETag: ${check.etag}`);
    if (check.lastModified) lines.push(`- Last-Modified: ${check.lastModified}`);
    if (check.contentHash) lines.push(`- Normalized SHA-256: ${check.contentHash}`);
    lines.push(`- Affected records: ${check.affectedRecords.join(', ') || 'none'}`);
    if (check.validatorsChanged) lines.push('- Validator metadata changed; normalized content and final URL are unchanged.');
    if (check.diff && check.status === 'changed') {
      for (const line of check.diff.removedLines) lines.push(`- Removed: ${line}`);
      for (const line of check.diff.addedLines) lines.push(`- Added: ${line}`);
      for (const link of check.diff.removedLinks) lines.push(`- Removed link: ${link}`);
      for (const link of check.diff.addedLinks) lines.push(`- Added link: ${link}`);
      if (check.diff.truncated) lines.push('- Diff output was truncated to its bound.');
    }
    lines.push('');
  }
  return `${lines.join('\n').trimEnd()}\n`;
}
