import './require-node22.mjs';
import { createHash } from 'node:crypto';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createJiti } from 'jiti';
import { validateKnowledgeLinks } from './lib/knowledge-links.mjs';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const jsonPath = join(root, 'public/knowledge/v1.json');
const llmsPath = join(root, 'public/llms.txt');
mkdirSync(dirname(jsonPath), { recursive: true });
const checkOnly = process.argv.includes('--check');
const hash = (value) => createHash('sha256').update(value).digest('hex');
const jiti = createJiti(import.meta.url, { alias: { '@': join(root, 'src') }, moduleCache: false });
const [{ SECURITY_INCIDENT_RECORDS }, { CONTENT_ENTRIES, TASK_INTENT_GUIDES }, { SITE_ORIGIN }] = await Promise.all([
  jiti.import(join(root, 'src/lib/data/static.ts')),
  jiti.import(join(root, 'src/lib/content/registry.ts')),
  jiti.import(join(root, 'src/lib/site.ts')),
]);

const routeEntries = new Map(CONTENT_ENTRIES.map(entry => [entry.href, entry]));
const incident = SECURITY_INCIDENT_RECORDS.find(record => record.data.id === 'memoless-spam-2026-08');
const builderGuide = routeEntries.get('/deep-dives/build-query-data');
const governingRoute = routeEntries.get('/governance');
const taskGuide = TASK_INTENT_GUIDES.find(guide => guide.id === 'build-query');
if (!incident?.claims?.length || incident.claims.length !== 3 || !builderGuide || !governingRoute || !taskGuide) {
  throw new Error('Knowledge pilot inputs are incomplete or exceed the reviewed three-claim cohort.');
}

validateKnowledgeLinks({ entries: CONTENT_ENTRIES, claims: incident.claims, taskHref: taskGuide.href, readSource: path => readFileSync(join(root, path), 'utf8') });
const routeRefs = [governingRoute, builderGuide].map(({ id, title, href, confidence, reviewedAt, nextReviewDue, sources }) => ({
  id: `route:${id}`, registryId: id, title, href, confidence, reviewedAt, nextReviewDue,
  sources: sources.map(({ label, url, retrievedAt, notes }) => ({ label, url, retrievedAt, notes })),
}));
for (const claim of incident.claims) {
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(claim.id)) throw new Error(`Invalid stable claim ID: ${claim.id}`);
  if (!routeEntries.has('/governance') || !/^https:\/\//.test(claim.source.url)) throw new Error(`Invalid claim route or source: ${claim.id}`);
  if (claim.supersedes && !incident.claims.some(candidate => candidate.id === claim.supersedes)) throw new Error(`Missing supersession target for ${claim.id}`);
}
const inputFiles = ['src/lib/data/static.ts', 'src/lib/content/registry.ts', 'src/lib/sources.ts', 'src/lib/types.ts', 'src/lib/site.ts', 'content/deep-dives/build-query-data.mdx', 'scripts/lib/knowledge-links.mjs', 'scripts/lib/deep-dive-toc.mjs', 'src/lib/deep-dive-heading-id.mjs'];
const authoredInputs = Object.fromEntries(inputFiles.map(path => [path, hash(readFileSync(join(root, path)))]));
const generatorHash = hash(readFileSync(fileURLToPath(import.meta.url)));
const packageMetadata = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'));
const checksumPayload = {
  schemaVersion: 1,
  package: { name: packageMetadata.name, version: packageMetadata.version },
  generator: { id: 'thorchain-wiki-knowledge-export', version: 1, sha256: generatorHash },
  identity: { authoredInputs },
  entities: incident.claims.map(claim => ({
    id: `claim:${claim.id}`,
    type: 'claim',
    summary: claim.summary,
    scope: claim.scope,
    decision: claim.decision,
    recordConfidence: incident.freshness.confidence,
    observedAt: claim.observedAt,
    versionScope: claim.versionScope,
    reviewedAt: claim.reviewedAt,
    nextReviewDue: claim.nextReviewDue,
    limitation: claim.limitation,
    route: `/governance#claim-${claim.id}`,
    source: { id: `source:${hash(claim.source.url).slice(0, 16)}`, ...claim.source },
    ...(claim.supersedes ? { supersedes: `claim:${claim.supersedes}` } : {}),
  })),
  routes: routeRefs,
  relationships: [
    ...incident.claims.filter(claim => claim.supersedes).map(claim => ({ type: 'supersedes', from: `claim:${claim.id}`, to: `claim:${claim.supersedes}` })),
    { type: 'read-alongside', from: 'claim:memoless-august-cycle', to: `route:${builderGuide.id}` },
    { type: 'governed-by', from: 'claim:memoless-august-cycle', to: `route:${governingRoute.id}` },
  ],
  limitations: [
    'Metadata-only pilot; no article text, private Discord text, or copied external content is included.',
    'The historical August halt sequence remains needs-review because the cited release does not establish its chronology.',
    'Current memoless availability is not asserted; obtain fresh source-qualified operational evidence.',
    'Source and review dates are the authored claim metadata; absent dates remain unknown.',
  ],
};
const checksum = hash(JSON.stringify(checksumPayload));
const json = `${JSON.stringify({ ...checksumPayload, checksum: { algorithm: 'sha256', value: checksum } }, null, 2)}\n`;
if (Buffer.byteLength(json, 'utf8') > 256 * 1024) throw new Error('Knowledge export exceeds 256 KiB.');

const canonicalOrigin = SITE_ORIGIN;
const llms = [
  '# THORChain Wiki',
  '',
  'Registry-generated metadata pointers for builders. Article text is not redistributed here.',
  '',
  `- Knowledge JSON v1: ${canonicalOrigin}/knowledge/v1.json`,
  `- Governance incident metadata: ${canonicalOrigin}${governingRoute.href} (reviewed ${governingRoute.reviewedAt}; next review ${governingRoute.nextReviewDue})`,
  `- Build and query guide: ${canonicalOrigin}${builderGuide.href} (reviewed ${builderGuide.reviewedAt}; next review ${builderGuide.nextReviewDue})`,
  `- Builder reading path: ${canonicalOrigin}${taskGuide.href} (reviewed ${taskGuide.reviewedAt}; next review ${taskGuide.nextReviewDue})`,
  '',
  'Dates describe the authored review metadata; they do not certify current protocol state.',
  '',
].join('\n');

for (const [path, content] of [[jsonPath, json], [llmsPath, llms]]) {
  let existing = '';
  try { existing = readFileSync(path, 'utf8'); } catch (error) {
    if (error?.code !== 'ENOENT') throw error;
  }
  if (checkOnly) {
    if (existing !== content) throw new Error(`${path.slice(root.length + 1)} is stale; run npm run generate:knowledge.`);
  } else if (existing !== content) {
    writeFileSync(path, content);
  }
}
