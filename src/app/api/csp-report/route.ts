const MAX_REPORT_BYTES = 16 * 1024;
const MAX_BODY_READ_MS = 1000;
const MAX_LOG_FIELD_LENGTH = 256;
const MAX_REPORTS_PER_REQUEST = 20;
const MAX_REPORT_ITEMS = 64;
const MAX_REPORT_DEPTH = 4;
const REPORT_LOG_WINDOW_MS = 60_000;
const MAX_UNIQUE_REPORT_LOGS_PER_WINDOW = 20;
const ACCEPTED_CONTENT_TYPES = new Set([
  'application/csp-report',
  'application/json',
  'application/reports+json',
]);

let reportWindowStartedAt = 0;
let reportWindowLogCount = 0;
const reportFingerprints = new Set<string>();

function noStoreResponse(status: number, headers: HeadersInit = {}) {
  return new Response(null, {
    status,
    headers: {
      'Cache-Control': 'no-store',
      ...headers,
    },
  });
}

function methodNotAllowedResponse() {
  return noStoreResponse(405, {
    Allow: 'POST',
  });
}

async function readBoundedBody(request: Request) {
  if (!request.body) {
    return '';
  }

  const reader = request.body.getReader();
  let totalBytes = 0;
  const chunks: Uint8Array[] = [];
  const decoder = new TextDecoder();

  const cancel = () => { void reader.cancel().catch(() => false); };
  let timer: ReturnType<typeof setTimeout> | undefined;
  const deadline = new Promise<never>((_, reject) => {
    timer = setTimeout(() => { reject(new Error('CSP report read timed out')); cancel(); }, MAX_BODY_READ_MS);
  });
  const read = async () => {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) return chunks.map((chunk, index) => decoder.decode(chunk, { stream: index < chunks.length - 1 })).join('');
      totalBytes += value.byteLength;
      if (totalBytes > MAX_REPORT_BYTES) { cancel(); throw new Error('CSP report too large'); }
      chunks.push(value);
    }
  };
  try { return await Promise.race([read(), deadline]); }
  finally { clearTimeout(timer); reader.releaseLock(); }

}

type CspReport = {
  body: Record<string, unknown>;
  documentUriFallback?: unknown;
};

function safeUrlField(value: unknown) {
  if (typeof value !== 'string' || value.length === 0) {
    return undefined;
  }

  if (['inline', 'eval', 'wasm-eval'].includes(value)) {
    return value;
  }

  try {
    const url = new URL(value);
    if (url.protocol !== 'http:' && url.protocol !== 'https:') {
      return url.protocol.slice(0, MAX_LOG_FIELD_LENGTH);
    }
    return `${url.origin}${url.pathname}`.slice(0, MAX_LOG_FIELD_LENGTH);
  } catch {
    return 'unparseable';
  }
}

function firstString(...values: unknown[]) {
  return values.find((value): value is string => typeof value === 'string' && value.length > 0)?.slice(0, MAX_LOG_FIELD_LENGTH);
}

function contentMediaType(value: string) {
  return value.split(';', 1)[0]?.trim().toLowerCase() ?? '';
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function extractCspReports(payload: unknown) {
  const reports: CspReport[] = [];
  let discarded = 0;
  let remaining = MAX_REPORT_ITEMS;
  const discard = (count = 1) => { discarded = Math.min(MAX_REPORT_BYTES, discarded + count); };
  function visit(value: unknown, depth: number) {
    if (depth > MAX_REPORT_DEPTH || remaining-- <= 0 || reports.length >= MAX_REPORTS_PER_REQUEST) { discard(); return; }
    if (Array.isArray(value)) {
      for (let i = 0; i < value.length; i += 1) {
        if (remaining <= 0 || reports.length >= MAX_REPORTS_PER_REQUEST) { discard(value.length - i); break; }
        visit(value[i], depth + 1);
      }
    } else if (isRecord(value)) {
      if (isRecord(value['csp-report'])) reports.push({ body: value['csp-report'] });
      else if (isRecord(value.body)) reports.push({ body: value.body, documentUriFallback: value.url });
      else reports.push({ body: value });
    }
  }
  visit(payload, 0);
  return { reports, discarded };
}

function shouldLogReport(event: Record<string, unknown>) {
  const now = Date.now();
  if (now - reportWindowStartedAt > REPORT_LOG_WINDOW_MS) {
    reportWindowStartedAt = now;
    reportWindowLogCount = 0;
    reportFingerprints.clear();
  }

  if (reportWindowLogCount >= MAX_UNIQUE_REPORT_LOGS_PER_WINDOW) {
    return false;
  }

  const fingerprint = [
    event.disposition,
    event.effectiveDirective,
    event.violatedDirective,
    event.blockedUri,
    event.documentUri,
    event.sourceFile,
  ].join('|');

  if (reportFingerprints.has(fingerprint)) {
    return false;
  }

  reportFingerprints.add(fingerprint);
  reportWindowLogCount += 1;
  return true;
}

function logCspReport(payload: unknown) {
  const extracted = extractCspReports(payload);
  let suppressed = extracted.discarded;
  for (const report of extracted.reports) {
    const event = {
      event: 'csp-report',
      disposition: firstString(report.body.disposition),
      effectiveDirective: firstString(report.body['effective-directive'], report.body.effectiveDirective),
      violatedDirective: firstString(report.body['violated-directive'], report.body.violatedDirective),
      blockedUri: safeUrlField(report.body['blocked-uri'] ?? report.body.blockedURL ?? report.body.blockedUri),
      documentUri: safeUrlField(
        report.body['document-uri'] ?? report.body.documentURL ?? report.body.documentUri ?? report.documentUriFallback,
      ),
      sourceFile: safeUrlField(report.body['source-file'] ?? report.body.sourceFile),
    };

    if (
      event.disposition ||
      event.effectiveDirective ||
      event.violatedDirective ||
      event.blockedUri ||
      event.documentUri ||
      event.sourceFile
    ) {
      if (shouldLogReport(event)) {
        console.warn(JSON.stringify(event));
      } else {
        suppressed += 1;
      }
    }
  }
  return Math.min(MAX_REPORT_BYTES, suppressed);
}

export async function POST(request: Request) {
  const contentLength = Number(request.headers.get('content-length') ?? '0');
  if (Number.isFinite(contentLength) && contentLength > MAX_REPORT_BYTES) {
    return noStoreResponse(413);
  }

  const contentType = request.headers.get('content-type') ?? '';
  if (contentType && !ACCEPTED_CONTENT_TYPES.has(contentMediaType(contentType))) {
    return noStoreResponse(415);
  }

  let body = '';
  try {
    body = await readBoundedBody(request);
  } catch (error) {
    return noStoreResponse(error instanceof Error && error.message === 'CSP report read timed out' ? 408 : 413);
  }

  if (body) {
    try {
      const suppressed = logCspReport(JSON.parse(body));
      return noStoreResponse(204, { 'X-CSP-Reports-Suppressed': String(suppressed) });
    } catch {
      return noStoreResponse(400);
    }
  }

  return noStoreResponse(204);
}

export function GET() {
  return methodNotAllowedResponse();
}

export function HEAD() {
  return methodNotAllowedResponse();
}
