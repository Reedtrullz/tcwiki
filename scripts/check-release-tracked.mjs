import './require-node22.mjs';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { auditReleaseTrackedFiles, formatReleaseTrackedFailure } from './lib/release-tracked.mjs';

const root = dirname(dirname(fileURLToPath(import.meta.url)));

try {
  const result = auditReleaseTrackedFiles({ root });
  if (result.missingFiles.length > 0 || result.untrackedFiles.length > 0) {
    console.error(formatReleaseTrackedFailure(result));
    process.exit(1);
  }

  console.log(`Release proof trackedness passed: ${result.referencedFiles.length} referenced scripts/specs are tracked.`);
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
}
