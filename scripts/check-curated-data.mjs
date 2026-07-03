import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createJiti } from 'jiti';
import ts from 'typescript';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const jiti = createJiti(import.meta.url, {
  alias: {
    '@': join(root, 'src'),
  },
  moduleCache: false,
});
const { SEARCH_DOCUMENTS: actualSearchDocuments } = await jiti.import(join(root, 'src/lib/search/registry.ts'));
const { DEEP_DIVE_TOC: actualDeepDiveToc } = await jiti.import(join(root, 'src/lib/content/registry.ts'));
const staticPath = join(root, 'src/lib/data/static.ts');
const typesPath = join(root, 'src/lib/types.ts');
const registryPath = join(root, 'src/lib/content/registry.ts');
const glossaryPath = join(root, 'src/lib/content/glossary.ts');
const searchRegistryPath = join(root, 'src/lib/search/registry.ts');
const generatedSearchPath = join(root, 'src/lib/search/mdx-documents.generated.ts');
const ecosystemFilterPath = join(root, 'src/components/features/EcosystemFilterList.tsx');
const appDir = join(root, 'src/app');
const deepDiveContentDir = join(root, 'content/deep-dives');
const staticSource = readFileSync(staticPath, 'utf8');
const typesSource = readFileSync(typesPath, 'utf8');
const registrySource = readFileSync(registryPath, 'utf8');
const glossarySource = readFileSync(glossaryPath, 'utf8');
const searchRegistrySource = readFileSync(searchRegistryPath, 'utf8');
const generatedSearchSource = readFileSync(generatedSearchPath, 'utf8');
const staticFile = ts.createSourceFile(staticPath, staticSource, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
const typesFile = ts.createSourceFile(typesPath, typesSource, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
const registryFile = ts.createSourceFile(registryPath, registrySource, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
const glossaryFile = ts.createSourceFile(glossaryPath, glossarySource, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
const searchRegistryFile = ts.createSourceFile(searchRegistryPath, searchRegistrySource, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
const generatedSearchFile = ts.createSourceFile(generatedSearchPath, generatedSearchSource, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);

const failures = [];
const contentCategories = new Set(['section', 'deep-dive', 'resource']);
const expectedChains = ['BTC', 'ETH', 'BSC', 'AVAX', 'GAIA', 'DOGE', 'LTC', 'BCH', 'TRON', 'BASE', 'SOL', 'XRP'];
const forbiddenChainCodes = new Set(['TRX', 'ARB', 'MATIC', 'OP']);
const liveInboundUrl = 'https://thornode.thorchain.network/thorchain/inbound_addresses';
const contentCheckToday = process.env.CONTENT_CHECK_TODAY ?? new Date().toISOString().slice(0, 10);
const allowOverdueContent = process.env.ALLOW_OVERDUE_CONTENT === '1';

function fail(path, message) {
  failures.push(`${path}: ${message}`);
}

function validateReviewDueDate(value, path) {
  if (!allowOverdueContent && isIsoDate(value) && value < contentCheckToday) {
    fail(path, `is overdue as of ${contentCheckToday}; refresh the content or set ALLOW_OVERDUE_CONTENT=1 with release evidence`);
  }
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
const glossaryDeclarations = collectConstDeclarations(glossaryFile);
const searchRegistryDeclarations = collectConstDeclarations(searchRegistryFile);
const generatedSearchDeclarations = collectConstDeclarations(generatedSearchFile);

function slugifyFragment(value) {
  return value
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function recordAnchor(prefix, id) {
  return slugifyFragment(`${prefix}-${id}`);
}

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
  if (
    ts.isCallExpression(expression) &&
    ts.isPropertyAccessExpression(expression.expression) &&
    expression.expression.name.text === 'join' &&
    expression.arguments.length <= 1
  ) {
    const value = evaluate(expression.expression.expression, scope, `${path}.join`);
    if (!Array.isArray(value)) {
      throw new Error(`${path}: join target must be an array`);
    }
    const separator = expression.arguments[0] ? evaluate(expression.arguments[0], scope, `${path}.join.separator`) : ',';
    if (typeof separator !== 'string') {
      throw new Error(`${path}: join separator must be a string`);
    }
    return value.join(separator);
  }
  if (ts.isAsExpression(expression) || ts.isSatisfiesExpression(expression)) {
    return evaluate(expression.expression, scope, path);
  }
  if (
    ts.isCallExpression(expression) &&
    ts.isIdentifier(expression.expression) &&
    expression.expression.text === 'slugifyFragment' &&
    expression.arguments.length === 1
  ) {
    const value = evaluate(expression.arguments[0], scope, `${path}.slugifyFragment`);
    if (typeof value !== 'string') {
      throw new Error(`${path}: slugifyFragment argument must be a string`);
    }
    return slugifyFragment(value);
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

function readGlossaryTerms(scope) {
  const initializer = glossaryDeclarations.get('GLOSSARY_TERMS');
  if (!initializer || !ts.isArrayLiteralExpression(initializer)) {
    throw new Error('GLOSSARY_TERMS must be an array literal');
  }

  return initializer.elements.map((element, index) => evaluate(element, scope, `GLOSSARY_TERMS[${index}]`));
}

function readConstArray(declarations, name) {
  const initializer = declarations.get(name);
  if (!initializer || !ts.isArrayLiteralExpression(initializer)) {
    throw new Error(`${name} must be an array literal`);
  }

  return evaluate(initializer, {}, name);
}

function readOperationalSearchDocuments() {
  return readConstArray(searchRegistryDeclarations, 'OPERATIONAL_HALT_SEARCH_DOCUMENTS');
}

function readGeneratedSearchDocuments() {
  return readConstArray(generatedSearchDeclarations, 'MDX_SEARCH_DOCUMENTS');
}

function readActualSearchDocuments() {
  if (!Array.isArray(actualSearchDocuments)) {
    throw new Error('SEARCH_DOCUMENTS must be an exported array');
  }
  return actualSearchDocuments;
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
  } else {
    validateReviewDueDate(record.freshness.nextReviewDue, `${path}.freshness.nextReviewDue`);
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

function validateSourceMapSections(records) {
  for (const [index, record] of records.entries()) {
    const path = `SOURCE_MAP_SECTION_RECORDS[${recordKey(record, index)}]`;
    for (const field of ['id', 'title', 'use', 'caveat']) {
      if (typeof record.data?.[field] !== 'string' || record.data[field].trim() === '') {
        fail(`${path}.data.${field}`, 'must be a non-empty string');
      }
    }
    if (!Array.isArray(record.data?.links) || record.data.links.length === 0) {
      fail(`${path}.data.links`, 'must include at least one source link');
      continue;
    }

    const sourceUrls = new Set(record.sources.map((source) => source.url));
    const linkUrls = new Set();
    record.data.links.forEach((link, linkIndex) => {
      validateRegistrySource(link, `${path}.data.links[${linkIndex}]`, linkUrls);
      if (isHttpsUrl(link.url) && !sourceUrls.has(link.url)) {
        fail(`${path}.data.links[${linkIndex}].url`, 'must also appear in record.sources');
      }
    });
  }
}

function validateSecurityIncidentTrackerStatus(records) {
  const allowedTrackerStatuses = new Set(['current', 'needs-review', 'historical-open']);
  for (const [index, record] of records.entries()) {
    const path = `SECURITY_INCIDENT_RECORDS[${recordKey(record, index)}].data`;
    const status = record.data?.trackerStatus;
    if (status !== undefined && !allowedTrackerStatuses.has(status)) {
      fail(`${path}.trackerStatus`, `unsupported tracker status ${status}`);
    }
    if (record.data?.resolved === false && status === undefined) {
      fail(`${path}.trackerStatus`, 'unresolved incidents must declare current, needs-review, or historical-open');
    }
    if (record.data?.resolved === true && status !== undefined) {
      fail(`${path}.trackerStatus`, 'resolved incidents must not declare current tracker status');
    }
  }
}

function splitInternalHref(href) {
  if (typeof href !== 'string') {
    return { path: href, anchor: undefined, hasExtraFragment: false };
  }
  const [path, anchor, ...extraFragments] = href.split('#');
  return {
    path,
    anchor,
    hasExtraFragment: extraFragments.length > 0,
  };
}

function routePathForHref(href) {
  const { path } = splitInternalHref(href);
  if (path === '/') {
    return join(appDir, 'page.tsx');
  }
  return join(appDir, ...path.slice(1).split('/'), 'page.tsx');
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

function mdxAnchorsForSlug(slug) {
  const source = readFileSync(mdxPathForSlug(slug), 'utf8');
  const anchors = new Set();
  for (const match of source.matchAll(/^#{2,3}\s+(.+)$/gm)) {
    anchors.add(slugifyHeading(match[1]));
  }
  return anchors;
}

function slugifyHeading(value) {
  return slugifyFragment(value.trim());
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

function validateRegistryEntryShape(entry, index, allowedConfidences) {
  const path = `CONTENT_ENTRIES[${entry?.id ?? index}]`;
  if (!entry || typeof entry !== 'object') {
    fail(path, 'entry must be an object');
    return;
  }
  for (const field of ['id', 'title', 'href', 'description', 'body', 'reviewedAt', 'nextReviewDue']) {
    if (typeof entry[field] !== 'string' || entry[field].trim() === '') {
      fail(`${path}.${field}`, 'must be a non-empty string');
    }
  }
  if (!allowedConfidences.has(entry.confidence)) {
    fail(`${path}.confidence`, `unsupported confidence ${entry.confidence}`);
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
  if (!isIsoDate(entry.nextReviewDue)) {
    fail(`${path}.nextReviewDue`, 'must be YYYY-MM-DD');
  } else if (isIsoDate(entry.reviewedAt) && entry.nextReviewDue < entry.reviewedAt) {
    fail(`${path}.nextReviewDue`, 'must not be before reviewedAt');
  } else {
    validateReviewDueDate(entry.nextReviewDue, `${path}.nextReviewDue`);
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

  const toc = actualDeepDiveToc?.[entry.id] ?? [];
  if (!Array.isArray(toc)) {
    fail(`${path}.toc`, 'deep-dive table of contents must be an array');
    return;
  }
  const mdxAnchors = mdxAnchorsForSlug(slug);
  toc.forEach((item, itemIndex) => {
    const tocPath = `DEEP_DIVE_TOC[${entry.id}][${itemIndex}]`;
    if (!item || typeof item !== 'object') {
      fail(tocPath, 'TOC item must be an object');
      return;
    }
    if (typeof item.title !== 'string' || item.title.trim() === '') {
      fail(`${tocPath}.title`, 'must be a non-empty string');
    }
    if (typeof item.href !== 'string' || !item.href.startsWith('#') || item.href.length < 2) {
      fail(`${tocPath}.href`, 'must be a non-empty fragment link');
      return;
    }
    const anchor = item.href.slice(1);
    if (!mdxAnchors.has(anchor)) {
      fail(`${tocPath}.href`, `unknown MDX heading anchor ${item.href} in ${relative(root, mdxPathForSlug(slug))}`);
    }
  });
}

function validateContentRegistry(entries, allowedConfidences) {
  const ids = new Map();
  const hrefs = new Map();
  const deepDiveMdxSlugs = new Set(readDeepDiveSlugsFromMdx());
  const deepDiveRouteSlugs = new Set(readDeepDiveSlugsFromRoutes());
  const deepDiveRegistrySlugs = new Set();

  entries.forEach((entry, index) => {
    validateRegistryEntryShape(entry, index, allowedConfidences);
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

function validateGlossaryTerms(terms, allowedConfidences) {
  const ids = new Map();
  terms.forEach((term, index) => {
    const path = `GLOSSARY_TERMS[${term?.id ?? index}]`;
    if (!term || typeof term !== 'object') {
      fail(path, 'term must be an object');
      return;
    }
    for (const field of ['id', 'term', 'definition', 'category', 'reviewedAt', 'nextReviewDue']) {
      if (typeof term[field] !== 'string' || term[field].trim() === '') {
        fail(`${path}.${field}`, 'must be a non-empty string');
      }
    }
    if (term.id !== slugifyFragment(term.term)) {
      fail(`${path}.id`, 'must be slugified from term');
    }
    if (ids.has(term.id)) {
      fail(`${path}.id`, `duplicates GLOSSARY_TERMS[${ids.get(term.id)}].id`);
    }
    ids.set(term.id, index);
    if (!allowedConfidences.has(term.confidence)) {
      fail(`${path}.confidence`, `unsupported confidence ${term.confidence}`);
    }
    if (!isIsoDate(term.reviewedAt)) {
      fail(`${path}.reviewedAt`, 'must be YYYY-MM-DD');
    }
    if (!isIsoDate(term.nextReviewDue)) {
      fail(`${path}.nextReviewDue`, 'must be YYYY-MM-DD');
    } else if (isIsoDate(term.reviewedAt) && term.nextReviewDue < term.reviewedAt) {
      fail(`${path}.nextReviewDue`, 'must not be before reviewedAt');
    } else {
      validateReviewDueDate(term.nextReviewDue, `${path}.nextReviewDue`);
    }
    if (!Array.isArray(term.sources) || term.sources.length === 0) {
      fail(`${path}.sources`, 'must include at least one source');
    }
    if (!Array.isArray(term.relatedHrefs) || term.relatedHrefs.length === 0) {
      fail(`${path}.relatedHrefs`, 'must include at least one related route');
    }
  });
}

function addRouteAnchor(anchorsByRoute, route, anchor) {
  if (!anchorsByRoute.has(route)) {
    anchorsByRoute.set(route, new Set());
  }
  anchorsByRoute.get(route).add(anchor);
}

function collectKnownRouteAnchors(collections, glossaryTerms) {
  const anchorsByRoute = new Map();

  for (const record of collections.SECURITY_INCIDENT_RECORDS) {
    addRouteAnchor(anchorsByRoute, '/governance', recordAnchor('incident', record.data.id));
  }
  for (const record of collections.RESEARCH_REPORT_RECORDS) {
    addRouteAnchor(anchorsByRoute, '/governance', recordAnchor('research', record.data.id));
  }
  for (const record of collections.GOVERNANCE_PROPOSAL_RECORDS) {
    addRouteAnchor(anchorsByRoute, '/governance', recordAnchor('governance', record.data.id));
  }
  for (const record of collections.PROTOCOL_MILESTONE_RECORDS) {
    addRouteAnchor(anchorsByRoute, '/governance', recordAnchor('milestone', `${record.data.date}-${record.data.title}`));
  }
  for (const record of collections.ECOSYSTEM_PROJECT_RECORDS) {
    addRouteAnchor(anchorsByRoute, '/ecosystem', recordAnchor('ecosystem', record.data.id));
  }
  for (const record of collections.SOURCE_MAP_SECTION_RECORDS) {
    addRouteAnchor(anchorsByRoute, '/docs', record.data.id);
  }
  for (const term of glossaryTerms) {
    addRouteAnchor(anchorsByRoute, '/glossary', `term-${term.id}`);
    addRouteAnchor(anchorsByRoute, '/glossary', term.category);
  }

  return anchorsByRoute;
}

const routeAnchorCache = new Map();

function readStaticRouteAnchors(route) {
  if (routeAnchorCache.has(route)) {
    return routeAnchorCache.get(route);
  }
  const anchors = new Set();
  const routePath = routePathForHref(route);
  if (!existsSync(routePath)) {
    routeAnchorCache.set(route, anchors);
    return anchors;
  }
  const source = readFileSync(routePath, 'utf8');
  const idPattern = /\bid\s*=\s*["']([A-Za-z0-9_-]+)["']/g;
  for (const match of source.matchAll(idPattern)) {
    anchors.add(match[1]);
  }
  routeAnchorCache.set(route, anchors);
  return anchors;
}

function validateInternalHref(href, path, anchorsByRoute) {
  if (typeof href !== 'string' || href.trim() === '') {
    fail(path, 'must be a non-empty internal href');
    return;
  }
  if (!href.startsWith('/') || href.startsWith('//')) {
    fail(path, 'must start with a single /');
    return;
  }
  if (href.includes('?')) {
    fail(path, 'must not include query strings');
  }

  const { path: route, anchor, hasExtraFragment } = splitInternalHref(href);
  if (!route || route.length === 0) {
    fail(path, 'must include an internal route');
    return;
  }
  if (route.length > 1 && route.endsWith('/')) {
    fail(path, 'must not include a trailing slash');
  }

  const routePath = routePathForHref(route);
  if (!existsSync(routePath)) {
    fail(path, `missing route ${relative(root, routePath)}`);
    return;
  }

  if (hasExtraFragment) {
    fail(path, 'must not include multiple fragments');
  }
  if (anchor === undefined) {
    return;
  }
  if (anchor.trim() === '') {
    fail(path, 'must not include an empty anchor');
    return;
  }

  const knownAnchors = anchorsByRoute.get(route);
  const staticAnchors = readStaticRouteAnchors(route);
  if (!knownAnchors?.has(anchor) && !staticAnchors.has(anchor)) {
    fail(path, `unknown anchor #${anchor} for ${route}`);
  }
}

function validateSearchDocumentMetadata(doc, path, allowedConfidences) {
  if (!doc || typeof doc !== 'object') {
    fail(path, 'search document must be an object');
    return;
  }
  for (const field of ['id', 'slug', 'href', 'type', 'title', 'description', 'content']) {
    if (typeof doc[field] !== 'string' || doc[field].trim() === '') {
      fail(`${path}.${field}`, 'must be a non-empty string');
    }
  }
  if (!allowedConfidences.has(doc.confidence)) {
    fail(`${path}.confidence`, `unsupported confidence ${doc.confidence}`);
  }
  if (!isIsoDate(doc.reviewedAt)) {
    fail(`${path}.reviewedAt`, 'must be YYYY-MM-DD');
  }
  if (!isIsoDate(doc.nextReviewDue)) {
    fail(`${path}.nextReviewDue`, 'must be YYYY-MM-DD');
  } else if (isIsoDate(doc.reviewedAt) && doc.nextReviewDue < doc.reviewedAt) {
    fail(`${path}.nextReviewDue`, 'must not be before reviewedAt');
  } else {
    validateReviewDueDate(doc.nextReviewDue, `${path}.nextReviewDue`);
  }
  if (!Array.isArray(doc.sources) || doc.sources.length === 0) {
    fail(`${path}.sources`, 'must include at least one source');
    return;
  }
  const sourceUrls = new Set();
  doc.sources.forEach((source, sourceIndex) => validateRegistrySource(source, `${path}.sources[${sourceIndex}]`, sourceUrls));
}

function buildExpectedAnchoredSearchDocuments(collections, glossaryTerms) {
  return [
    ...collections.SECURITY_INCIDENT_RECORDS.map((record) => {
      const anchor = recordAnchor('incident', record.data.id);
      return {
        id: `incident:${record.data.id}`,
        href: `/governance#${anchor}`,
        type: 'incident',
        anchor,
      };
    }),
    ...collections.ECOSYSTEM_PROJECT_RECORDS.map((record) => {
      const anchor = recordAnchor('ecosystem', record.data.id);
      return {
        id: `ecosystem:${record.data.id}`,
        href: `/ecosystem#${anchor}`,
        type: 'ecosystem',
        anchor,
      };
    }),
    ...collections.SOURCE_MAP_SECTION_RECORDS.map((record) => ({
      id: `source-map:${record.data.id}`,
      href: `/docs#${record.data.id}`,
      type: 'source-map',
      anchor: record.data.id,
    })),
    ...collections.RESEARCH_REPORT_RECORDS.map((record) => {
      const anchor = recordAnchor('research', record.data.id);
      return {
        id: `research:${record.data.id}`,
        href: `/governance#${anchor}`,
        type: 'research',
        anchor,
      };
    }),
    ...collections.GOVERNANCE_PROPOSAL_RECORDS.map((record) => {
      const anchor = recordAnchor('governance', record.data.id);
      return {
        id: `governance:${record.data.id}`,
        href: `/governance#${anchor}`,
        type: 'governance',
        anchor,
      };
    }),
    ...collections.PROTOCOL_MILESTONE_RECORDS.map((record) => {
      const anchor = recordAnchor('milestone', `${record.data.date}-${record.data.title}`);
      return {
        id: `milestone:${record.data.date}:${record.data.title}`,
        href: `/governance#${anchor}`,
        type: 'milestone',
        anchor,
      };
    }),
    ...glossaryTerms.map((term) => {
      const anchor = `term-${term.id}`;
      return {
        id: `glossary:${term.id}`,
        href: `/glossary#${anchor}`,
        type: 'glossary',
        anchor,
      };
    }),
  ];
}

function expectSearchDoc(docsById, id, path) {
  const doc = docsById.get(id);
  if (!doc) {
    fail(path, 'missing from actual SEARCH_DOCUMENTS export');
  }
  return doc;
}

function validateExpectedSearchCoverage(searchDocuments, collections, contentEntries, glossaryTerms) {
  const docsById = new Map();
  searchDocuments.forEach((doc, index) => {
    if (typeof doc?.id === 'string') {
      docsById.set(doc.id, doc);
    } else {
      fail(`SEARCH_DOCUMENTS[${index}].id`, 'must be a string before coverage validation');
    }
  });

  readOperationalSearchDocuments().forEach((expected) => {
    const path = `SEARCH_DOCUMENTS[${expected.id}]`;
    const doc = expectSearchDoc(docsById, expected.id, path);
    if (!doc) {
      return;
    }
    if (doc.href !== expected.href) {
      fail(`${path}.href`, `must be ${expected.href}`);
    }
    if (doc.type !== expected.type) {
      fail(`${path}.type`, `must be ${expected.type}`);
    }
  });

  contentEntries.forEach((entry) => {
    const path = `SEARCH_DOCUMENTS[${entry.id}]`;
    const doc = expectSearchDoc(docsById, entry.id, path);
    if (!doc) {
      return;
    }
    if (doc.href !== entry.href) {
      fail(`${path}.href`, `must be ${entry.href}`);
    }
    if (doc.type !== entry.category) {
      fail(`${path}.type`, `must be ${entry.category}`);
    }
    if (doc.confidence !== entry.confidence) {
      fail(`${path}.confidence`, `must be ${entry.confidence}`);
    }
    if (doc.reviewedAt !== entry.reviewedAt) {
      fail(`${path}.reviewedAt`, `must be ${entry.reviewedAt}`);
    }
    if (doc.nextReviewDue !== entry.nextReviewDue) {
      fail(`${path}.nextReviewDue`, `must be ${entry.nextReviewDue}`);
    }
  });

  const contentEntrySlugs = new Set(contentEntries.map((entry) => entry.href));
  readGeneratedSearchDocuments()
    .filter((doc) => !contentEntrySlugs.has(doc.slug))
    .forEach((expected) => {
      const path = `SEARCH_DOCUMENTS[${expected.id}]`;
      const doc = expectSearchDoc(docsById, expected.id, path);
      if (!doc) {
        return;
      }
      if (doc.href !== expected.href) {
        fail(`${path}.href`, `must be ${expected.href}`);
      }
      if (doc.type !== expected.type) {
        fail(`${path}.type`, `must be ${expected.type}`);
      }
    });

  buildExpectedAnchoredSearchDocuments(collections, glossaryTerms).forEach((expected) => {
    const path = `SEARCH_DOCUMENTS[${expected.id}]`;
    const doc = expectSearchDoc(docsById, expected.id, path);
    if (!doc) {
      return;
    }
    if (doc.href !== expected.href) {
      fail(`${path}.href`, `must be ${expected.href}`);
    }
    if (doc.anchor !== expected.anchor) {
      fail(`${path}.anchor`, `must be ${expected.anchor}`);
    }
    if (doc.type !== expected.type) {
      fail(`${path}.type`, `must be ${expected.type}`);
    }
  });
}

function validateSearchSurface(collections, contentEntries, glossaryTerms, allowedConfidences) {
  const searchDocuments = readActualSearchDocuments();
  const anchorsByRoute = collectKnownRouteAnchors(collections, glossaryTerms);

  validateUnique('SEARCH_DOCUMENT_IDS', searchDocuments.map((doc) => ({ data: { id: doc.id } })));
  searchDocuments.forEach((doc) => {
    const path = `SEARCH_DOCUMENTS[${doc.id}]`;
    validateSearchDocumentMetadata(doc, path, allowedConfidences);
    validateInternalHref(doc.href, `${path}.href`, anchorsByRoute);
  });
  validateExpectedSearchCoverage(searchDocuments, collections, contentEntries, glossaryTerms);

  glossaryTerms.forEach((term) => {
    term.relatedHrefs?.forEach((href, index) => {
      validateInternalHref(href, `GLOSSARY_TERMS[${term.id}].relatedHrefs[${index}]`, anchorsByRoute);
    });
  });

  for (const field of ['href', 'type', 'confidence', 'reviewedAt', 'nextReviewDue', 'sources', 'recordAnchor']) {
    if (!searchRegistrySource.includes(field)) {
      fail('src/lib/search/registry.ts', `search registry must include ${field}`);
    }
  }

  const governanceSource = readFileSync(routePathForHref('/governance'), 'utf8');
  const ecosystemSource = readFileSync(ecosystemFilterPath, 'utf8');
  const glossaryPageSource = readFileSync(routePathForHref('/glossary'), 'utf8');

  for (const prefix of ['governance', 'incident', 'research', 'milestone']) {
    if (!governanceSource.includes(`recordAnchor('${prefix}'`)) {
      fail('src/app/governance/page.tsx', `missing ${prefix} record anchors for search results`);
    }
  }
  if (!ecosystemSource.includes("recordAnchor('ecosystem'")) {
    fail('src/components/features/EcosystemFilterList.tsx', 'missing ecosystem record anchors for search results');
  }
  if (!glossaryPageSource.includes('term-${term.id}')) {
    fail('src/app/glossary/page.tsx', 'missing glossary term anchors for search results');
  }

  for (const field of ['"href"', '"type"', '"description"', '"confidence"', '"reviewedAt"', '"nextReviewDue"', '"sources"']) {
    if (!generatedSearchSource.includes(field)) {
      fail('src/lib/search/mdx-documents.generated.ts', `generated MDX search documents must include ${field}`);
    }
  }
}

const staticDataLastUpdated = getStringConst('STATIC_DATA_LAST_UPDATED');
const nextReviewDue = getNextReviewDueDefault();
const allowedConfidences = getDataConfidences();
const scope = getSourceScope();
const registryScope = getLiteralSourceScope(registryDeclarations);
const glossaryScope = getLiteralSourceScope(glossaryDeclarations);

const chainRecords = readRecordArray('CHAIN_RECORDS', scope, staticDataLastUpdated, nextReviewDue);
scope.chainCodes = chainRecords.map((record) => record.data.chain);

const collections = {
  CHAIN_RECORDS: chainRecords,
  ECOSYSTEM_PROJECT_RECORDS: readRecordArray('ECOSYSTEM_PROJECT_RECORDS', scope, staticDataLastUpdated, nextReviewDue),
  RESEARCH_REPORT_RECORDS: readRecordArray('RESEARCH_REPORT_RECORDS', scope, staticDataLastUpdated, nextReviewDue),
  SECURITY_INCIDENT_RECORDS: readRecordArray('SECURITY_INCIDENT_RECORDS', scope, staticDataLastUpdated, nextReviewDue),
  GOVERNANCE_PROPOSAL_RECORDS: readRecordArray('GOVERNANCE_PROPOSAL_RECORDS', scope, staticDataLastUpdated, nextReviewDue),
  PROTOCOL_MILESTONE_RECORDS: readRecordArray('PROTOCOL_MILESTONE_RECORDS', scope, staticDataLastUpdated, nextReviewDue),
  TOKENOMICS_RECORDS: readRecordArray('TOKENOMICS_RECORDS', scope, staticDataLastUpdated, nextReviewDue),
  SOURCE_MAP_SECTION_RECORDS: readRecordArray('SOURCE_MAP_SECTION_RECORDS', scope, staticDataLastUpdated, nextReviewDue),
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
validateSourceMapSections(collections.SOURCE_MAP_SECTION_RECORDS);
validateSecurityIncidentTrackerStatus(collections.SECURITY_INCIDENT_RECORDS);
const contentEntries = readContentEntries(registryScope);
const glossaryTerms = readGlossaryTerms(glossaryScope);

validateContentRegistry(contentEntries, allowedConfidences);
validateGlossaryTerms(glossaryTerms, allowedConfidences);
validateSearchSurface(collections, contentEntries, glossaryTerms, allowedConfidences);

collections.RESEARCH_REPORT_RECORDS.forEach((record, index) => requireUrlInSources('RESEARCH_REPORT_RECORDS', record, index, 'url'));
collections.SECURITY_INCIDENT_RECORDS.forEach((record, index) => requireUrlInSources('SECURITY_INCIDENT_RECORDS', record, index, 'url'));
collections.GOVERNANCE_PROPOSAL_RECORDS.forEach((record, index) => requireUrlInSources('GOVERNANCE_PROPOSAL_RECORDS', record, index, 'sourceUrl'));

if (failures.length > 0) {
  console.error(failures.join('\n'));
  process.exit(1);
}

console.log('Curated data record validation passed.');
