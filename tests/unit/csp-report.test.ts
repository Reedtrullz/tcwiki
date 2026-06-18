import { describe, expect, it } from 'vitest';
import { POST } from '@/app/api/csp-report/route';

describe('CSP report endpoint', () => {
  it('accepts small CSP reports without caching the response', async () => {
    const response = await POST(new Request('https://wiki.thorchain.no/api/csp-report', {
      method: 'POST',
      headers: {
        'content-type': 'application/csp-report',
      },
      body: JSON.stringify({ 'csp-report': { 'blocked-uri': 'inline' } }),
    }));

    expect(response.status).toBe(204);
    expect(response.headers.get('cache-control')).toBe('no-store');
  });

  it('rejects oversized reports before buffering them', async () => {
    const response = await POST(new Request('https://wiki.thorchain.no/api/csp-report', {
      method: 'POST',
      headers: {
        'content-length': String(16 * 1024 + 1),
        'content-type': 'application/csp-report',
      },
      body: 'x',
    }));

    expect(response.status).toBe(413);
    expect(response.headers.get('cache-control')).toBe('no-store');
  });

  it('rejects unexpected content types', async () => {
    const response = await POST(new Request('https://wiki.thorchain.no/api/csp-report', {
      method: 'POST',
      headers: {
        'content-type': 'text/plain',
      },
      body: 'not a report',
    }));

    expect(response.status).toBe(415);
  });
});
