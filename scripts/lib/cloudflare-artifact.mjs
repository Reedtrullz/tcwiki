import { createHash } from 'node:crypto';
import { lstatSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const hash = value => createHash('sha256').update(value).digest('hex');
const vars = { CSP_ENFORCE: '1', RUNTIME_METADATA_REQUIRED: '1', THORNODE_SNAPSHOT_LAG_BLOCKS: '10' };

export function assertReleaseTargets(cloudflare, vps) {
  if (![cloudflare, vps].every(value => ['0', '1'].includes(value))) throw new Error('Production target flags must be explicitly 0 or 1.');
  if (cloudflare === '1' && vps === '1') throw new Error('Production targets must be mutually exclusive.');
}

export function createCloudflareManifest(root, commit) {
  if (!/^[0-9a-f]{7,40}$/i.test(commit) || /^0+$/.test(commit)) throw new Error('Artifact commit must be a Git SHA.');
  const files = {};
  function visit(path) {
    const stat = lstatSync(join(root, path));
    if (stat.isSymbolicLink()) throw new Error(`Artifact symlink is unsupported: ${path}`);
    if (stat.isDirectory()) {
      for (const name of readdirSync(join(root, path)).sort()) visit(`${path}/${name}`);
    } else if (stat.isFile()) files[path] = hash(readFileSync(join(root, path)));
    else throw new Error(`Unsupported artifact input: ${path}`);
  }
  // This is the no_bundle deploy tree, not only its app entry. Include unused
  // files conservatively; add an exact Wrangler module inventory if size matters.
  visit('dist/server'); visit('dist/client'); visit('wrangler.do.jsonc');
  if (!files['dist/server/do-entry.mjs'] || !files['dist/server/index.js']) throw new Error('Cloudflare entry modules are missing.');
  const payload = { schemaVersion: 1, commit, workerName: 'thorchain-wiki', vars, files };
  return { ...payload, digest: hash(JSON.stringify(payload)) };
}

export function verifyCloudflareManifest(root, manifest) {
  const expected = createCloudflareManifest(root, manifest?.commit ?? '');
  if (JSON.stringify(expected) !== JSON.stringify(manifest)) throw new Error('Cloudflare artifact or deploy policy differs from the tested manifest. Rebuild and re-test it.');
  return expected;
}
