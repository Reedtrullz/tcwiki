import { createHash } from 'node:crypto';
import { existsSync, lstatSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join, relative } from 'node:path';

const sourceRoots = [
  'content', 'public', 'src', 'next.config.ts', 'package-lock.json', 'package.json',
  'postcss.config.mjs', 'tsconfig.json', 'scripts/build-standalone.mjs',
  'scripts/lib/standalone-freshness.mjs', 'scripts/prepare-standalone-assets.mjs',
  'scripts/start-standalone.mjs', 'scripts/require-node22.mjs', 'scripts/lib/node-version.mjs',
];
const sha256 = (bytes) => createHash('sha256').update(bytes).digest('hex');
const serverPath = (root) => join(root, '.next/standalone/server.js');
const receiptPath = (root) => join(root, '.next/standalone/.tcwiki-inputs.json');

export function captureStandaloneInputs(root) {
  const files = {};
  function visit(path) {
    const local = relative(root, path).split('\\').join('/');
    if (!existsSync(path)) { files[local] = null; return; }
    const stat = lstatSync(path);
    if (stat.isSymbolicLink()) throw new Error(`Cannot fingerprint symlink build input: ${local}`);
    if (stat.isDirectory()) {
      for (const name of readdirSync(path).sort()) {
        if (local !== 'public' && !local.startsWith('public/') && ['.DS_Store', 'AGENTS.md', 'README.md'].includes(name)) continue;
        visit(join(path, name));
      }
    } else if (stat.isFile()) files[local] = sha256(readFileSync(path));
  }
  for (const path of sourceRoots) visit(join(root, path));
  return Object.fromEntries(Object.entries(files).sort(([a], [b]) => a.localeCompare(b)));
}

function changedInputs(before, after) {
  return [...new Set([...Object.keys(before), ...Object.keys(after)])]
    .filter((path) => before[path] !== after[path]).sort();
}

export function recordStandaloneInputs(root, before = captureStandaloneInputs(root)) {
  const changed = changedInputs(before, captureStandaloneInputs(root));
  if (changed.length) throw new Error(`Build inputs changed during compilation: ${changed.join(', ')}`);
  const receipt = { schemaVersion: 1, files: before, serverSha256: sha256(readFileSync(serverPath(root))) };
  writeFileSync(receiptPath(root), `${JSON.stringify(receipt, null, 2)}\n`);
}

export function checkStandaloneFreshness(root) {
  if (!existsSync(serverPath(root))) throw new Error('Standalone build is missing. Run `npm run build`.');
  if (!existsSync(receiptPath(root))) throw new Error('Standalone input receipt is missing. Run `npm run build`.');
  const receipt = JSON.parse(readFileSync(receiptPath(root), 'utf8'));
  if (receipt?.schemaVersion !== 1 || !receipt.files || typeof receipt.files !== 'object' || Array.isArray(receipt.files)) {
    throw new Error('Standalone input receipt is invalid. Run `npm run build`.');
  }
  if (receipt.serverSha256 !== sha256(readFileSync(serverPath(root)))) {
    throw new Error('Standalone server artifact differs from its build receipt. Run `npm run build`.');
  }
  const changed = changedInputs(receipt.files, captureStandaloneInputs(root));
  if (changed.length) throw new Error(`Standalone build is stale; changed/missing inputs: ${changed.join(', ')}. Run \`npm run build\`.`);
}
