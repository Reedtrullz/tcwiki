const MAX_REPORT_BYTES = 16 * 1024;

function noStoreResponse(status: number) {
  return new Response(null, {
    status,
    headers: {
      'Cache-Control': 'no-store',
    },
  });
}

async function drainBoundedBody(request: Request) {
  if (!request.body) {
    return;
  }

  const reader = request.body.getReader();
  let totalBytes = 0;

  for (;;) {
    const { done, value } = await reader.read();
    if (done) {
      return;
    }
    totalBytes += value.byteLength;
    if (totalBytes > MAX_REPORT_BYTES) {
      await reader.cancel();
      throw new Error('CSP report too large');
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

  try {
    await drainBoundedBody(request);
  } catch {
    return noStoreResponse(413);
  }

  return noStoreResponse(204);
}
