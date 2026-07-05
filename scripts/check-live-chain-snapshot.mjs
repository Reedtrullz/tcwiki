import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createJiti } from 'jiti';
import { checkLiveChainSnapshot } from './lib/live-chain-snapshot.mjs';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const jiti = createJiti(import.meta.url, {
  alias: {
    '@': join(root, 'src'),
  },
  moduleCache: false,
});

const { CHAIN_RECORDS } = await jiti.import(join(root, 'src/lib/data/static.ts'));

try {
  const result = await checkLiveChainSnapshot({ chainRecords: CHAIN_RECORDS });

  for (const warning of result.warnings) {
    console.warn(`Live chain snapshot warning: ${warning}`);
  }
  for (const providerError of result.providerErrors) {
    console.warn(`Live chain snapshot fallback note: ${providerError}`);
  }

  console.log(
    `Live chain snapshot matches curated supported chains via ${result.source.label} ` +
    `at pinned THORChain height ${result.snapshotHeight} ` +
    `(latest ${result.latestHeight}, block age ${result.blockAgeSeconds} sec): ` +
    `${[...result.curatedChains].sort().join(', ')}`
  );
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
}
