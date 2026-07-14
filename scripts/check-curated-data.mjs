import './require-node22.mjs';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createJiti } from 'jiti';
import ts from 'typescript';
import { findDeepDiveTocTitleMismatches } from './lib/deep-dive-toc.mjs';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const jiti = createJiti(import.meta.url, {
  alias: {
    '@': join(root, 'src'),
  },
  moduleCache: false,
});
const { SEARCH_DOCUMENTS: actualSearchDocuments } = await jiti.import(join(root, 'src/lib/search/registry.ts'));
const sharedSources = await jiti.import(join(root, 'src/lib/sources.ts'));
const {
  DEEP_DIVE_READER_PATHS: actualDeepDiveReaderPaths,
  DEEP_DIVE_TOC: actualDeepDiveToc,
  HOME_DECISION_LINKS: actualHomeDecisionLinks,
  JOURNEY_LINKS: actualJourneyLinks,
  ROUTE_SOURCE_POSTURE_ENTRY_IDS: actualRouteSourcePostureEntryIds,
  SOURCE_CHOICE_DECISIONS: actualSourceChoiceDecisions,
  TASK_INTENT_GUIDES: actualTaskIntentGuides,
} = await jiti.import(join(root, 'src/lib/content/registry.ts'));
const staticPath = join(root, 'src/lib/data/static.ts');
const typesPath = join(root, 'src/lib/types.ts');
const registryPath = join(root, 'src/lib/content/registry.ts');
const glossaryPath = join(root, 'src/lib/content/glossary.ts');
const searchRegistryPath = join(root, 'src/lib/search/registry.ts');
const generatedSearchPath = join(root, 'src/lib/search/mdx-documents.generated.ts');
const ecosystemFilterPath = join(root, 'src/components/features/EcosystemFilterList.tsx');
const glossaryExplorerPath = join(root, 'src/components/features/GlossaryExplorer.tsx');
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
const liveInboundUrls = new Set([
  'https://gateway.liquify.com/chain/thorchain_api/thorchain/inbound_addresses',
  'https://thornode.thorchain.network/thorchain/inbound_addresses',
]);
const contentCheckToday = process.env.CONTENT_CHECK_TODAY ?? new Date().toISOString().slice(0, 10);
const allowOverdueContent = process.env.ALLOW_OVERDUE_CONTENT === '1';
const routeSourcePostureEntryIds = new Set(actualRouteSourcePostureEntryIds);

function fail(path, message) {
  failures.push(`${path}: ${message}`);
}

const sharedSourceUrlOwners = new Map(
  Object.entries(sharedSources)
    .filter(([, source]) => source && typeof source === 'object' && typeof source.url === 'string')
    .map(([name, source]) => [source.url, name])
);

function typeReferenceName(type) {
  if (!type || !ts.isTypeReferenceNode(type) || !ts.isIdentifier(type.typeName)) {
    return undefined;
  }

  return type.typeName.text;
}

function objectLiteralStringProperty(expression, propertyName) {
  if (!ts.isObjectLiteralExpression(expression)) {
    return undefined;
  }

  for (const property of expression.properties) {
    if (!ts.isPropertyAssignment(property)) {
      continue;
    }
    const name = ts.isIdentifier(property.name) || ts.isStringLiteral(property.name)
      ? property.name.text
      : undefined;
    if (name !== propertyName) {
      continue;
    }
    if (ts.isStringLiteral(property.initializer) || ts.isNoSubstitutionTemplateLiteral(property.initializer)) {
      return property.initializer.text;
    }
  }

  return undefined;
}

function validateSharedSourceReuse(sourceFile, filePath) {
  sourceFile.forEachChild((node) => {
    if (!ts.isVariableStatement(node)) {
      return;
    }

    for (const declaration of node.declarationList.declarations) {
      if (typeReferenceName(declaration.type) !== 'SourceMeta' || !declaration.initializer) {
        continue;
      }

      const localName = declarationName(declaration);
      const url = objectLiteralStringProperty(declaration.initializer, 'url');
      if (!url) {
        continue;
      }

      const sharedName = sharedSourceUrlOwners.get(url);
      if (sharedName) {
        fail(
          `${filePath}.${localName ?? 'anonymous'}.url`,
          `duplicates @/lib/sources ${sharedName}; import/spread the shared source instead`
        );
      }
    }
  });
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

function collectImportedSourceScope(sourceFile) {
  const scope = {};

  sourceFile.forEachChild((node) => {
    if (
      !ts.isImportDeclaration(node) ||
      !ts.isStringLiteral(node.moduleSpecifier) ||
      node.moduleSpecifier.text !== '@/lib/sources'
    ) {
      return;
    }

    const namedBindings = node.importClause?.namedBindings;
    if (!namedBindings || !ts.isNamedImports(namedBindings)) {
      return;
    }

    for (const specifier of namedBindings.elements) {
      const importedName = specifier.propertyName?.text ?? specifier.name.text;
      const localName = specifier.name.text;
      const source = sharedSources[importedName];
      if (!source || typeof source !== 'object' || typeof source.url !== 'string') {
        throw new Error(`@/lib/sources import ${importedName} must be a SourceMeta object`);
      }
      scope[localName] = source;
    }
  });

  return scope;
}

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
      if (ts.isSpreadAssignment(property)) {
        const spreadValue = evaluate(property.expression, scope, `${path}.spread`);
        if (!spreadValue || typeof spreadValue !== 'object' || Array.isArray(spreadValue)) {
          throw new Error(`${path}: object spread target must be an object`);
        }
        Object.assign(value, spreadValue);
        continue;
      }
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

function getLiteralSourceScope(declarations, importedScope = {}) {
  const scope = { ...importedScope };
  let madeProgress = true;

  while (madeProgress) {
    madeProgress = false;
    for (const [name, initializer] of declarations) {
      if (Object.prototype.hasOwnProperty.call(scope, name)) {
        continue;
      }

      try {
        const value = evaluate(initializer, scope, name);
        if (
          value === null ||
          typeof value === 'string' ||
          typeof value === 'number' ||
          typeof value === 'boolean' ||
          Array.isArray(value) ||
          (typeof value === 'object' && value !== null)
        ) {
          scope[name] = value;
          madeProgress = true;
        }
      } catch {
        // Non-literal constants are ignored; record validation will fail if they are referenced.
      }
    }
  }

  return scope;
}

function getSourceScope() {
  return getLiteralSourceScope(staticDeclarations, collectImportedSourceScope(staticFile));
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

function readRecordArray(name, scope) {
  const initializer = staticDeclarations.get(name);
  if (!initializer || !ts.isArrayLiteralExpression(initializer)) {
    throw new Error(`${name} must be an array literal`);
  }

  return initializer.elements.map((element, index) => {
    if (!ts.isCallExpression(element) || !ts.isIdentifier(element.expression) || element.expression.text !== 'record') {
      throw new Error(`${name}[${index}] must be a record(...) call`);
    }
    const [dataExpression, sourcesExpression, confidenceExpression, freshnessOptionsExpression] = element.arguments;
    if (!dataExpression || !sourcesExpression) {
      throw new Error(`${name}[${index}] must include data and sources`);
    }
    if (!freshnessOptionsExpression) {
      throw new Error(`${name}[${index}] must include explicit freshness options`);
    }
    if (ts.isIdentifier(freshnessOptionsExpression) && freshnessOptionsExpression.text === 'STATIC_DATA_BASE_FRESHNESS') {
      throw new Error(`${name}[${index}] must not use catch-all STATIC_DATA_BASE_FRESHNESS`);
    }
    const data = evaluate(dataExpression, scope, `${name}[${index}].data`);
    const sources = evaluate(sourcesExpression, scope, `${name}[${index}].sources`);
    const confidence = confidenceExpression ? evaluate(confidenceExpression, scope, `${name}[${index}].confidence`) : 'curated';
    const freshnessOptions = evaluate(freshnessOptionsExpression, scope, `${name}[${index}].freshnessOptions`);
    if (!freshnessOptions || typeof freshnessOptions !== 'object' || Array.isArray(freshnessOptions)) {
      throw new Error(`${name}[${index}].freshnessOptions must be an object literal`);
    }
    const allowedFreshnessOptions = new Set(['checkedAt', 'nextReviewDue', 'reviewedBy']);
    for (const [optionName, optionValue] of Object.entries(freshnessOptions)) {
      if (!allowedFreshnessOptions.has(optionName)) {
        throw new Error(`${name}[${index}].freshnessOptions.${optionName} is not supported`);
      }
      if (typeof optionValue !== 'string') {
        throw new Error(`${name}[${index}].freshnessOptions.${optionName} must be a string`);
      }
    }
    if (typeof freshnessOptions.checkedAt !== 'string') {
      throw new Error(`${name}[${index}].freshnessOptions.checkedAt must be explicit`);
    }
    if (typeof freshnessOptions.nextReviewDue !== 'string') {
      throw new Error(`${name}[${index}].freshnessOptions.nextReviewDue must be explicit`);
    }
    const freshness = {
      checkedAt: freshnessOptions.checkedAt,
      confidence,
      nextReviewDue: freshnessOptions.nextReviewDue,
    };
    if (typeof freshnessOptions.reviewedBy === 'string') {
      freshness.reviewedBy = freshnessOptions.reviewedBy;
    }
    return {
      data,
      sources,
      freshness,
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

function readGlossaryDefinitionPaths(scope) {
  const initializer = glossaryDeclarations.get('GLOSSARY_DEFINITION_PATHS');
  if (!initializer || !ts.isArrayLiteralExpression(initializer)) {
    throw new Error('GLOSSARY_DEFINITION_PATHS must be an array literal');
  }

  return initializer.elements.map((element, index) => evaluate(element, scope, `GLOSSARY_DEFINITION_PATHS[${index}]`));
}

function readConstArray(declarations, name, scope = {}) {
  const initializer = declarations.get(name);
  if (!initializer || !ts.isArrayLiteralExpression(initializer)) {
    throw new Error(`${name} must be an array literal`);
  }

  return evaluate(initializer, scope, name);
}

function readOperationalSearchDocuments() {
  const scope = collectImportedSourceScope(searchRegistryFile);
  // The operational halt document content is derived from the shared
  // operational-control catalog. Coverage validation only needs id/href/type.
  scope.OPERATIONAL_CONTROL_SEARCH_CONTENT = '';
  return readConstArray(
    searchRegistryDeclarations,
    'OPERATIONAL_HALT_SEARCH_DOCUMENTS',
    scope
  );
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

function validateNonEmptyStringArray(value, path) {
  if (!Array.isArray(value) || value.length === 0) {
    fail(path, 'must include at least one non-empty string');
    return;
  }
  value.forEach((item, index) => {
    if (typeof item !== 'string' || item.trim() === '') {
      fail(`${path}[${index}]`, 'must be a non-empty string');
    }
  });
}

function validateSourceRetrieval(source, path, checkedAt, checkedAtPath) {
  if (!source || typeof source !== 'object' || !Object.prototype.hasOwnProperty.call(source, 'retrievedAt')) {
    return;
  }
  if (!isIsoDate(source.retrievedAt)) {
    fail(`${path}.retrievedAt`, 'must be YYYY-MM-DD when present');
    return;
  }
  if (source.retrievedAt > contentCheckToday) {
    fail(`${path}.retrievedAt`, `must not be in the future relative to ${contentCheckToday}`);
  }
  if (isIsoDate(checkedAt) && source.retrievedAt > checkedAt) {
    fail(`${path}.retrievedAt`, `must not be after ${checkedAtPath} (${checkedAt})`);
  }
}

function collectReviewTargets(value, basePath, targets = []) {
  if (typeof value === 'string') {
    for (const match of value.matchAll(/\breview\s+target\s+(\d{4}-\d{2}-\d{2})\b/gi)) {
      targets.push({ date: match[1], path: basePath });
    }
    return targets;
  }
  if (!value || typeof value !== 'object') {
    return targets;
  }
  if (Array.isArray(value)) {
    value.forEach((item, index) => collectReviewTargets(item, `${basePath}[${index}]`, targets));
    return targets;
  }
  Object.entries(value).forEach(([key, item]) => {
    collectReviewTargets(item, `${basePath}.${key}`, targets);
  });
  return targets;
}

function validateRecordReviewTargets(record, path) {
  if (!record?.data || !record?.freshness) {
    return;
  }
  collectReviewTargets(record.data, `${path}.data`).forEach((target) => {
    if (!isIsoDate(target.date)) {
      fail(target.path, `contains unsupported review target date ${target.date}`);
      return;
    }
    if (isIsoDate(record.freshness.nextReviewDue) && record.freshness.nextReviewDue > target.date) {
      fail(
        `${path}.freshness.nextReviewDue`,
        `must be no later than visible review target ${target.date} from ${target.path}`
      );
    }
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
    if (
      Object.prototype.hasOwnProperty.call(source, 'notes') &&
      (typeof source.notes !== 'string' || source.notes.trim() === '')
    ) {
      fail(`${sourcePath}.notes`, 'must be a non-empty string when present');
    }
  }

  if (!record.freshness || typeof record.freshness !== 'object') {
    fail(`${path}.freshness`, 'missing freshness metadata');
    return;
  }
  if (!isIsoDate(record.freshness.checkedAt)) {
    fail(`${path}.freshness.checkedAt`, 'must be YYYY-MM-DD');
  } else if (record.freshness.checkedAt < staticDataLastUpdated) {
    fail(`${path}.freshness.checkedAt`, `must not be before STATIC_DATA_LAST_UPDATED (${staticDataLastUpdated})`);
  } else if (record.freshness.checkedAt > contentCheckToday) {
    fail(`${path}.freshness.checkedAt`, `must not be in the future relative to ${contentCheckToday}`);
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
  if (
    Object.prototype.hasOwnProperty.call(record.freshness, 'reviewedBy') &&
    (typeof record.freshness.reviewedBy !== 'string' || record.freshness.reviewedBy.trim() === '')
  ) {
    fail(`${path}.freshness.reviewedBy`, 'must be a non-empty string when present');
  }
  record.sources.forEach((source, sourceIndex) => {
    validateSourceRetrieval(source, `${path}.sources[${sourceIndex}]`, record.freshness.checkedAt, `${path}.freshness.checkedAt`);
  });
  validateRecordReviewTargets(record, path);
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
    if (record.data.supported === true && !record.sources.some((source) => liveInboundUrls.has(source.url))) {
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
    if (Object.hasOwn(record.data, 'status')) {
      fail(`${path}.data.status`, 'must not claim project activity; use record freshness confidence for source posture');
    }
    if (!Array.isArray(record.data.chains) || record.data.chains.length === 0) {
      fail(`${path}.data.chains`, 'must include at least one chain');
      continue;
    }
    validateNonEmptyStringArray(record.data.useFor, `${path}.data.useFor`);
    validateNonEmptyStringArray(record.data.verifyBeforeUse, `${path}.data.verifyBeforeUse`);
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
    for (const field of ['id', 'title', 'decision', 'use', 'caveat']) {
      if (typeof record.data?.[field] !== 'string' || record.data[field].trim() === '') {
        fail(`${path}.data.${field}`, 'must be a non-empty string');
      }
    }
    for (const field of ['claimExamples', 'nonClaims']) {
      validateNonEmptyStringArray(record.data?.[field], `${path}.data.${field}`);
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

function validateGovernanceTrackerStatus(records) {
  const allowedTrackerStatuses = new Set(['current', 'needs-review']);
  for (const [index, record] of records.entries()) {
    const path = `GOVERNANCE_PROPOSAL_RECORDS[${recordKey(record, index)}].data`;
    const status = record.data?.trackerStatus;
    if (status === undefined) {
      continue;
    }
    if (!allowedTrackerStatuses.has(status)) {
      fail(`${path}.trackerStatus`, `unsupported tracker status ${status}`);
    }
    if (record.data?.type !== 'Recovery') {
      fail(`${path}.trackerStatus`, 'governance tracker status is reserved for recovery records');
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
  return mdxAnchorDetailsForSlug(slug).anchors;
}

function mdxAnchorDetailsForSlug(slug) {
  const source = readFileSync(mdxPathForSlug(slug), 'utf8');
  const anchors = new Set();
  const headingsByAnchor = new Map();
  const duplicates = [];
  for (const match of source.matchAll(/^#{2,3}\s+(.+)$/gm)) {
    const heading = match[1].trim();
    const anchor = slugifyHeading(heading);
    const firstHeading = headingsByAnchor.get(anchor);
    if (firstHeading) {
      duplicates.push({ anchor, firstHeading, heading });
    } else {
      headingsByAnchor.set(anchor, heading);
    }
    anchors.add(anchor);
  }
  return { anchors, duplicates, headingsByAnchor };
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
  if (
    Object.prototype.hasOwnProperty.call(source, 'notes') &&
    (typeof source.notes !== 'string' || source.notes.trim() === '')
  ) {
    fail(`${path}.notes`, 'must be a non-empty string when present');
  }
  if (Object.prototype.hasOwnProperty.call(source, 'retrievedAt') && !isIsoDate(source.retrievedAt)) {
    fail(`${path}.retrievedAt`, 'must be YYYY-MM-DD when present');
  }
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
    entry.sources.forEach((source, sourceIndex) => {
      const sourcePath = `${path}.sources[${sourceIndex}]`;
      validateRegistrySource(source, sourcePath, sourceUrls);
      if (!source || typeof source !== 'object' || !Object.prototype.hasOwnProperty.call(source, 'retrievedAt')) {
        fail(`${sourcePath}.retrievedAt`, 'must be YYYY-MM-DD for visible page source posture');
      }
    });
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
  if (Array.isArray(entry.sources)) {
    entry.sources.forEach((source, sourceIndex) => {
      validateSourceRetrieval(source, `${path}.sources[${sourceIndex}]`, entry.reviewedAt, `${path}.reviewedAt`);
    });
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

  const anchorDetails = mdxAnchorDetailsForSlug(slug);
  anchorDetails.duplicates.forEach((duplicate) => {
    fail(
      `${relative(root, mdxPathForSlug(slug))}#${duplicate.anchor}`,
      `duplicate MDX heading anchor generated by "${duplicate.firstHeading}" and "${duplicate.heading}"`
    );
  });

  if (!actualDeepDiveToc || typeof actualDeepDiveToc !== 'object' || Array.isArray(actualDeepDiveToc)) {
    fail('DEEP_DIVE_TOC', 'must be an object keyed by deep-dive entry id');
    return;
  }
  if (!Object.prototype.hasOwnProperty.call(actualDeepDiveToc, entry.id)) {
    fail(`${path}.toc`, `missing DEEP_DIVE_TOC["${entry.id}"]`);
    return;
  }

  const toc = actualDeepDiveToc[entry.id];
  if (!Array.isArray(toc)) {
    fail(`${path}.toc`, 'deep-dive table of contents must be an array');
    return;
  }
  if (toc.length === 0) {
    fail(`${path}.toc`, 'deep-dive table of contents must include at least one item');
  }
  const tocAnchors = new Set();
  const mdxAnchors = anchorDetails.anchors;
  const tocItemsWithKnownAnchors = [];
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
    if (tocAnchors.has(anchor)) {
      fail(`${tocPath}.href`, `duplicates earlier TOC anchor ${item.href}`);
    }
    tocAnchors.add(anchor);
    if (!mdxAnchors.has(anchor)) {
      fail(`${tocPath}.href`, `unknown MDX heading anchor ${item.href} in ${relative(root, mdxPathForSlug(slug))}`);
      return;
    }
    tocItemsWithKnownAnchors.push(item);
  });

  findDeepDiveTocTitleMismatches({
    headingsByAnchor: anchorDetails.headingsByAnchor,
    tocItems: tocItemsWithKnownAnchors,
  }).forEach((mismatch) => {
    fail(
      `${path}.toc#${mismatch.anchor}`,
      `TOC title "${mismatch.actualTitle}" must match MDX heading "${mismatch.expectedTitle}" in ${relative(root, mdxPathForSlug(slug))}`
    );
  });
}

function validateContentRegistry(entries, allowedConfidences) {
  const ids = new Map();
  const hrefs = new Map();
  const deepDiveMdxSlugs = new Set(readDeepDiveSlugsFromMdx());
  const deepDiveRouteSlugs = new Set(readDeepDiveSlugsFromRoutes());
  const deepDiveRegistryIds = new Set();
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
      if (typeof entry.id === 'string') {
        deepDiveRegistryIds.add(entry.id);
      }
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

  if (actualDeepDiveToc && typeof actualDeepDiveToc === 'object' && !Array.isArray(actualDeepDiveToc)) {
    for (const entryId of Object.keys(actualDeepDiveToc)) {
      if (!deepDiveRegistryIds.has(entryId)) {
        fail(`DEEP_DIVE_TOC[${entryId}]`, 'must match a deep-dive CONTENT_ENTRIES id');
      }
    }
  }
}

function validateRouteSourcePostureUsage(entries) {
  const entriesById = new Map(
    entries
      .filter((entry) => entry && typeof entry === 'object' && typeof entry.id === 'string')
      .map((entry) => [entry.id, entry])
  );

  for (const id of routeSourcePostureEntryIds) {
    const entry = entriesById.get(id);
    if (!entry) {
      fail(`CONTENT_ENTRIES[${id}]`, 'missing entry required by route source posture checks');
      continue;
    }
    if (typeof entry.href !== 'string') {
      continue;
    }

    const routePath = routePathForHref(entry.href);
    if (!existsSync(routePath)) {
      continue;
    }

    const relativeRoutePath = relative(root, routePath);
    const routeSource = readFileSync(routePath, 'utf8');
    if (!routeSource.includes('RouteSourcePosture')) {
      fail(relativeRoutePath, `must render RouteSourcePosture for CONTENT_ENTRIES[${id}]`);
    }
    if (!new RegExp(`getContentEntry\\(\\s*['"]${id}['"]\\s*\\)`).test(routeSource)) {
      fail(relativeRoutePath, `must load registry metadata with getContentEntry('${id}')`);
    }
    if (!/entry=\{\s*entry\s*\}/.test(routeSource)) {
      fail(relativeRoutePath, 'must pass registry metadata to RouteSourcePosture as entry={entry}');
    }
  }
}

function validateJourneyLinks(links, collections, glossaryTerms, deepDiveReaderPaths) {
  if (!Array.isArray(links) || links.length === 0) {
    fail('JOURNEY_LINKS', 'must include at least one journey link');
    return;
  }

  const hrefs = new Map();
  const knownAnchorsByRoute = collectKnownRouteAnchors(collections, glossaryTerms, deepDiveReaderPaths);
  links.forEach((link, index) => {
    const path = `JOURNEY_LINKS[${link?.label ?? index}]`;
    if (!link || typeof link !== 'object') {
      fail(path, 'journey link must be an object');
      return;
    }
    for (const field of ['label', 'href', 'description']) {
      if (typeof link[field] !== 'string' || link[field].trim() === '') {
        fail(`${path}.${field}`, 'must be a non-empty string');
      }
    }
    if (typeof link.href !== 'string') {
      return;
    }
    if (!link.href.startsWith('/')) {
      fail(`${path}.href`, 'must start with /');
      return;
    }
    if (link.href.includes('?')) {
      fail(`${path}.href`, 'must not include query strings');
    }
    if (hrefs.has(link.href)) {
      fail(`${path}.href`, `duplicates JOURNEY_LINKS[${hrefs.get(link.href)}].href`);
    }
    hrefs.set(link.href, index);

    const { path: route, anchor, hasExtraFragment } = splitInternalHref(link.href);
    if (hasExtraFragment) {
      fail(`${path}.href`, 'must not include multiple fragments');
    }
    const routePath = routePathForHref(route);
    if (!existsSync(routePath)) {
      fail(`${path}.href`, `missing route ${relative(root, routePath)}`);
    }
    if (anchor && !(knownAnchorsByRoute.get(route)?.has(anchor) || readStaticRouteAnchors(route).has(anchor))) {
      fail(`${path}.href`, `unknown route anchor ${link.href}`);
    }
  });
}

function validateHomeDecisionLinks(links, collections, glossaryTerms, deepDiveReaderPaths) {
  if (!Array.isArray(links) || links.length === 0) {
    fail('HOME_DECISION_LINKS', 'must include at least one home decision link');
    return;
  }

  const ids = new Map();
  const hrefs = new Map();
  const knownAnchorsByRoute = collectKnownRouteAnchors(collections, glossaryTerms, deepDiveReaderPaths);
  links.forEach((link, index) => {
    const path = `HOME_DECISION_LINKS[${link?.id ?? index}]`;
    if (!link || typeof link !== 'object') {
      fail(path, 'home decision link must be an object');
      return;
    }
    for (const field of ['id', 'question', 'label', 'href', 'badge', 'description']) {
      if (typeof link[field] !== 'string' || link[field].trim() === '') {
        fail(`${path}.${field}`, 'must be a non-empty string');
      }
    }
    if (typeof link.id === 'string') {
      if (ids.has(link.id)) {
        fail(`${path}.id`, `duplicates HOME_DECISION_LINKS[${ids.get(link.id)}].id`);
      }
      ids.set(link.id, index);
      if (link.id !== slugifyFragment(link.id)) {
        fail(`${path}.id`, 'must be a stable slug fragment');
      }
    }
    if (typeof link.href === 'string') {
      if (hrefs.has(link.href)) {
        fail(`${path}.href`, `duplicates HOME_DECISION_LINKS[${hrefs.get(link.href)}].href`);
      }
      hrefs.set(link.href, index);
      validateInternalHref(link.href, `${path}.href`, knownAnchorsByRoute);
    }
  });
}

function validateSourceChoiceDecisions(decisions, collections, glossaryTerms, deepDiveReaderPaths) {
  if (!Array.isArray(decisions) || decisions.length === 0) {
    fail('SOURCE_CHOICE_DECISIONS', 'must include at least one source-choice decision');
    return;
  }

  const ids = new Map();
  const knownAnchorsByRoute = collectKnownRouteAnchors(collections, glossaryTerms, deepDiveReaderPaths);
  decisions.forEach((decision, index) => {
    const path = `SOURCE_CHOICE_DECISIONS[${decision?.id ?? index}]`;
    if (!decision || typeof decision !== 'object') {
      fail(path, 'decision must be an object');
      return;
    }
    for (const field of ['id', 'claim', 'why', 'avoidClaiming']) {
      if (typeof decision[field] !== 'string' || decision[field].trim() === '') {
        fail(`${path}.${field}`, 'must be a non-empty string');
      }
    }
    if (typeof decision.id === 'string') {
      if (ids.has(decision.id)) {
        fail(`${path}.id`, `duplicates SOURCE_CHOICE_DECISIONS[${ids.get(decision.id)}].id`);
      }
      ids.set(decision.id, index);
      if (decision.id !== slugifyFragment(decision.id)) {
        fail(`${path}.id`, 'must be a stable slug fragment');
      }
    }
    if (!decision.startWith || typeof decision.startWith !== 'object') {
      fail(`${path}.startWith`, 'must be an object');
    } else {
      for (const field of ['label', 'href']) {
        if (typeof decision.startWith[field] !== 'string' || decision.startWith[field].trim() === '') {
          fail(`${path}.startWith.${field}`, 'must be a non-empty string');
        }
      }
      validateInternalHref(decision.startWith.href, `${path}.startWith.href`, knownAnchorsByRoute);
    }
    if (!Array.isArray(decision.nextChecks) || decision.nextChecks.length === 0) {
      fail(`${path}.nextChecks`, 'must include at least one next check');
    } else {
      const hrefs = new Map();
      decision.nextChecks.forEach((check, checkIndex) => {
        const checkPath = `${path}.nextChecks[${check?.label ?? checkIndex}]`;
        if (!check || typeof check !== 'object') {
          fail(checkPath, 'next check must be an object');
          return;
        }
        for (const field of ['label', 'href', 'description']) {
          if (typeof check[field] !== 'string' || check[field].trim() === '') {
            fail(`${checkPath}.${field}`, 'must be a non-empty string');
          }
        }
        if (typeof check.href === 'string') {
          if (hrefs.has(check.href)) {
            fail(`${checkPath}.href`, `duplicates ${path}.nextChecks[${hrefs.get(check.href)}].href`);
          }
          hrefs.set(check.href, checkIndex);
          validateInternalHref(check.href, `${checkPath}.href`, knownAnchorsByRoute);
        }
      });
    }
  });
}

function validateTaskIntentGuides(guides, allowedConfidences, collections, glossaryTerms, deepDiveReaderPaths) {
  if (!Array.isArray(guides) || guides.length === 0) {
    fail('TASK_INTENT_GUIDES', 'must include at least one task guide');
    return;
  }

  const ids = new Map();
  const knownAnchorsByRoute = collectKnownRouteAnchors(collections, glossaryTerms, deepDiveReaderPaths);
  guides.forEach((guide, index) => {
    const path = `TASK_INTENT_GUIDES[${guide?.id ?? index}]`;
    if (!guide || typeof guide !== 'object') {
      fail(path, 'guide must be an object');
      return;
    }
    for (const field of ['id', 'label', 'question', 'href', 'description', 'reviewedAt', 'nextReviewDue']) {
      if (typeof guide[field] !== 'string' || guide[field].trim() === '') {
        fail(`${path}.${field}`, 'must be a non-empty string');
      }
    }
    if (typeof guide.id === 'string') {
      if (ids.has(guide.id)) {
        fail(`${path}.id`, `duplicates TASK_INTENT_GUIDES[${ids.get(guide.id)}].id`);
      }
      ids.set(guide.id, index);
    }
    if (!allowedConfidences.has(guide.confidence)) {
      fail(`${path}.confidence`, `unsupported confidence ${guide.confidence}`);
    }
    if (typeof guide.href === 'string') {
      validateInternalHref(guide.href, `${path}.href`, knownAnchorsByRoute);
    }
    if (!Array.isArray(guide.searchTerms) || guide.searchTerms.length === 0 || guide.searchTerms.some((term) => typeof term !== 'string' || term.trim() === '')) {
      fail(`${path}.searchTerms`, 'must include at least one non-empty term');
    }
    if (!Array.isArray(guide.sources) || guide.sources.length === 0) {
      fail(`${path}.sources`, 'must include at least one source');
    } else {
      const sourceUrls = new Set();
      guide.sources.forEach((source, sourceIndex) => validateRegistrySource(source, `${path}.sources[${sourceIndex}]`, sourceUrls));
    }
    if (!isIsoDate(guide.reviewedAt)) {
      fail(`${path}.reviewedAt`, 'must be YYYY-MM-DD');
    }
    if (!isIsoDate(guide.nextReviewDue)) {
      fail(`${path}.nextReviewDue`, 'must be YYYY-MM-DD');
    } else if (isIsoDate(guide.reviewedAt) && guide.nextReviewDue < guide.reviewedAt) {
      fail(`${path}.nextReviewDue`, 'must not be before reviewedAt');
    } else {
      validateReviewDueDate(guide.nextReviewDue, `${path}.nextReviewDue`);
    }
    if (Array.isArray(guide.sources)) {
      guide.sources.forEach((source, sourceIndex) => {
        validateSourceRetrieval(source, `${path}.sources[${sourceIndex}]`, guide.reviewedAt, `${path}.reviewedAt`);
      });
    }
  });
}

function validateDeepDiveReaderPaths(paths, contentEntries, allowedConfidences, anchorsByRoute) {
  if (!Array.isArray(paths) || paths.length === 0) {
    fail('DEEP_DIVE_READER_PATHS', 'must include at least one reader path');
    return;
  }

  const deepDiveIds = new Set(contentEntries.filter((entry) => entry.category === 'deep-dive').map((entry) => entry.id));
  const ids = new Map();
  paths.forEach((readerPath, index) => {
    const path = `DEEP_DIVE_READER_PATHS[${readerPath?.id ?? index}]`;
    if (!readerPath || typeof readerPath !== 'object') {
      fail(path, 'reader path must be an object');
      return;
    }
    for (const field of ['id', 'title', 'audience', 'description', 'reviewedAt', 'nextReviewDue']) {
      if (typeof readerPath[field] !== 'string' || readerPath[field].trim() === '') {
        fail(`${path}.${field}`, 'must be a non-empty string');
      }
    }
    if (typeof readerPath.id === 'string') {
      if (ids.has(readerPath.id)) {
        fail(`${path}.id`, `duplicates DEEP_DIVE_READER_PATHS[${ids.get(readerPath.id)}].id`);
      }
      ids.set(readerPath.id, index);
      if (readerPath.id !== slugifyFragment(readerPath.id)) {
        fail(`${path}.id`, 'must be a stable slug fragment');
      }
    }
    if (!allowedConfidences.has(readerPath.confidence)) {
      fail(`${path}.confidence`, `unsupported confidence ${readerPath.confidence}`);
    }
    if (!Array.isArray(readerPath.entryIds) || readerPath.entryIds.length === 0) {
      fail(`${path}.entryIds`, 'must include at least one deep-dive entry id');
    } else {
      readerPath.entryIds.forEach((entryId, entryIndex) => {
        if (!deepDiveIds.has(entryId)) {
          fail(`${path}.entryIds[${entryIndex}]`, `unknown deep-dive entry ${entryId}`);
        }
      });
    }
    if (!Array.isArray(readerPath.verifyBeforeClaiming) || readerPath.verifyBeforeClaiming.length === 0) {
      fail(`${path}.verifyBeforeClaiming`, 'must include at least one verification boundary');
    }
    if (!Array.isArray(readerPath.followUpLinks) || readerPath.followUpLinks.length === 0) {
      fail(`${path}.followUpLinks`, 'must include at least one follow-up link');
    } else {
      readerPath.followUpLinks.forEach((link, linkIndex) => {
        const linkPath = `${path}.followUpLinks[${linkIndex}]`;
        for (const field of ['label', 'href', 'description']) {
          if (typeof link?.[field] !== 'string' || link[field].trim() === '') {
            fail(`${linkPath}.${field}`, 'must be a non-empty string');
          }
        }
        if (typeof link?.href === 'string') {
          validateInternalHref(link.href, `${linkPath}.href`, anchorsByRoute);
        }
      });
    }
    if (!Array.isArray(readerPath.searchTerms) || readerPath.searchTerms.length === 0 || readerPath.searchTerms.some((term) => typeof term !== 'string' || term.trim() === '')) {
      fail(`${path}.searchTerms`, 'must include at least one non-empty term');
    }
    if (!Array.isArray(readerPath.sources) || readerPath.sources.length === 0) {
      fail(`${path}.sources`, 'must include at least one source');
    } else {
      const sourceUrls = new Set();
      readerPath.sources.forEach((source, sourceIndex) => validateRegistrySource(source, `${path}.sources[${sourceIndex}]`, sourceUrls));
    }
    if (!isIsoDate(readerPath.reviewedAt)) {
      fail(`${path}.reviewedAt`, 'must be YYYY-MM-DD');
    }
    if (!isIsoDate(readerPath.nextReviewDue)) {
      fail(`${path}.nextReviewDue`, 'must be YYYY-MM-DD');
    } else if (isIsoDate(readerPath.reviewedAt) && readerPath.nextReviewDue < readerPath.reviewedAt) {
      fail(`${path}.nextReviewDue`, 'must not be before reviewedAt');
    } else {
      validateReviewDueDate(readerPath.nextReviewDue, `${path}.nextReviewDue`);
    }
    if (Array.isArray(readerPath.sources)) {
      readerPath.sources.forEach((source, sourceIndex) => {
        validateSourceRetrieval(source, `${path}.sources[${sourceIndex}]`, readerPath.reviewedAt, `${path}.reviewedAt`);
      });
    }
  });
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
    } else {
      const sourceUrls = new Set();
      term.sources.forEach((source, sourceIndex) => {
        const sourcePath = `${path}.sources[${sourceIndex}]`;
        validateRegistrySource(source, sourcePath, sourceUrls);
        validateSourceRetrieval(source, sourcePath, term.reviewedAt, `${path}.reviewedAt`);
      });
    }
    if (!Array.isArray(term.relatedHrefs) || term.relatedHrefs.length === 0) {
      fail(`${path}.relatedHrefs`, 'must include at least one related route');
    }
  });
}

function validateGlossaryDefinitionPaths(paths, glossaryTerms, collections, deepDiveReaderPaths) {
  if (!Array.isArray(paths) || paths.length === 0) {
    fail('GLOSSARY_DEFINITION_PATHS', 'must include at least one definition path');
    return;
  }

  const glossaryTermIds = new Set(glossaryTerms.map((term) => term.id));
  const anchorsByRoute = collectKnownRouteAnchors(collections, glossaryTerms, deepDiveReaderPaths);
  const seenTitles = new Map();
  const seenTermIds = new Map();
  const allowedBadges = new Set(['operations', 'economics', 'developer', 'history']);

  paths.forEach((definitionPath, index) => {
    const path = `GLOSSARY_DEFINITION_PATHS[${definitionPath?.title ?? index}]`;
    if (!definitionPath || typeof definitionPath !== 'object') {
      fail(path, 'definition path must be an object');
      return;
    }
    for (const field of ['title', 'badge', 'description', 'verifyHref', 'verifyLabel', 'boundary']) {
      if (typeof definitionPath[field] !== 'string' || definitionPath[field].trim() === '') {
        fail(`${path}.${field}`, 'must be a non-empty string');
      }
    }
    if (typeof definitionPath.title === 'string') {
      if (seenTitles.has(definitionPath.title)) {
        fail(`${path}.title`, `duplicates GLOSSARY_DEFINITION_PATHS[${seenTitles.get(definitionPath.title)}].title`);
      }
      seenTitles.set(definitionPath.title, index);
    }
    if (typeof definitionPath.badge === 'string' && !allowedBadges.has(definitionPath.badge)) {
      fail(`${path}.badge`, `unsupported badge ${definitionPath.badge}`);
    }
    if (typeof definitionPath.verifyHref === 'string') {
      validateInternalHref(definitionPath.verifyHref, `${path}.verifyHref`, anchorsByRoute);
    }
    if (!Array.isArray(definitionPath.termIds) || definitionPath.termIds.length === 0) {
      fail(`${path}.termIds`, 'must include at least one glossary term id');
    } else {
      const pathTermIds = new Set();
      definitionPath.termIds.forEach((termId, termIndex) => {
        const termPath = `${path}.termIds[${termIndex}]`;
        if (typeof termId !== 'string' || termId.trim() === '') {
          fail(termPath, 'must be a non-empty glossary term id');
          return;
        }
        if (!glossaryTermIds.has(termId)) {
          fail(termPath, `unknown glossary term id ${termId}`);
        }
        if (pathTermIds.has(termId)) {
          fail(termPath, `duplicates another term in ${path}.termIds`);
        }
        pathTermIds.add(termId);
        if (seenTermIds.has(termId)) {
          fail(termPath, `duplicates ${seenTermIds.get(termId)}`);
        }
        seenTermIds.set(termId, termPath);
      });
    }
  });
}

function addRouteAnchor(anchorsByRoute, route, anchor) {
  if (!anchorsByRoute.has(route)) {
    anchorsByRoute.set(route, new Set());
  }
  anchorsByRoute.get(route).add(anchor);
}

function collectKnownRouteAnchors(collections, glossaryTerms, deepDiveReaderPaths) {
  const anchorsByRoute = new Map();

  addRouteAnchor(anchorsByRoute, '/network', 'check-a-route');
  addRouteAnchor(anchorsByRoute, '/network', 'node-operator-actions');

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
  for (const record of collections.TOKENOMICS_RECORDS) {
    addRouteAnchor(anchorsByRoute, tokenomicsRecordRoute(record.data.id), recordAnchor('tokenomics', record.data.id));
  }
  for (const record of collections.ECOSYSTEM_PROJECT_RECORDS) {
    addRouteAnchor(anchorsByRoute, '/ecosystem', recordAnchor('ecosystem', record.data.id));
  }
  for (const record of collections.SOURCE_MAP_SECTION_RECORDS) {
    addRouteAnchor(anchorsByRoute, '/docs', record.data.id);
  }
  for (const record of collections.CHAIN_RECORDS) {
    addRouteAnchor(anchorsByRoute, '/protocol', recordAnchor('chain', record.data.chain));
  }
  for (const term of glossaryTerms) {
    addRouteAnchor(anchorsByRoute, '/glossary', `term-${term.id}`);
    addRouteAnchor(anchorsByRoute, '/glossary', term.category);
  }
  for (const readerPath of deepDiveReaderPaths) {
    addRouteAnchor(anchorsByRoute, '/deep-dives', `deep-dive-path-${readerPath.id}`);
  }
  for (const slug of readDeepDiveSlugsFromMdx()) {
    for (const anchor of mdxAnchorsForSlug(slug)) {
      addRouteAnchor(anchorsByRoute, `/deep-dives/${slug}`, anchor);
    }
  }

  return anchorsByRoute;
}

function tokenomicsRecordRoute(id) {
  return id === 'tcy-recovery-context' ? '/tcy' : '/rune';
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
  const routeDir = dirname(routePath);
  const sourcePaths = [
    routePath,
    ...readdirSync(routeDir)
      .filter((entry) => entry.endsWith('.tsx'))
      .map((entry) => join(routeDir, entry))
      .filter((entryPath) => entryPath !== routePath),
  ];
  const idPattern = /\bid\s*=\s*["']([A-Za-z0-9_-]+)["']/g;
  for (const sourcePath of sourcePaths) {
    const source = readFileSync(sourcePath, 'utf8');
    for (const match of source.matchAll(idPattern)) {
      anchors.add(match[1]);
    }
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
  doc.sources.forEach((source, sourceIndex) => {
    const sourcePath = `${path}.sources[${sourceIndex}]`;
    validateRegistrySource(source, sourcePath, sourceUrls);
    validateSourceRetrieval(source, sourcePath, doc.reviewedAt, `${path}.reviewedAt`);
  });
}

function buildExpectedAnchoredSearchDocuments(collections, glossaryTerms, deepDiveReaderPaths) {
  return [
    ...collections.SECURITY_INCIDENT_RECORDS.map((record) => {
      const anchor = recordAnchor('incident', record.data.id);
      return {
        id: `incident:${record.data.id}`,
        href: `/governance#${anchor}`,
        type: 'incident',
        anchor,
        confidence: record.freshness.confidence,
        reviewedAt: record.freshness.checkedAt,
        nextReviewDue: record.freshness.nextReviewDue,
      };
    }),
    ...collections.ECOSYSTEM_PROJECT_RECORDS.map((record) => {
      const anchor = recordAnchor('ecosystem', record.data.id);
      return {
        id: `ecosystem:${record.data.id}`,
        href: `/ecosystem#${anchor}`,
        type: 'ecosystem',
        anchor,
        confidence: record.freshness.confidence,
        reviewedAt: record.freshness.checkedAt,
        nextReviewDue: record.freshness.nextReviewDue,
      };
    }),
    ...collections.SOURCE_MAP_SECTION_RECORDS.map((record) => ({
      id: `source-map:${record.data.id}`,
      href: `/docs#${record.data.id}`,
      type: 'source-map',
      anchor: record.data.id,
      confidence: record.freshness.confidence,
      reviewedAt: record.freshness.checkedAt,
      nextReviewDue: record.freshness.nextReviewDue,
    })),
    ...collections.CHAIN_RECORDS.map((record) => {
      const anchor = recordAnchor('chain', record.data.chain);
      return {
        id: `chain:${record.data.chain.toLowerCase()}`,
        href: `/protocol#${anchor}`,
        type: 'chain',
        anchor,
        confidence: record.freshness.confidence,
        reviewedAt: record.freshness.checkedAt,
        nextReviewDue: record.freshness.nextReviewDue,
      };
    }),
    ...collections.RESEARCH_REPORT_RECORDS.map((record) => {
      const anchor = recordAnchor('research', record.data.id);
      return {
        id: `research:${record.data.id}`,
        href: `/governance#${anchor}`,
        type: 'research',
        anchor,
        confidence: record.freshness.confidence,
        reviewedAt: record.freshness.checkedAt,
        nextReviewDue: record.freshness.nextReviewDue,
      };
    }),
    ...collections.GOVERNANCE_PROPOSAL_RECORDS.map((record) => {
      const anchor = recordAnchor('governance', record.data.id);
      return {
        id: `governance:${record.data.id}`,
        href: `/governance#${anchor}`,
        type: 'governance',
        anchor,
        confidence: record.freshness.confidence,
        reviewedAt: record.freshness.checkedAt,
        nextReviewDue: record.freshness.nextReviewDue,
      };
    }),
    ...collections.PROTOCOL_MILESTONE_RECORDS.map((record) => {
      const anchor = recordAnchor('milestone', `${record.data.date}-${record.data.title}`);
      return {
        id: `milestone:${record.data.date}:${record.data.title}`,
        href: `/governance#${anchor}`,
        type: 'milestone',
        anchor,
        confidence: record.freshness.confidence,
        reviewedAt: record.freshness.checkedAt,
        nextReviewDue: record.freshness.nextReviewDue,
      };
    }),
    ...collections.TOKENOMICS_RECORDS.map((record) => {
      const anchor = recordAnchor('tokenomics', record.data.id);
      return {
        id: `tokenomics:${record.data.id}`,
        href: `${tokenomicsRecordRoute(record.data.id)}#${anchor}`,
        type: 'tokenomics',
        anchor,
        confidence: record.freshness.confidence,
        reviewedAt: record.freshness.checkedAt,
        nextReviewDue: record.freshness.nextReviewDue,
      };
    }),
    ...glossaryTerms.map((term) => {
      const anchor = `term-${term.id}`;
      return {
        id: `glossary:${term.id}`,
        href: `/glossary#${anchor}`,
        type: 'glossary',
        anchor,
        confidence: term.confidence,
        reviewedAt: term.reviewedAt,
        nextReviewDue: term.nextReviewDue,
      };
    }),
    ...deepDiveReaderPaths.map((readerPath) => {
      const anchor = `deep-dive-path-${readerPath.id}`;
      return {
        id: `deep-dive-path:${readerPath.id}`,
        href: `/deep-dives#${anchor}`,
        type: 'deep-dive-path',
        anchor,
        confidence: readerPath.confidence,
        reviewedAt: readerPath.reviewedAt,
        nextReviewDue: readerPath.nextReviewDue,
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

function validateExpectedSearchCoverage(searchDocuments, collections, contentEntries, taskGuides, glossaryTerms, deepDiveReaderPaths) {
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

  taskGuides.forEach((guide) => {
    const id = `task:${guide.id}`;
    const path = `SEARCH_DOCUMENTS[${id}]`;
    const doc = expectSearchDoc(docsById, id, path);
    if (!doc) {
      return;
    }
    if (doc.href !== guide.href) {
      fail(`${path}.href`, `must be ${guide.href}`);
    }
    const { path: guideSlug, anchor: guideAnchor } = splitInternalHref(guide.href);
    if (doc.slug !== guideSlug) {
      fail(`${path}.slug`, `must be ${guideSlug}`);
    }
    if (doc.anchor !== guideAnchor) {
      fail(`${path}.anchor`, `must be ${guideAnchor}`);
    }
    if (doc.type !== 'task') {
      fail(`${path}.type`, 'must be task');
    }
    if (doc.confidence !== guide.confidence) {
      fail(`${path}.confidence`, `must be ${guide.confidence}`);
    }
    if (doc.reviewedAt !== guide.reviewedAt) {
      fail(`${path}.reviewedAt`, `must be ${guide.reviewedAt}`);
    }
    if (doc.nextReviewDue !== guide.nextReviewDue) {
      fail(`${path}.nextReviewDue`, `must be ${guide.nextReviewDue}`);
    }
  });

  deepDiveReaderPaths.forEach((readerPath) => {
    const id = `deep-dive-path:${readerPath.id}`;
    const path = `SEARCH_DOCUMENTS[${id}]`;
    const doc = expectSearchDoc(docsById, id, path);
    if (!doc) {
      return;
    }
    const expectedHref = `/deep-dives#deep-dive-path-${readerPath.id}`;
    if (doc.href !== expectedHref) {
      fail(`${path}.href`, `must be ${expectedHref}`);
    }
    if (doc.slug !== '/deep-dives') {
      fail(`${path}.slug`, 'must be /deep-dives');
    }
    if (doc.anchor !== `deep-dive-path-${readerPath.id}`) {
      fail(`${path}.anchor`, `must be deep-dive-path-${readerPath.id}`);
    }
    if (doc.type !== 'deep-dive-path') {
      fail(`${path}.type`, 'must be deep-dive-path');
    }
    if (doc.confidence !== readerPath.confidence) {
      fail(`${path}.confidence`, `must be ${readerPath.confidence}`);
    }
    if (doc.reviewedAt !== readerPath.reviewedAt) {
      fail(`${path}.reviewedAt`, `must be ${readerPath.reviewedAt}`);
    }
    if (doc.nextReviewDue !== readerPath.nextReviewDue) {
      fail(`${path}.nextReviewDue`, `must be ${readerPath.nextReviewDue}`);
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

  buildExpectedAnchoredSearchDocuments(collections, glossaryTerms, deepDiveReaderPaths).forEach((expected) => {
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
    if (expected.confidence && doc.confidence !== expected.confidence) {
      fail(`${path}.confidence`, `must be ${expected.confidence}`);
    }
    if (expected.reviewedAt && doc.reviewedAt !== expected.reviewedAt) {
      fail(`${path}.reviewedAt`, `must be ${expected.reviewedAt}`);
    }
    if (expected.nextReviewDue && doc.nextReviewDue !== expected.nextReviewDue) {
      fail(`${path}.nextReviewDue`, `must be ${expected.nextReviewDue}`);
    }
  });
}

function validateSearchSurface(collections, contentEntries, taskGuides, glossaryTerms, deepDiveReaderPaths, allowedConfidences) {
  const searchDocuments = readActualSearchDocuments();
  const anchorsByRoute = collectKnownRouteAnchors(collections, glossaryTerms, deepDiveReaderPaths);

  validateUnique('SEARCH_DOCUMENT_IDS', searchDocuments.map((doc) => ({ data: { id: doc.id } })));
  searchDocuments.forEach((doc) => {
    const path = `SEARCH_DOCUMENTS[${doc.id}]`;
    validateSearchDocumentMetadata(doc, path, allowedConfidences);
    validateInternalHref(doc.href, `${path}.href`, anchorsByRoute);
    if (doc.type === 'ecosystem') {
      if (!doc.content.includes('Directory posture:')) {
        fail(`${path}.content`, 'must include ecosystem directory posture');
      }
      if (!doc.content.includes('Source confidence:')) {
        fail(`${path}.content`, 'must include ecosystem source confidence');
      }
      if (/Status: (?:Active|Needs review)\./.test(doc.content)) {
        fail(`${path}.content`, 'must not index unverified project activity as ecosystem status');
      }
    }
  });
  validateExpectedSearchCoverage(searchDocuments, collections, contentEntries, taskGuides, glossaryTerms, deepDiveReaderPaths);

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
  const glossaryExplorerSource = readFileSync(glossaryExplorerPath, 'utf8');

  for (const prefix of ['governance', 'incident', 'research', 'milestone']) {
    if (!governanceSource.includes(`recordAnchor('${prefix}'`)) {
      fail('src/app/governance/page.tsx', `missing ${prefix} record anchors for search results`);
    }
  }
  if (!ecosystemSource.includes("recordAnchor('ecosystem'")) {
    fail('src/components/features/EcosystemFilterList.tsx', 'missing ecosystem record anchors for search results');
  }
  if (!glossaryPageSource.includes('GlossaryExplorer') || !glossaryExplorerSource.includes('term-${term.id}')) {
    fail('src/app/glossary/page.tsx', 'missing glossary term anchors for search results');
  }

  for (const field of ['"href"', '"type"', '"description"', '"confidence"', '"reviewedAt"', '"nextReviewDue"', '"sources"']) {
    if (!generatedSearchSource.includes(field)) {
      fail('src/lib/search/mdx-documents.generated.ts', `generated MDX search documents must include ${field}`);
    }
  }
}

const staticDataLastUpdated = getStringConst('STATIC_DATA_LAST_UPDATED');
const allowedConfidences = getDataConfidences();
const scope = getSourceScope();
const registryScope = getLiteralSourceScope(registryDeclarations, collectImportedSourceScope(registryFile));
const glossaryScope = getLiteralSourceScope(glossaryDeclarations, collectImportedSourceScope(glossaryFile));

validateSharedSourceReuse(staticFile, 'src/lib/data/static.ts');
validateSharedSourceReuse(registryFile, 'src/lib/content/registry.ts');

const chainRecords = readRecordArray('CHAIN_RECORDS', scope);
scope.chainCodes = chainRecords.map((record) => record.data.chain);

const collections = {
  CHAIN_RECORDS: chainRecords,
  ECOSYSTEM_PROJECT_RECORDS: readRecordArray('ECOSYSTEM_PROJECT_RECORDS', scope),
  RESEARCH_REPORT_RECORDS: readRecordArray('RESEARCH_REPORT_RECORDS', scope),
  SECURITY_INCIDENT_RECORDS: readRecordArray('SECURITY_INCIDENT_RECORDS', scope),
  GOVERNANCE_PROPOSAL_RECORDS: readRecordArray('GOVERNANCE_PROPOSAL_RECORDS', scope),
  PROTOCOL_MILESTONE_RECORDS: readRecordArray('PROTOCOL_MILESTONE_RECORDS', scope),
  TOKENOMICS_RECORDS: readRecordArray('TOKENOMICS_RECORDS', scope),
  SOURCE_MAP_SECTION_RECORDS: readRecordArray('SOURCE_MAP_SECTION_RECORDS', scope),
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
validateGovernanceTrackerStatus(collections.GOVERNANCE_PROPOSAL_RECORDS);
const contentEntries = readContentEntries(registryScope);
const glossaryTerms = readGlossaryTerms(glossaryScope);
const glossaryDefinitionPaths = readGlossaryDefinitionPaths(glossaryScope);

validateContentRegistry(contentEntries, allowedConfidences);
validateRouteSourcePostureUsage(contentEntries);
validateJourneyLinks(actualJourneyLinks, collections, glossaryTerms, actualDeepDiveReaderPaths);
validateHomeDecisionLinks(actualHomeDecisionLinks, collections, glossaryTerms, actualDeepDiveReaderPaths);
validateSourceChoiceDecisions(actualSourceChoiceDecisions, collections, glossaryTerms, actualDeepDiveReaderPaths);
validateTaskIntentGuides(actualTaskIntentGuides, allowedConfidences, collections, glossaryTerms, actualDeepDiveReaderPaths);
const knownAnchorsByRoute = collectKnownRouteAnchors(collections, glossaryTerms, actualDeepDiveReaderPaths);
validateDeepDiveReaderPaths(actualDeepDiveReaderPaths, contentEntries, allowedConfidences, knownAnchorsByRoute);
validateGlossaryTerms(glossaryTerms, allowedConfidences);
validateGlossaryDefinitionPaths(glossaryDefinitionPaths, glossaryTerms, collections, actualDeepDiveReaderPaths);
validateSearchSurface(collections, contentEntries, actualTaskIntentGuides, glossaryTerms, actualDeepDiveReaderPaths, allowedConfidences);

collections.RESEARCH_REPORT_RECORDS.forEach((record, index) => requireUrlInSources('RESEARCH_REPORT_RECORDS', record, index, 'url'));
collections.SECURITY_INCIDENT_RECORDS.forEach((record, index) => requireUrlInSources('SECURITY_INCIDENT_RECORDS', record, index, 'url'));
collections.GOVERNANCE_PROPOSAL_RECORDS.forEach((record, index) => requireUrlInSources('GOVERNANCE_PROPOSAL_RECORDS', record, index, 'sourceUrl'));

if (failures.length > 0) {
  console.error(failures.join('\n'));
  process.exit(1);
}

console.log('Curated data record validation passed.');
