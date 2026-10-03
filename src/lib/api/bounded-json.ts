// Largest reviewed capture: Maya nodes 381,437 bytes. 2MiB allows over 5x headroom.
export const PROVIDER_MAX_BYTES = 2 * 1024 * 1024;
export const PROVIDER_MAX_ARRAY_ROWS = 4096;
export const PROVIDER_MAX_NUMERIC_CHARACTERS = 80;

function checkShape(value: unknown, depth = 0): void {
  if (depth > 64) throw new Error('Provider JSON exceeds 64 nesting levels.');
  if (typeof value === 'string') {
    if (value.length > 65536) throw new Error('Provider string exceeds 65536 characters.');
    if (value.length > PROVIDER_MAX_NUMERIC_CHARACTERS && /^-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?$/.test(value)) {
      throw new Error('Provider numeric string exceeds 80 characters.');
    }
  } else if (Array.isArray(value)) {
    if (value.length > PROVIDER_MAX_ARRAY_ROWS) throw new Error('Provider array exceeds 4096 rows.');
    for (const item of value) checkShape(item, depth + 1);
  } else if (value && typeof value === 'object') {
    for (const item of Object.values(value)) checkShape(item, depth + 1);
  }
}

export async function readProviderJson(response: Response, signal?: AbortSignal): Promise<unknown> {
  if (!response.body) throw new Error('Provider response has no JSON body.');
  const reader = response.body.getReader();
  const cancel = () => { void reader.cancel(signal?.reason).catch(() => undefined); };
  signal?.addEventListener('abort', cancel, { once: true });
  const length = response.headers.get('Content-Length');
  let size = 0;
  let text = '';
  const decoder = new TextDecoder('utf-8', { fatal: true });
  try {
    if (signal?.aborted) throw signal.reason ?? new Error('Provider read cancelled.');
    if (length !== null && (!/^\d+$/.test(length) || Number(length) > PROVIDER_MAX_BYTES)) {
      throw new Error('Provider advertised body exceeds 2097152 bytes or has invalid length.');
    }
    while (true) {
      const { value, done } = await reader.read();
      if (signal?.aborted) throw signal.reason ?? new Error('Provider read cancelled.');
      if (done) break;
      size += value.byteLength;
      if (size > PROVIDER_MAX_BYTES) throw new Error('Provider body exceeds 2097152 bytes.');
      text += decoder.decode(value, { stream: true });
    }
    // Fetch decompresses encoded bodies; their wire length differs from decoded bytes.
    if (length !== null && !response.headers.get('Content-Encoding') && Number(length) !== size) {
      throw new Error('Provider Content-Length does not match the received body.');
    }
    const data: unknown = JSON.parse(text + decoder.decode());
    checkShape(data);
    return data;
  } finally {
    signal?.removeEventListener('abort', cancel);
    void reader.cancel().catch(() => undefined);
    reader.releaseLock();
  }
}
