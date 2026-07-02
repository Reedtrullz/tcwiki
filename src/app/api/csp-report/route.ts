const MAX_REPORT_BYTES = 16 * 1024;

function noStoreResponse(status: number) {
  return new Response(null, {
    status,
    headers: {
      'Cache-Control': 'no-store',
    },
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
      console.warn(JSON.stringify(event));
    }
  }
}

export async function POST(request: Request) {
  const contentLength = Number(request.headers.get('content-length') ?? '0');
  if (Number.isFinite(contentLength) && contentLength > MAX_REPORT_BYTES) {
    return noStoreResponse(413);
  }

  const contentType = request.headers.get('content-type') ?? '';
  if (
    contentType &&
    !contentType.includes('application/csp-report') &&
    !contentType.includes('application/reports+json') &&
    !contentType.includes('application/json')
  ) {
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
