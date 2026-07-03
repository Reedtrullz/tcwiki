import { afterEach, describe, expect, it, vi } from 'vitest';
import { POST } from '@/app/api/csp-report/route';

describe('CSP report endpoint', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('accepts small CSP reports without caching the response', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const response = await POST(new Request('https://wiki.thorchain.no/api/csp-report', {
      method: 'POST',
      headers: {
        'content-type': 'application/csp-report',
      },
      body: JSON.stringify({
        'csp-report': {
          'blocked-uri': 'https://evil.example/path?token=secret',
          'document-uri': 'https://wiki.thorchain.no/search?q=secret',
          'violated-directive': 'script-src',
        },
      }),
    }));

    expect(response.status).toBe(204);
    expect(response.headers.get('cache-control')).toBe('no-store');
    expect(warn).toHaveBeenCalledTimes(1);
    const logged = JSON.parse(String(warn.mock.calls[0][0]));
    expect(logged).toMatchObject({
      event: 'csp-report',
      blockedUri: 'https://evil.example/path',
      documentUri: 'https://wiki.thorchain.no/search',
      violatedDirective: 'script-src',
    });
  });

  it('logs every report in a Reporting API batch with redacted URL fields', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const response = await POST(new Request('https://wiki.thorchain.no/api/csp-report', {
      method: 'POST',
      headers: {
        'content-type': 'application/reports+json',
      },
      body: JSON.stringify([
        {
          type: 'csp-violation',
          url: 'https://wiki.thorchain.no/fallback?token=top-level',
          body: {
            blockedURL: 'https://cdn.example/scripts/app.js?token=blocked',
            documentURL: 'https://wiki.thorchain.no/search?q=secret',
            effectiveDirective: 'script-src-elem',
            sourceFile: 'https://wiki.thorchain.no/_next/static/chunks/app.js?cache=secret',
          },
        },
        {
          type: 'csp-violation',
          url: 'https://wiki.thorchain.no/network?session=secret',
          body: {
            blockedURL: 'data:text/html,token=secret',
            disposition: 'report',
            effectiveDirective: 'style-src',
          },
        },
      ]),
    }));

    expect(response.status).toBe(204);
    expect(response.headers.get('cache-control')).toBe('no-store');
    expect(warn).toHaveBeenCalledTimes(2);

    const logged = warn.mock.calls.map(([line]) => JSON.parse(String(line)));
    expect(logged).toEqual([
      {
        event: 'csp-report',
        effectiveDirective: 'script-src-elem',
        blockedUri: 'https://cdn.example/scripts/app.js',
        documentUri: 'https://wiki.thorchain.no/search',
        sourceFile: 'https://wiki.thorchain.no/_next/static/chunks/app.js',
      },
      {
        event: 'csp-report',
        disposition: 'report',
        effectiveDirective: 'style-src',
        blockedUri: 'data:',
        documentUri: 'https://wiki.thorchain.no/network',
      },
    ]);
    expect(warn.mock.calls.join('\n')).not.toContain('?');
    expect(warn.mock.calls.join('\n')).not.toContain('secret');
    expect(warn.mock.calls.join('\n')).not.toContain('token=');
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

  it('rejects malformed JSON and keeps empty reports quiet with no-store responses', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const response = await POST(new Request('https://wiki.thorchain.no/api/csp-report', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
      },
      body: '{not-json',
    }));
    const emptyResponse = await POST(new Request('https://wiki.thorchain.no/api/csp-report', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
      },
      body: '',
    }));

    expect(response.status).toBe(400);
    expect(response.headers.get('cache-control')).toBe('no-store');
    expect(emptyResponse.status).toBe(204);
    expect(emptyResponse.headers.get('cache-control')).toBe('no-store');
    expect(warn).not.toHaveBeenCalled();
  });
});
