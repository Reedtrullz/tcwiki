import './require-node22.mjs';
import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import { createCloudflareManifest, verifyCloudflareManifest, assertReleaseTargets } from './lib/cloudflare-artifact.mjs';

const path = '.artifacts/cloudflare-manifest.json';
try {
  if (process.argv.includes('--targets')) {
    assertReleaseTargets(process.env.TCWIKI_CLOUDFLARE_DEPLOY_ENABLED, process.env.TCWIKI_VPS_DEPLOY_ENABLED);
  } else {
    const manifest = process.argv.includes('--write')
      ? createCloudflareManifest(process.cwd(), process.env.GITHUB_SHA ?? execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim())
      : verifyCloudflareManifest(process.cwd(), JSON.parse(readFileSync(path, 'utf8')));
    if (process.argv.includes('--write')) {
      const { mkdirSync } = await import('node:fs'); mkdirSync('.artifacts', { recursive: true });
      writeFileSync(path, `${JSON.stringify(manifest, null, 2)}\n`);
    }
    if (!process.argv.includes('--write') && process.env.GITHUB_SHA && manifest.commit !== process.env.GITHUB_SHA) throw new Error('Artifact commit differs from this release.');
    const image = `cloudflare-worker@sha256:${manifest.digest}`;
    if (process.env.EXPECTED_IMAGE_REF && image !== process.env.EXPECTED_IMAGE_REF) throw new Error('Artifact digest differs from the tested candidate.');
    console.log(process.argv.includes('--github-output') ? `worker_ref=${image}` : image);
  }
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error)); process.exit(1);
}
