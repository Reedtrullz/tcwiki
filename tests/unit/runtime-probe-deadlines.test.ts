import { expect, it } from 'vitest';
import { createServer } from 'node:http';
import { spawn } from 'node:child_process';

it.each([false, true])('terminates the real release probe within its budget against a stalled provider (body started: %s)', async (bodyStarted) => {
  const server = createServer((_request, response) => {
    if (bodyStarted) {
      response.writeHead(200, { 'content-type': 'application/json' });
      response.write('{"status":');
    }
  });
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
  const address = server.address();
  if (!address || typeof address === 'string') throw new Error('Missing fixture port');
  const started = performance.now();
  const child = spawn(process.execPath, ['scripts/check-runtime-url.mjs'], { env: { ...process.env, CHECK_BASE_URL: `http://127.0.0.1:${address.port}`, RUNTIME_PROBE_BUDGET_MS: '250' } });
  let stderr = '';
  child.stderr.on('data', (data) => { stderr += String(data); });
  try {
    const code = await new Promise<number | null>((resolve, reject) => { child.on('exit', resolve); child.on('error', reject); });
    expect(code).not.toBe(0);
    expect(stderr).toContain('overall deadline exceeded');
    expect(performance.now() - started).toBeLessThan(2000);
  } finally {
    child.kill();
    server.closeAllConnections();
    await new Promise<void>((resolve) => server.close(() => resolve()));
  }
});
