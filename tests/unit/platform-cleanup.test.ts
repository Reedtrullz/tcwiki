import { spawnSync } from 'node:child_process';
import { existsSync, mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { afterEach, expect, it } from 'vitest';

const script = resolve('scripts/clean-platform-artifacts.mjs');
const roots: string[] = [];

function fixture() {
  const root = mkdtempSync(join(tmpdir(), 'tcwiki-cleanup-'));
  roots.push(root);
  mkdirSync(join(root, 'content'));
  spawnSync('git', ['init', '-q', root]);
  writeFileSync(join(root, 'content/guide.mdx'), 'authored');
  writeFileSync(join(root, 'content/guide (1).mdx'), 'authored');
  writeFileSync(join(root, 'content/guide (2).mdx'), 'changed WIP');
  writeFileSync(join(root, 'content/guide (3).mdx'), 'authored');
  writeFileSync(join(root, 'content/.DS_Store'), 'metadata');
  spawnSync('git', ['-C', root, 'add', 'content/guide (3).mdx']);
  return root;
}

function run(root: string, args: string[] = []) {
  return spawnSync(process.execPath, [script, ...args], { cwd: root, encoding: 'utf8' });
}

afterEach(() => {
  for (const root of roots.splice(0)) rmSync(root, { recursive: true, force: true });
});

it('reports numbered candidates without deleting authored files or OS metadata', () => {
  const root = fixture();
  const result = run(root);
  expect(result.status).toBe(0);
  for (const name of ['guide.mdx', 'guide (1).mdx', 'guide (2).mdx', 'guide (3).mdx', '.DS_Store']) {
    expect(existsSync(join(root, 'content', name))).toBe(true);
  }
  expect(result.stdout).toContain('content/guide (1).mdx');
});

it('removes only the explicitly selected identical untracked duplicate', () => {
  const root = fixture();
  const result = run(root, ['--remove', 'content/guide (1).mdx']);
  expect(result.status).toBe(0);
  expect(existsSync(join(root, 'content/guide (1).mdx'))).toBe(false);
  expect(readFileSync(join(root, 'content/guide (2).mdx'), 'utf8')).toBe('changed WIP');
  expect(existsSync(join(root, 'content/guide (3).mdx'))).toBe(true);
});

it.each(['content/guide (2).mdx', 'content/guide (3).mdx', 'content/guide.mdx'])('refuses unsafe removal of %s', (candidate) => {
  const root = fixture();
  const result = run(root, ['--remove', candidate]);
  expect(result.status).not.toBe(0);
  expect(existsSync(join(root, candidate))).toBe(true);
  expect(existsSync(join(root, 'content/guide (1).mdx'))).toBe(true);
});

it('validates every selection before deleting any file', () => {
  const root = fixture();
  const result = run(root, ['--remove', 'content/guide (1).mdx', 'content/guide (2).mdx']);
  expect(result.status).not.toBe(0);
  expect(existsSync(join(root, 'content/guide (1).mdx'))).toBe(true);
});

it('fails closed outside a Git checkout', () => {
  const root = fixture();
  rmSync(join(root, '.git'), { recursive: true });
  const result = run(root, ['--remove', 'content/guide (1).mdx']);
  expect(result.status).not.toBe(0);
  expect(existsSync(join(root, 'content/guide (1).mdx'))).toBe(true);
});
