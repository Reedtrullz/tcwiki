import type {
  LearningProgressDocument,
  LearningProgressPathState,
  LearningProgressStepSnapshot,
} from '@/lib/types';

export const LEARNING_PROGRESS_STORAGE_KEY = 'thorchain-wiki:deep-dive-progress:v1';
export const MAX_LEARNING_PROGRESS_BYTES = 64 * 1024;
export const MAX_LEARNING_PROGRESS_RECORDS = 100;
const LEARNING_PATH_PARAMETER = 'learning_path';
const stableIdPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export interface LearningProgressPathDefinition {
  id: string;
  entryIds: readonly string[];
}

export interface LearningProgressStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

export type LearningProgressParseResult =
  | { ok: true; document: LearningProgressDocument; ignoredRecords: number }
  | { ok: false; error: 'too-large' | 'too-many-records' | 'malformed-json' | 'unsupported-version' | 'invalid-schema' };

export type LearningProgressReadResult =
  | { status: 'empty' }
  | { status: 'ready'; document: LearningProgressDocument; ignoredRecords: number }
  | { status: 'invalid'; error: Exclude<LearningProgressParseResult, { ok: true }>['error'] }
  | { status: 'unavailable' };

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function hasOnlyKeys(value: Record<string, unknown>, keys: readonly string[]): boolean {
  const actual = Object.keys(value);
  return actual.length === keys.length && actual.every((key) => keys.includes(key));
}

function isStableId(value: unknown): value is string {
  return typeof value === 'string' && value.length <= 120 && stableIdPattern.test(value);
}

function isReviewDate(value: unknown): value is string {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const parsed = new Date(`${value}T00:00:00.000Z`);
  return Number.isFinite(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
}

function isSavedTimestamp(value: unknown): value is string {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(value)) return false;
  const parsed = new Date(value);
  return Number.isFinite(parsed.getTime()) && parsed.toISOString() === value;
}

function readerPathHref(pathId: string): string {
  return `/deep-dives#deep-dive-path-${pathId}`;
}

function findPath(pathId: string, catalog: readonly LearningProgressPathDefinition[]) {
  return catalog.find((path) => path.id === pathId);
}

function isKnownStep(pathId: string, entryId: string, catalog: readonly LearningProgressPathDefinition[]): boolean {
  return Boolean(findPath(pathId, catalog)?.entryIds.includes(entryId));
}

function fail(error: Exclude<LearningProgressParseResult, { ok: true }>['error']): LearningProgressParseResult {
  return { ok: false, error };
}

export function parseLearningProgress(raw: string, catalog: readonly LearningProgressPathDefinition[]): LearningProgressParseResult {
  if (new TextEncoder().encode(raw).byteLength > MAX_LEARNING_PROGRESS_BYTES) return fail('too-large');

  let value: unknown;
  try {
    value = JSON.parse(raw);
  } catch {
    return fail('malformed-json');
  }

  if (!isRecord(value) || !('version' in value)) return fail('invalid-schema');
  if (value.version !== 1) return fail('unsupported-version');
  if (!hasOnlyKeys(value, ['version', 'selectedPathId', 'paths'])) return fail('invalid-schema');
  if (!(value.selectedPathId === null || isStableId(value.selectedPathId)) || !Array.isArray(value.paths)) {
    return fail('invalid-schema');
  }

  let recordCount = value.paths.length;
  for (const candidate of value.paths) {
    if (!isRecord(candidate)) return fail('invalid-schema');
    if (candidate.bookmark !== null) recordCount += 1;
    if (!Array.isArray(candidate.readSteps)) return fail('invalid-schema');
    recordCount += candidate.readSteps.length;
  }
  if (recordCount > MAX_LEARNING_PROGRESS_RECORDS) return fail('too-many-records');

  const currentPathIds = new Set(catalog.map((path) => path.id));
  const seenPathIds = new Set<string>();
  const normalizedPaths: LearningProgressPathState[] = [];
  let ignoredRecords = 0;
  let selectedPathId = value.selectedPathId as string | null;

  if (selectedPathId && !currentPathIds.has(selectedPathId)) {
    selectedPathId = null;
    ignoredRecords += 1;
  }

  for (const candidate of value.paths) {
    if (!isRecord(candidate) || !hasOnlyKeys(candidate, ['pathId', 'pathHref', 'bookmark', 'readSteps'])) {
      return fail('invalid-schema');
    }
    if (!isStableId(candidate.pathId) || candidate.pathHref !== readerPathHref(candidate.pathId) || !Array.isArray(candidate.readSteps)) {
      return fail('invalid-schema');
    }
    const pathId = candidate.pathId;
    if (seenPathIds.has(pathId)) return fail('invalid-schema');
    seenPathIds.add(pathId);

    let bookmark: LearningProgressPathState['bookmark'] = null;
    if (candidate.bookmark !== null) {
      if (!isRecord(candidate.bookmark) || !hasOnlyKeys(candidate.bookmark, ['entryId', 'reviewedAt', 'savedAt']) ||
          !isStableId(candidate.bookmark.entryId) || !isReviewDate(candidate.bookmark.reviewedAt) || !isSavedTimestamp(candidate.bookmark.savedAt)) {
        return fail('invalid-schema');
      }
      bookmark = {
        entryId: candidate.bookmark.entryId,
        reviewedAt: candidate.bookmark.reviewedAt,
        savedAt: candidate.bookmark.savedAt,
      };
    }

    const readSteps: LearningProgressStepSnapshot[] = [];
    const seenEntryIds = new Set<string>();
    for (const step of candidate.readSteps) {
      if (!isRecord(step) || !hasOnlyKeys(step, ['entryId', 'reviewedAt']) ||
          !isStableId(step.entryId) || !isReviewDate(step.reviewedAt) || seenEntryIds.has(step.entryId)) {
        return fail('invalid-schema');
      }
      seenEntryIds.add(step.entryId);
      readSteps.push({ entryId: step.entryId, reviewedAt: step.reviewedAt });
    }

    if (!currentPathIds.has(pathId)) {
      ignoredRecords += 1 + readSteps.length + (bookmark ? 1 : 0);
      continue;
    }

    if (bookmark && !isKnownStep(pathId, bookmark.entryId, catalog)) {
      bookmark = null;
      ignoredRecords += 1;
    }
    const validReadSteps = readSteps.filter((step) => {
      const valid = isKnownStep(pathId, step.entryId, catalog);
      if (!valid) ignoredRecords += 1;
      return valid;
    });

    normalizedPaths.push({ pathId, pathHref: readerPathHref(pathId), bookmark, readSteps: validReadSteps });
  }

  return {
    ok: true,
    document: { version: 1, selectedPathId, paths: normalizedPaths },
    ignoredRecords,
  };
}

export function mergeLearningPathUrl(
  currentHref: string,
  pathId: string | null,
  catalog: readonly LearningProgressPathDefinition[],
): string {
  if (pathId !== null && !findPath(pathId, catalog)) {
    throw new Error('Choose a current reader path before updating the URL.');
  }
  const current = new URL(currentHref);
  if (pathId === null) current.searchParams.delete(LEARNING_PATH_PARAMETER);
  else current.searchParams.set(LEARNING_PATH_PARAMETER, pathId);
  return `${current.pathname}${current.search}${current.hash}`;
}

export function createLearningProgress(pathId: string, catalog: readonly LearningProgressPathDefinition[]): LearningProgressDocument {
  const path = findPath(pathId, catalog);
  if (!path) throw new Error('Choose a current reader path before saving progress.');
  return {
    version: 1,
    selectedPathId: pathId,
    paths: [{ pathId, pathHref: readerPathHref(pathId), bookmark: null, readSteps: [] }],
  };
}

export function selectLearningPath(
  document: LearningProgressDocument,
  pathId: string,
  catalog: readonly LearningProgressPathDefinition[],
): LearningProgressDocument {
  const fresh = createLearningProgress(pathId, catalog);
  const paths = document.paths.some((path) => path.pathId === pathId)
    ? document.paths
    : [...document.paths, fresh.paths[0]];
  return { ...document, selectedPathId: pathId, paths };
}

export function markLearningStepRead(
  document: LearningProgressDocument,
  pathId: string,
  entryId: string,
  reviewedAt: string,
  catalog: readonly LearningProgressPathDefinition[],
): LearningProgressDocument {
  if (!isKnownStep(pathId, entryId, catalog) || !isReviewDate(reviewedAt)) throw new Error('Choose a current path step with a valid review date.');
  const withPath = selectLearningPath(document, pathId, catalog);
  return {
    ...withPath,
    paths: withPath.paths.map((path) => path.pathId !== pathId ? path : {
      ...path,
      readSteps: [...path.readSteps.filter((step) => step.entryId !== entryId), { entryId, reviewedAt }],
    }),
  };
}

export function bookmarkLearningStep(
  document: LearningProgressDocument,
  pathId: string,
  entryId: string,
  reviewedAt: string,
  savedAt: string,
  catalog: readonly LearningProgressPathDefinition[],
): LearningProgressDocument {
  if (!isKnownStep(pathId, entryId, catalog) || !isReviewDate(reviewedAt) || !isSavedTimestamp(savedAt)) {
    throw new Error('Choose a current path step and save it with valid dates.');
  }
  const withPath = selectLearningPath(document, pathId, catalog);
  return {
    ...withPath,
    paths: withPath.paths.map((path) => path.pathId !== pathId ? path : {
      ...path,
      bookmark: { entryId, reviewedAt, savedAt },
    }),
  };
}

export function readLearningProgress(
  storage: LearningProgressStorage | null,
  catalog: readonly LearningProgressPathDefinition[],
): LearningProgressReadResult {
  if (!storage) return { status: 'unavailable' };
  let raw: string | null;
  try {
    raw = storage.getItem(LEARNING_PROGRESS_STORAGE_KEY);
  } catch {
    return { status: 'unavailable' };
  }
  if (raw === null) return { status: 'empty' };
  const parsed = parseLearningProgress(raw, catalog);
  return parsed.ok
    ? { status: 'ready', document: parsed.document, ignoredRecords: parsed.ignoredRecords }
    : { status: 'invalid', error: parsed.error };
}

export function saveLearningProgress(
  storage: LearningProgressStorage | null,
  document: LearningProgressDocument,
  catalog: readonly LearningProgressPathDefinition[],
): { ok: true } | { ok: false; reason: 'unavailable' | 'too-large' | 'invalid' } {
  if (!storage) return { ok: false, reason: 'unavailable' };
  let raw: string;
  try {
    raw = JSON.stringify(document);
  } catch {
    return { ok: false, reason: 'invalid' };
  }
  if (new TextEncoder().encode(raw).byteLength > MAX_LEARNING_PROGRESS_BYTES) return { ok: false, reason: 'too-large' };
  const parsed = parseLearningProgress(raw, catalog);
  if (!parsed.ok) return { ok: false, reason: parsed.error === 'too-large' ? 'too-large' : 'invalid' };
  try {
    storage.setItem(LEARNING_PROGRESS_STORAGE_KEY, JSON.stringify(parsed.document));
    return { ok: true };
  } catch {
    return { ok: false, reason: 'unavailable' };
  }
}

export function removeLearningProgress(
  storage: LearningProgressStorage | null,
): { ok: true } | { ok: false; reason: 'unavailable' } {
  if (!storage) return { ok: false, reason: 'unavailable' };
  try {
    storage.removeItem(LEARNING_PROGRESS_STORAGE_KEY);
    return { ok: true };
  } catch {
    return { ok: false, reason: 'unavailable' };
  }
}
