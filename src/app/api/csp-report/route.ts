const MAX_REPORT_BYTES = 16 * 1024;
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

  for (;;) {
    const { done, value } = await reader.read();
    if (done) {
      return chunks.map((chunk, index) => decoder.decode(chunk, { stream: index < chunks.length - 1 })).join('');
    }
    totalBytes += value.byteLength;
    if (totalBytes > MAX_REPORT_BYTES) {
      await reader.cancel();
      throw new Error('CSP report too large');
    }
    chunks.push(value);
  }
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
      return url.protocol;
    }
    return `${url.origin}${url.pathname}`;
  } catch {
    return 'unparseable';
  }
}

function firstString(...values: unknown[]) {
  return values.find((value): value is string => typeof value === 'string' && value.length > 0);
}

function contentMediaType(value: string) {
  return value.split(';', 1)[0]?.trim().toLowerCase() ?? '';
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function extractCspReports(payload: unknown): CspReport[] {
  if (Array.isArray(payload)) {
    return payload.flatMap((entry) => extractCspReports(entry));
  }

  if (!isRecord(payload)) {
    return [];
  }

  if (isRecord(payload['csp-report'])) {
    return [{ body: payload['csp-report'] }];
  }

  if (isRecord(payload.body)) {
    return [{ body: payload.body, documentUriFallback: payload.url }];
  }

  return [{ body: payload }];
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
  for (const report of extractCspReports(payload)) {
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
      }
    }
  }
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
  } catch {
    return noStoreResponse(413);
  }

  if (body) {
    try {
      logCspReport(JSON.parse(body));
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
