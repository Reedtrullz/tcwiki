import './require-node22.mjs';
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { dirname, resolve, relative } from 'node:path';
import { captureContracts, compareContracts } from './lib/upstream-contracts.mjs';

const args = process.argv.slice(2);
const mode = args[0];
const output = args[1];
if (!['--capture', '--report'].includes(mode) || !output || output.startsWith('--')) {
  throw new Error('Usage: node scripts/check-upstream-contracts.mjs --capture|--report OUTPUT.json (capture is opt-in; never overwrites canonical fixtures).');
}
const relativeOutput = relative(resolve('.artifacts'), resolve(output));
if (!relativeOutput || relativeOutput.startsWith('..') || relativeOutput.startsWith('/')) throw new Error('Write captures/reports under .artifacts/ for review; canonical fixtures are updated manually.');
const capture = await captureContracts();
const baseline = JSON.parse(await readFile(new URL('../tests/fixtures/upstream/v1.json', import.meta.url), 'utf8'));
const changes = compareContracts(baseline, capture);
const result = mode === '--capture' ? capture : { ...capture, changes };
await mkdir(dirname(output), { recursive: true });
await writeFile(output, `${JSON.stringify(result, null, 2)}\n`, { flag: 'wx' });
for (const item of changes.filter((item) => item.status !== 'unchanged')) {
  console.warn(`Upstream contract ${item.id}: ${item.status}; removed=${(item.removed ?? []).join(', ')}; added=${(item.added ?? []).join(', ')}`);
}
console.log(`Upstream contract ${mode.slice(2)} saved to ${output}; provider failures and shape differences are review evidence, not offline parser-test failures.`);
