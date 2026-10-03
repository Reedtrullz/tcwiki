import { spawnSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { afterEach, expect, it } from 'vitest';
const roots: string[] = [];
function fixture(installed: string | null) {
  const root = mkdtempSync(join(tmpdir(), 'tcwiki-preflight-')); roots.push(root);
  writeFileSync(join(root, 'package.json'), JSON.stringify({ devDependencies: { vitest: '^5.0.0' } }));
  writeFileSync(join(root, 'package-lock.json'), JSON.stringify({ packages: { 'node_modules/vitest': { version: '5.0.0' } } }));
  if (installed) {
    mkdirSync(join(root, 'node_modules/vitest'), { recursive: true });
    writeFileSync(join(root, 'node_modules/vitest/package.json'), JSON.stringify({ version: installed }));
  }
  writeFileSync(join(root, '.gitignore'), 'node_modules/\n');
  spawnSync('git', ['init', '-q', '-b', 'main', root]);
  spawnSync('git', ['-C', root, 'add', '.']);
  spawnSync('git', ['-C', root, '-c', 'commit.gpgsign=false', '-c', 'user.name=Fixture', '-c', 'user.email=fixture@example.invalid', 'commit', '-q', '-m', 'baseline']);
  spawnSync('git', ['-C', root, 'remote', 'add', 'origin', 'https://example.invalid/fixture.git']);
  spawnSync('git', ['-C', root, 'update-ref', 'refs/remotes/origin/main', 'HEAD']);
  spawnSync('git', ['-C', root, 'config', 'branch.main.remote', 'origin']);
  spawnSync('git', ['-C', root, 'config', 'branch.main.merge', 'refs/heads/main']);
  return root;
}
function run(root: string) { return spawnSync(process.execPath, [resolve('scripts/check-workspace.mjs'), '--root', root], { encoding: 'utf8' }); }
afterEach(() => { for (const root of roots.splice(0)) rmSync(root, { recursive: true, force: true }); });
it('reports locked versus installed drift without modifying the manifest', () => {
  const root = fixture('4.0.0'); const before = readFileSync(join(root, 'package.json'), 'utf8');
  const result = run(root);
  expect(result.stdout).toContain('"drift"');
  expect(JSON.parse(result.stdout).packages[0]).toMatchObject({ name: 'vitest', locked: '5.0.0', installed: '4.0.0' });
  expect(result.status).toBe(1);
  expect(readFileSync(join(root, 'package.json'), 'utf8')).toBe(before);
});
it('distinguishes a missing install from a mismatched version', () => {
  const result = run(fixture(null));
  expect(result.stdout).toContain('"not-installed"');
  expect(result.status).toBe(1);
});
it('accepts matching installed and locked versions', () => {
  const result = run(fixture('5.0.0'));
  expect(result.status).toBe(0);
  expect(JSON.parse(result.stdout).packages[0].status).toBe('matched');
});

it('reports unavailable Git as unknown and fails the preflight', () => {
  const root = fixture('5.0.0'); rmSync(join(root, '.git'), { recursive: true });
  const result = run(root);
  expect(result.status).toBe(1);
  expect(JSON.parse(result.stdout).git.dirty).toBeNull();
});
it('reports cached upstream divergence without fetching or switching branches', () => {
  const root = fixture('5.0.0'); writeFileSync(join(root, 'change.txt'), 'changed');
  spawnSync('git', ['-C', root, 'add', 'change.txt']);
  spawnSync('git', ['-C', root, '-c', 'commit.gpgsign=false', '-c', 'user.name=Fixture', '-c', 'user.email=fixture@example.invalid', 'commit', '-q', '-m', 'ahead']);
  const result = run(root);
  expect(JSON.parse(result.stdout).git.upstreamDivergence).toEqual({ ahead: 1, behind: 0 });
  expect(JSON.parse(result.stdout).git.dirty).toBe(false);
});
