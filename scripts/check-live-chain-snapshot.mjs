import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createJiti } from 'jiti';
import { checkLiveChainSnapshot, writeLiveChainSnapshotEvidence } from './lib/live-chain-snapshot.mjs';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const jiti = createJiti(import.meta.url, {
  alias: {
    '@': join(root, 'src'),
  },
  moduleCache: false,
});

const { CHAIN_RECORDS } = await jiti.import(join(root, 'src/lib/data/static.ts'));

function artifactPathFromArgs(args) {
  const artifactFlagIndex = args.indexOf('--artifact');
  if (artifactFlagIndex === -1) {
    return null;
  }

  const artifactPath = args[artifactFlagIndex + 1];
  if (!artifactPath || artifactPath.startsWith('--')) {
    throw new Error('--artifact requires an output path.');
  }

  return artifactPath;
}

let evidencePath = null;

async function writeEvidenceIfConfigured(evidence) {
  if (!evidencePath) {
    return;
  }

  await writeLiveChainSnapshotEvidence(evidence, evidencePath);
  console.log(`Live chain snapshot evidence written to ${evidencePath}`);
}

try {
  evidencePath = artifactPathFromArgs(process.argv.slice(2)) ??
    process.env.LIVE_CHAIN_SNAPSHOT_ARTIFACT ??
    process.env.LIVE_CHAIN_SNAPSHOT_EVIDENCE_PATH ??
    null;
  const result = await checkLiveChainSnapshot({ chainRecords: CHAIN_RECORDS });
  await writeEvidenceIfConfigured(result.evidence);

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
  if (error instanceof Error && error.evidence) {
    try {
      await writeEvidenceIfConfigured(error.evidence);
    } catch (writeError) {
      console.error(writeError instanceof Error ? writeError.message : writeError);
    }
  }
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
}
