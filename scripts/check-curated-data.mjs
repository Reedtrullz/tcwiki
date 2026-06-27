import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const staticPath = join(root, 'src/lib/data/static.ts');
const typesPath = join(root, 'src/lib/types.ts');
const registryPath = join(root, 'src/lib/content/registry.ts');
const appDir = join(root, 'src/app');
const deepDiveContentDir = join(root, 'content/deep-dives');
const staticSource = readFileSync(staticPath, 'utf8');
const typesSource = readFileSync(typesPath, 'utf8');
const registrySource = readFileSync(registryPath, 'utf8');
const staticFile = ts.createSourceFile(staticPath, staticSource, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
const typesFile = ts.createSourceFile(typesPath, typesSource, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
const registryFile = ts.createSourceFile(registryPath, registrySource, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);

const failures = [];
const contentCategories = new Set(['section', 'deep-dive', 'resource']);
const expectedChains = ['BTC', 'ETH', 'BSC', 'AVAX', 'GAIA', 'DOGE', 'LTC', 'BCH', 'TRON', 'BASE', 'SOL', 'XRP'];
const forbiddenChainCodes = new Set(['TRX', 'ARB', 'MATIC', 'OP']);
const liveInboundUrl = 'https://thornode.thorchain.network/thorchain/inbound_addresses';

function fail(path, message) {
  failures.push(`${path}: ${message}`);
}

function declarationName(declaration) {
  return ts.isIdentifier(declaration.name) ? declaration.name.text : undefined;
}

function collectConstDeclarations(sourceFile) {
  const declarations = new Map();
  sourceFile.forEachChild((node) => {
    if (!ts.isVariableStatement(node)) {
      return;
    }
    for (const declaration of node.declarationList.declarations) {
      const name = declarationName(declaration);
      if (name && declaration.initializer) {
        declarations.set(name, declaration.initializer);
      }
    }
  });
  return declarations;
}

const staticDeclarations = collectConstDeclarations(staticFile);
const typeDeclarations = collectConstDeclarations(typesFile);
const registryDeclarations = collectConstDeclarations(registryFile);

function evaluate(expression, scope, path) {
  if (ts.isStringLiteral(expression) || ts.isNoSubstitutionTemplateLiteral(expression)) {
    return expression.text;
  }
  if (ts.isNumericLiteral(expression)) {
    return Number(expression.text);
  }
  if (expression.kind === ts.SyntaxKind.TrueKeyword) {
    return true;
  }
  if (expression.kind === ts.SyntaxKind.FalseKeyword) {
    return false;
  }
  if (expression.kind === ts.SyntaxKind.NullKeyword) {
    return null;
  }
  if (ts.isIdentifier(expression)) {
    if (Object.prototype.hasOwnProperty.call(scope, expression.text)) {
      return scope[expression.text];
    }
    throw new Error(`${path}: unsupported identifier ${expression.text}`);
  }
  if (ts.isArrayLiteralExpression(expression)) {
    return expression.elements.map((element, index) => evaluate(element, scope, `${path}[${index}]`));
  }
  if (ts.isObjectLiteralExpression(expression)) {
    const value = {};
    for (const property of expression.properties) {
      if (!ts.isPropertyAssignment(property)) {
        throw new Error(`${path}: unsupported object property`);
      }
      const name = ts.isIdentifier(property.name) || ts.isStringLiteral(property.name)
        ? property.name.text
        : undefined;
      if (!name) {
        throw new Error(`${path}: unsupported object key`);
      }
      value[name] = evaluate(property.initializer, scope, `${path}.${name}`);
    }
    return value;
  }
  if (ts.isAsExpression(expression) || ts.isSatisfiesExpression(expression)) {
    return evaluate(expression.expression, scope, path);
  }
  throw new Error(`${path}: unsupported expression ${ts.SyntaxKind[expression.kind]}`);
}

function getStringConst(name) {
  const initializer = staticDeclarations.get(name);
  if (!initializer) {
    throw new Error(`Missing ${name}`);
  }
  const value = evaluate(initializer, {}, name);
  if (typeof value !== 'string') {
    throw new Error(`${name} must be a string`);
  }
  return value;
}

function getDataConfidences() {
  const initializer = typeDeclarations.get('DATA_CONFIDENCES');
  if (!initializer) {
    throw new Error('Missing DATA_CONFIDENCES');
  }
  const value = evaluate(initializer, {}, 'DATA_CONFIDENCES');
  if (!Array.isArray(value) || value.some((entry) => typeof entry !== 'string')) {
    throw new Error('DATA_CONFIDENCES must be a string array');
  }
  return new Set(value);
}

function getNextReviewDueDefault() {
  const initializer = staticDeclarations.get('checkedFreshness');
  if (!initializer || !ts.isArrowFunction(initializer)) {
    throw new Error('Missing checkedFreshness arrow function');
  }
  const defaultExpression = initializer.parameters[1]?.initializer;
  if (!defaultExpression) {
    throw new Error('checkedFreshness must define a nextReviewDue default');
  }
  const value = evaluate(defaultExpression, {}, 'checkedFreshness.nextReviewDue');
  if (typeof value !== 'string') {
    throw new Error('checkedFreshness nextReviewDue default must be a string');
  }
  return value;
}

function getLiteralSourceScope(declarations) {
  const scope = {};
  for (const [name, initializer] of declarations) {
    if (!name.endsWith('Source') && !name.endsWith('Docs')) {
      continue;
    }
    try {
      const value = evaluate(initializer, scope, name);
      if (value && typeof value === 'object' && typeof value.url === 'string') {
        scope[name] = value;
      }
    } catch {
      // Non-literal constants are ignored; record validation will fail if they are referenced.
    }
  }
  return scope;
}

function getSourceScope() {
  return getLiteralSourceScope(staticDeclarations);
}

function recordKey(record, index) {
  if (record.data?.id) {
    return record.data.id;
  }
  if (record.data?.chain) {
    return record.data.chain;
  }
  if (record.data?.date && record.data?.title) {
    return `${record.data.date}:${record.data.title}`;
  }
  return String(index);
}

function readRecordArray(name, scope, staticDataLastUpdated, nextReviewDue) {
  const initializer = staticDeclarations.get(name);
  if (!initializer || !ts.isArrayLiteralExpression(initializer)) {
    throw new Error(`${name} must be an array literal`);
  }

  return initializer.elements.map((element, index) => {
    if (!ts.isCallExpression(element) || !ts.isIdentifier(element.expression) || element.expression.text !== 'record') {
      throw new Error(`${name}[${index}] must be a record(...) call`);
    }
    const [dataExpression, sourcesExpression, confidenceExpression] = element.arguments;
    if (!dataExpression || !sourcesExpression) {
      throw new Error(`${name}[${index}] must include data and sources`);
    }
    const data = evaluate(dataExpression, scope, `${name}[${index}].data`);
    const sources = evaluate(sourcesExpression, scope, `${name}[${index}].sources`);
    const confidence = confidenceExpression ? evaluate(confidenceExpression, scope, `${name}[${index}].confidence`) : 'curated';
    return {
      data,
      sources,
      freshness: {
        checkedAt: staticDataLastUpdated,
        confidence,
        nextReviewDue,
      },
    };
  });
}

function readContentEntries(scope) {
  const initializer = registryDeclarations.get('CONTENT_ENTRIES');
  if (!initializer || !ts.isArrayLiteralExpression(initializer)) {
    throw new Error('CONTENT_ENTRIES must be an array literal');
  }

  return initializer.elements.map((element, index) => evaluate(element, scope, `CONTENT_ENTRIES[${index}]`));
}

function isIsoDate(value) {
  return typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value);
}

function isHttpsUrl(value) {
  if (typeof value !== 'string' || value.length === 0) {
    return false;
  }
  try {
    return new URL(value).protocol === 'https:';
  } catch {
    return false;
  }
}

function validateUnique(collectionName, records) {
  const seen = new Map();
  records.forEach((record, index) => {
    const key = recordKey(record, index);
    if (seen.has(key)) {
      fail(`${collectionName}[${key}]`, `duplicate identifier also used at index ${seen.get(key)}`);
    }
    seen.set(key, index);
  });
}

function validateRecord(collectionName, record, index, allowedConfidences, staticDataLastUpdated) {
  const key = recordKey(record, index);
  const path = `${collectionName}[${key}]`;
  if (!record.data || typeof record.data !== 'object') {
    fail(`${path}.data`, 'missing record data');
  }
  if (!Array.isArray(record.sources) || record.sources.length === 0) {
    fail(`${path}.sources`, 'must include at least one source');
    return;
  }

  const sourceUrls = new Set();
  for (const [sourceIndex, source] of record.sources.entries()) {
    const sourcePath = `${path}.sources[${sourceIndex}]`;
    if (!source || typeof source !== 'object') {
      fail(sourcePath, 'source must be an object');
      continue;
    }
    if (typeof source.label !== 'string' || source.label.trim() === '') {
      fail(`${sourcePath}.label`, 'must be non-empty');
    }
    if (!isHttpsUrl(source.url)) {
      fail(`${sourcePath}.url`, 'must be a valid https URL');
    }
    if (sourceUrls.has(source.url)) {
      fail(`${sourcePath}.url`, 'duplicates another source URL in this record');
    }
    sourceUrls.add(source.url);
  }

  if (!record.freshness || typeof record.freshness !== 'object') {
    fail(`${path}.freshness`, 'missing freshness metadata');
    return;
  }
  if (record.freshness.checkedAt !== staticDataLastUpdated) {
    fail(`${path}.freshness.checkedAt`, `must equal STATIC_DATA_LAST_UPDATED (${staticDataLastUpdated})`);
  }
  if (!isIsoDate(record.freshness.checkedAt)) {
    fail(`${path}.freshness.checkedAt`, 'must be YYYY-MM-DD');
  }
  if (!isIsoDate(record.freshness.nextReviewDue)) {
    fail(`${path}.freshness.nextReviewDue`, 'must be YYYY-MM-DD');
  } else if (record.freshness.nextReviewDue < record.freshness.checkedAt) {
    fail(`${path}.freshness.nextReviewDue`, 'must not be before checkedAt');
  }
  if (!allowedConfidences.has(record.freshness.confidence)) {
    fail(`${path}.freshness.confidence`, `unsupported confidence ${record.freshness.confidence}`);
  }
}

function requireUrlInSources(collectionName, record, index, fieldName) {
  const value = record.data?.[fieldName];
  if (!value) {
    return;
  }
  const path = `${collectionName}[${recordKey(record, index)}].data.${fieldName}`;
  if (!isHttpsUrl(value)) {
    fail(path, 'must be a valid https URL');
    return;
  }
  const sourceUrls = new Set(record.sources.map((source) => source.url));
  if (!sourceUrls.has(value)) {
    fail(path, 'must also appear in record.sources');
  }
}

function validateChains(records) {
  const actualChains = records.map((record) => record.data.chain);
  if (actualChains.join(',') !== expectedChains.join(',')) {
    fail('CHAIN_RECORDS', `chain snapshot drifted: expected ${expectedChains.join(', ')}, got ${actualChains.join(', ')}`);
  }

  for (const [index, record] of records.entries()) {
    const path = `CHAIN_RECORDS[${recordKey(record, index)}]`;
    if (forbiddenChainCodes.has(record.data.chain)) {
      fail(`${path}.data.chain`, 'uses a stale or unsupported chain code');
    }
    if (record.data.supported === true && !record.sources.some((source) => source.url === liveInboundUrl)) {
      fail(`${path}.sources`, 'supported chain records must include live inbound_addresses source');
    }
  }
}

function validateEcosystemChains(records) {
  const allowed = new Set([...expectedChains, 'THOR']);
  for (const [index, record] of records.entries()) {
    const path = `ECOSYSTEM_PROJECT_RECORDS[${recordKey(record, index)}]`;
    if (!isHttpsUrl(record.data.url)) {
      fail(`${path}.data.url`, 'must be a valid https project URL');
    }
    if (!Array.isArray(record.data.chains) || record.data.chains.length === 0) {
      fail(`${path}.data.chains`, 'must include at least one chain');
      continue;
    }
    for (const chain of record.data.chains) {
      if (forbiddenChainCodes.has(chain)) {
        fail(`${path}.data.chains`, `uses stale chain code ${chain}`);
      }
      if (!allowed.has(chain)) {
        fail(`${path}.data.chains`, `unknown chain code ${chain}`);
      }
    }
  }
}

function routePathForHref(href) {
  if (href === '/') {
    return join(appDir, 'page.tsx');
  }
  return join(appDir, ...href.slice(1).split('/'), 'page.tsx');
}

function readDeepDiveSlugsFromMdx() {
  return readdirSync(deepDiveContentDir)
    .filter((file) => file.endsWith('.mdx'))
    .map((file) => file.replace(/\.mdx$/, ''))
    .sort();
}

function readDeepDiveSlugsFromRoutes() {
  const deepDiveRouteDir = join(appDir, 'deep-dives');
  return readdirSync(deepDiveRouteDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .filter((slug) => existsSync(join(deepDiveRouteDir, slug, 'page.tsx')))
    .sort();
}

function mdxPathForSlug(slug) {
  return join(deepDiveContentDir, `${slug}.mdx`);
}

function mdxHeadingForSlug(slug) {
  const source = readFileSync(mdxPathForSlug(slug), 'utf8');
  return source.match(/^#\s+(.+)$/m)?.[1]?.trim();
}

function normalizedTitleWords(value) {
  return value
    .toLowerCase()
    .replace(/\([^)]*\)/g, ' ')
    .replace(/\b(thorchain|deep|dive|and|the|as|in|of)\b/g, ' ')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .split(/\s+/)
    .filter(Boolean);
}

function validateRegistrySource(source, path, sourceUrls) {
  if (!source || typeof source !== 'object') {
    fail(path, 'source must be an object');
    return;
  }
  if (typeof source.label !== 'string' || source.label.trim() === '') {
    fail(`${path}.label`, 'must be non-empty');
  }
  if (!isHttpsUrl(source.url)) {
    fail(`${path}.url`, 'must be a valid https URL');
  } else if (sourceUrls.has(source.url)) {
    fail(`${path}.url`, 'duplicates another source URL in this entry');
  }
  sourceUrls.add(source.url);
}

function validateRegistryEntryShape(entry, index) {
  const path = `CONTENT_ENTRIES[${entry?.id ?? index}]`;
  if (!entry || typeof entry !== 'object') {
    fail(path, 'entry must be an object');
    return;
  }
  for (const field of ['id', 'title', 'href', 'description', 'body', 'reviewedAt']) {
    if (typeof entry[field] !== 'string' || entry[field].trim() === '') {
      fail(`${path}.${field}`, 'must be a non-empty string');
    }
  }
  if (!contentCategories.has(entry.category)) {
    fail(`${path}.category`, `must be one of ${[...contentCategories].join(', ')}`);
  }
  if (!Array.isArray(entry.tags) || entry.tags.length === 0 || entry.tags.some((tag) => typeof tag !== 'string' || tag.trim() === '')) {
    fail(`${path}.tags`, 'must include at least one non-empty tag');
  }
  if (!Array.isArray(entry.sources) || entry.sources.length === 0) {
    fail(`${path}.sources`, 'must include at least one source');
  } else {
    const sourceUrls = new Set();
    entry.sources.forEach((source, sourceIndex) => validateRegistrySource(source, `${path}.sources[${sourceIndex}]`, sourceUrls));
  }
  if (!isIsoDate(entry.reviewedAt)) {
    fail(`${path}.reviewedAt`, 'must be YYYY-MM-DD');
  }
  if (typeof entry.href === 'string') {
    if (!entry.href.startsWith('/')) {
      fail(`${path}.href`, 'must start with /');
    }
    if (entry.href.length > 1 && entry.href.endsWith('/')) {
      fail(`${path}.href`, 'must not include a trailing slash');
    }
    if (entry.href.includes('?') || entry.href.includes('#')) {
      fail(`${path}.href`, 'must not include query strings or fragments');
    }
  }
}

function validateRegistryDeepDive(entry, deepDiveMdxSlugs, deepDiveRouteSlugs) {
  const path = `CONTENT_ENTRIES[${entry.id}]`;
  if (!entry.href.startsWith('/deep-dives/')) {
    fail(`${path}.href`, 'deep-dive entries must live under /deep-dives/[slug]');
    return;
  }

  const slug = entry.href.replace('/deep-dives/', '');
  const expectedId = `deep-dive-${slug}`;
  if (entry.id !== expectedId) {
    fail(`${path}.id`, `deep-dive id must be ${expectedId}`);
  }
  if (!deepDiveMdxSlugs.has(slug)) {
    fail(`${path}.href`, `missing ${relative(root, mdxPathForSlug(slug))}`);
    return;
  }
  if (!deepDiveRouteSlugs.has(slug)) {
    fail(`${path}.href`, `missing ${relative(root, routePathForHref(entry.href))}`);
    return;
  }

  const routeSource = readFileSync(routePathForHref(entry.href), 'utf8');
  if (!routeSource.includes(`entryId="${entry.id}"`) && !routeSource.includes(`entryId='${entry.id}'`)) {
    fail(`${path}.id`, `deep-dive route must pass entryId="${entry.id}" to DeepDiveShell`);
  }
  const expectedEditPath = `content/deep-dives/${slug}.mdx`;
  if (!routeSource.includes(`editPath="${expectedEditPath}"`) && !routeSource.includes(`editPath='${expectedEditPath}'`)) {
    fail(`${path}.href`, `deep-dive route must pass editPath="${expectedEditPath}" to DeepDiveShell`);
  }

  const heading = mdxHeadingForSlug(slug);
  if (!heading) {
    fail(`${path}.href`, `${relative(root, mdxPathForSlug(slug))} must start with an H1 heading`);
    return;
  }
  const titleWords = normalizedTitleWords(entry.title);
  const headingWords = new Set(normalizedTitleWords(heading));
  const missingTitleWords = titleWords.filter((word) => !headingWords.has(word));
  if (titleWords.length > 0 && missingTitleWords.length > Math.floor(titleWords.length / 2)) {
    fail(`${path}.title`, `does not appear to match MDX heading "${heading}"`);
  }
}

function validateContentRegistry(entries) {
  const ids = new Map();
  const hrefs = new Map();
  const deepDiveMdxSlugs = new Set(readDeepDiveSlugsFromMdx());
  const deepDiveRouteSlugs = new Set(readDeepDiveSlugsFromRoutes());
  const deepDiveRegistrySlugs = new Set();

  entries.forEach((entry, index) => {
    validateRegistryEntryShape(entry, index);
    if (!entry || typeof entry !== 'object') {
      return;
    }

    const path = `CONTENT_ENTRIES[${entry.id ?? index}]`;
    if (typeof entry.id === 'string') {
      if (ids.has(entry.id)) {
        fail(`${path}.id`, `duplicates CONTENT_ENTRIES[${ids.get(entry.id)}].id`);
      }
      ids.set(entry.id, index);
    }
    if (typeof entry.href === 'string') {
      if (hrefs.has(entry.href)) {
        fail(`${path}.href`, `duplicates CONTENT_ENTRIES[${hrefs.get(entry.href)}].href`);
      }
      hrefs.set(entry.href, index);

      const routePath = routePathForHref(entry.href);
      if (!existsSync(routePath)) {
        fail(`${path}.href`, `missing route ${relative(root, routePath)}`);
      }
    }

    if (entry.category === 'deep-dive' && typeof entry.href === 'string') {
      const slug = entry.href.replace('/deep-dives/', '');
      deepDiveRegistrySlugs.add(slug);
      validateRegistryDeepDive(entry, deepDiveMdxSlugs, deepDiveRouteSlugs);
    } else if (typeof entry.href === 'string' && entry.href.startsWith('/deep-dives/')) {
      fail(`${path}.category`, 'entries under /deep-dives/[slug] must use category deep-dive');
    }
  });

  for (const slug of deepDiveMdxSlugs) {
    if (!deepDiveRegistrySlugs.has(slug)) {
      fail(`CONTENT_ENTRIES[/deep-dives/${slug}]`, `missing registry entry for ${relative(root, mdxPathForSlug(slug))}`);
    }
  }
  for (const slug of deepDiveRouteSlugs) {
    if (!deepDiveRegistrySlugs.has(slug)) {
      fail(`CONTENT_ENTRIES[/deep-dives/${slug}]`, `missing registry entry for ${relative(root, routePathForHref(`/deep-dives/${slug}`))}`);
    }
    if (!deepDiveMdxSlugs.has(slug)) {
      fail(`content/deep-dives/${slug}.mdx`, `missing MDX for ${relative(root, routePathForHref(`/deep-dives/${slug}`))}`);
    }
  }
}

const staticDataLastUpdated = getStringConst('STATIC_DATA_LAST_UPDATED');
const nextReviewDue = getNextReviewDueDefault();
const allowedConfidences = getDataConfidences();
const scope = getSourceScope();
const registryScope = getLiteralSourceScope(registryDeclarations);

const chainRecords = readRecordArray('CHAIN_RECORDS', scope, staticDataLastUpdated, nextReviewDue);
scope.chainCodes = chainRecords.map((record) => record.data.chain);

const collections = {
  CHAIN_RECORDS: chainRecords,
  ECOSYSTEM_PROJECT_RECORDS: readRecordArray('ECOSYSTEM_PROJECT_RECORDS', scope, staticDataLastUpdated, nextReviewDue),
  RESEARCH_REPORT_RECORDS: readRecordArray('RESEARCH_REPORT_RECORDS', scope, staticDataLastUpdated, nextReviewDue),
  SECURITY_INCIDENT_RECORDS: readRecordArray('SECURITY_INCIDENT_RECORDS', scope, staticDataLastUpdated, nextReviewDue),
  GOVERNANCE_PROPOSAL_RECORDS: readRecordArray('GOVERNANCE_PROPOSAL_RECORDS', scope, staticDataLastUpdated, nextReviewDue),
  PROTOCOL_MILESTONE_RECORDS: readRecordArray('PROTOCOL_MILESTONE_RECORDS', scope, staticDataLastUpdated, nextReviewDue),
};

if (!isIsoDate(staticDataLastUpdated)) {
  fail('STATIC_DATA_LAST_UPDATED', 'must be YYYY-MM-DD');
}

for (const [collectionName, records] of Object.entries(collections)) {
  validateUnique(collectionName, records);
  records.forEach((record, index) => validateRecord(collectionName, record, index, allowedConfidences, staticDataLastUpdated));
}

validateChains(collections.CHAIN_RECORDS);
validateEcosystemChains(collections.ECOSYSTEM_PROJECT_RECORDS);
validateContentRegistry(readContentEntries(registryScope));

collections.RESEARCH_REPORT_RECORDS.forEach((record, index) => requireUrlInSources('RESEARCH_REPORT_RECORDS', record, index, 'url'));
collections.SECURITY_INCIDENT_RECORDS.forEach((record, index) => requireUrlInSources('SECURITY_INCIDENT_RECORDS', record, index, 'url'));
collections.GOVERNANCE_PROPOSAL_RECORDS.forEach((record, index) => requireUrlInSources('GOVERNANCE_PROPOSAL_RECORDS', record, index, 'sourceUrl'));

if (failures.length > 0) {
  console.error(failures.join('\n'));
  process.exit(1);
}

console.log('Curated data record validation passed.');
