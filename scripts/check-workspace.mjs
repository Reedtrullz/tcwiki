import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { resolve, join } from 'node:path';

const args = process.argv.slice(2);
if (args.length && (args.length !== 2 || args[0] !== '--root')) {
  throw new Error('Usage: node scripts/check-workspace.mjs [--root <checkout>]');
}
const root = resolve(args[1] ?? process.cwd());
function json(path) { return existsSync(path) ? JSON.parse(readFileSync(path, 'utf8')) : null; }
const manifest = json(join(root, 'package.json'));
const lock = json(join(root, 'package-lock.json'));
if (!manifest || !lock) throw new Error('Workspace needs package.json and package-lock.json.');
const names = ['next', 'react', 'vitest', 'vinext', 'wrangler', '@cloudflare/vite-plugin'];
const packages = names.filter((name) => manifest.dependencies?.[name] || manifest.devDependencies?.[name]).map((name) => {
  const locked = lock.packages?.[`node_modules/${name}`]?.version ?? null;
  const installed = json(join(root, 'node_modules', name, 'package.json'))?.version ?? null;
  return { name, declared: manifest.dependencies?.[name] ?? manifest.devDependencies?.[name], locked, installed,
    status: !installed ? 'not-installed' : !locked ? 'missing-lock-entry' : installed === locked ? 'matched' : 'drift' };
});
function git(args) {
  const result = spawnSync('git', ['-C', root, ...args], { encoding: 'utf8' });
  return result.status === 0 ? result.stdout.trim() : null;
}
const status = git(['status', '--porcelain']);
const commit = git(['rev-parse', 'HEAD']);
const upstream = git(['rev-parse', '--abbrev-ref', '--symbolic-full-name', '@{upstream}']);
function divergence(ref) {
  if (!ref) return null;
  const counts = git(['rev-list', '--left-right', '--count', `HEAD...${ref}`]);
  if (!counts || !/^\d+\s+\d+$/.test(counts)) return null;
  const [ahead, behind] = counts.split(/\s+/).map(Number);
  return { ahead, behind };
}
const nodeSupported = Number(process.versions.node.split('.')[0]) === 22;
console.log(JSON.stringify({ root, node: process.versions.node, requiredNodeMajor: 22, nodeSupported,
  git: { commit, branch: git(['branch', '--show-current']), dirty: status === null ? null : Boolean(status),
    upstream, upstreamDivergence: divergence(upstream), mainDivergence: divergence('origin/main'),
    cachedRefs: true, error: status === null || !commit ? 'Git checkout identity unavailable' : null },
  packages, note: 'Read-only cached references: no fetch, install, cleanup, branch changes, provider probes or production certification.' }, null, 2));
if (!nodeSupported || status === null || !commit || packages.some((entry) => entry.status !== 'matched')) process.exitCode = 1;
