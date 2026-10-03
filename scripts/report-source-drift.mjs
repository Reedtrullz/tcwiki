import './require-node22.mjs';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  buildSourceDriftReport,
  captureSourceSnapshots,
  formatSourceDriftReport,
  loadCanonicalSources,
} from './lib/source-drift.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const baselinePath = resolve(root, 'tests/fixtures/source-drift/baseline.json');
const args = process.argv.slice(2);
let refresh = false;
let artifactPath;

for (let index = 0; index < args.length; index += 1) {
  if (args[index] === '--refresh') {
    refresh = true;
  } else if (args[index] === '--artifact' && args[index + 1] && !args[index + 1].startsWith('--')) {
    artifactPath = args[index + 1];
    index += 1;
  } else if (args[index] === '--help') {
    console.log('Usage: npm run report:source-drift [-- --refresh] [--artifact .artifacts/path.json]\nDefault mode compares the checked-in snapshot offline. --refresh checks only the five explicit public sources and requires an artifact path.');
    process.exit(0);
  } else {
    throw new Error('Unknown source-drift option. Use --help for usage.');
  }
}

if (refresh && !artifactPath) throw new Error('--refresh requires --artifact under .artifacts/.');

let resolvedArtifact;
if (artifactPath) {
  resolvedArtifact = resolve(root, artifactPath);
  const withinArtifacts = relative(resolve(root, '.artifacts'), resolvedArtifact);
  if (!withinArtifacts || withinArtifacts.startsWith('..') || withinArtifacts.startsWith('/')) {
    throw new Error('Source drift reports can only be written under .artifacts/.');
  }
}

const [sources, baselineText] = await Promise.all([
  loadCanonicalSources({ root }),
  readFile(baselinePath, 'utf8'),
]);
const baseline = JSON.parse(baselineText);
if (baseline.schemaVersion !== 1 || !Array.isArray(baseline.sources)) {
  throw new Error('Canonical source baseline must use schemaVersion 1 and contain a sources array.');
}
const expectedIds = new Set(sources.map(({ id }) => id));
if (baseline.sources.length !== expectedIds.size || baseline.sources.some(({ id }) => !expectedIds.delete(id)) || expectedIds.size > 0) {
  throw new Error('Canonical source baseline IDs must match the five-source allowlist exactly.');
}

const current = refresh
  ? await captureSourceSnapshots(sources, { baseline })
  : baseline;
const report = buildSourceDriftReport({ sources, baseline, current });
if (!resolvedArtifact) {
  process.stdout.write(formatSourceDriftReport(report));
} else {
  const artifact = refresh ? { ...report, snapshot: current } : report;
  const json = `${JSON.stringify(artifact, null, 2)}\n`;
  if (Buffer.byteLength(json, 'utf8') > 4 * 1024 * 1024) throw new Error('Source drift artifact exceeds the 4 MiB report limit.');
  await mkdir(dirname(resolvedArtifact), { recursive: true });
  await writeFile(resolvedArtifact, json, { encoding: 'utf8', flag: 'wx' });
  console.log(`Canonical source drift ${refresh ? 'snapshot and report' : 'offline report'} saved to ${relative(root, resolvedArtifact)}.`);
}
