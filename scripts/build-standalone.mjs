import './require-node22.mjs';
import { execFileSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { captureStandaloneInputs, recordStandaloneInputs } from './lib/standalone-freshness.mjs';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const inputs = captureStandaloneInputs(root);
execFileSync(process.execPath, [join(root, 'node_modules/next/dist/bin/next'), 'build', ...process.argv.slice(2)], {
  cwd: root, stdio: 'inherit',
});
recordStandaloneInputs(root, inputs);
