import { test, expect } from '@playwright/test';
import { createServer, type Server } from 'node:http';
import { readFileSync } from 'node:fs';
import { gzipSync } from 'node:zlib';
import ts from 'typescript';

async function listen(server: Server): Promise<string> {
  await new Promise<void>(resolve => server.listen(0, '127.0.0.1', resolve));
  const address = server.address();
  if (!address || typeof address === 'string') throw new Error('Test server address unavailable');
  return `http://127.0.0.1:${address.port}`;
}

test('compressed CORS provider JSON loads when Content-Encoding is not exposed', async ({ page }) => {
  const payload = { asset: 'BTC.BTC', padding: 'x'.repeat(512) };
  const encoded = gzipSync(JSON.stringify(payload));
  const origin = createServer((_request, response) => {
    response.setHeader('Content-Type', 'text/html');
    response.end('<!doctype html><title>Provider reader regression</title>');
  });
  const provider = createServer((_request, response) => {
    response.writeHead(200, {
      'Content-Type': 'application/json',
      'Content-Encoding': 'gzip',
      'Content-Length': encoded.length,
      'Access-Control-Allow-Origin': '*',
    });
    response.end(encoded);
  });
  try {
    const originUrl = await listen(origin);
    const providerUrl = await listen(provider);
    await page.goto(originUrl);
    const compiled = ts.transpileModule(readFileSync('src/lib/api/bounded-json.ts', 'utf8'), {
      compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
    }).outputText;
    await page.addScriptTag({ content: `window.providerReader = (() => { const exports = {}; ${compiled}; return exports; })();` });
    const result = await page.evaluate(async url => {
      const response = await fetch(url);
      const reader = (window as unknown as { providerReader: { readProviderJson(response: Response): Promise<unknown> } }).providerReader;
      return {
        type: response.type,
        encoding: response.headers.get('Content-Encoding'),
        advertisedLength: response.headers.get('Content-Length'),
        data: await reader.readProviderJson(response),
      };
    }, providerUrl);
    expect(result.type).toBe('cors');
    expect(result.encoding).toBeNull();
    expect(result.advertisedLength).toBe(String(encoded.length));
    expect(result.data).toEqual(payload);
  } finally {
    await Promise.all([origin, provider].map(server => new Promise<void>((resolve, reject) => {
      server.close(error => error ? reject(error) : resolve());
    })));
  }
});
