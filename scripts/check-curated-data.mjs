import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const source = readFileSync(join(root, 'src/lib/data/static.ts'), 'utf8');

const requiredSnippets = [
  'STATIC_DATA_LAST_UPDATED =',
  'withFreshness',
  "confidence",
  "chain: 'TRON'",
  "chain: 'SOL'",
  "chain: 'XRP'",
  'gg20-vault-exploit-2026',
  'thorfi-unwind-2025',
  'bybit-laundering-2025',
  'https://blog.thorchain.org/thorchain-exploit-report-1',
  'https://docs.thorchain.org/thornodes/archived',
  'https://messari.io/report/thorchain-q1-2025-brief',
  'https://medium.com/thorchain/thorchain-q2-2025-ecosystem-report-q3-roadmap-1f5097a086a9',
  'https://www.trmlabs.com/resources/blog/bybit-hack-update-north-korea-moves-to-next-stage-of-laundering',
];

const forbiddenSnippets = [
  "chain: 'TRX'",
  "chain: 'ARB'",
  "chain: 'MATIC'",
  "chain: 'OP'",
  'Savers program unaffected',
  'RUNE holders govern via Architecture Decision Records',
];

const failures = [];

for (const snippet of requiredSnippets) {
  if (!source.includes(snippet)) {
    failures.push(`Missing required curated-data marker: ${snippet}`);
  }
}

for (const snippet of forbiddenSnippets) {
  if (source.includes(snippet)) {
    failures.push(`Forbidden stale curated-data marker found: ${snippet}`);
  }
}

if (failures.length > 0) {
  console.error(failures.join('\n'));
  process.exit(1);
}

console.log('Curated data source/freshness smoke passed.');
