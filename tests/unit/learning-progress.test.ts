import { describe, expect, it, vi } from 'vitest';
import {
  LEARNING_PROGRESS_STORAGE_KEY,
  MAX_LEARNING_PROGRESS_BYTES,
  bookmarkLearningStep,
  createLearningProgress,
  markLearningStepRead,
  mergeLearningPathUrl,
  parseLearningProgress,
  readLearningProgress,
  removeLearningProgress,
  saveLearningProgress,
} from '@/lib/learning-progress';
import { DEEP_DIVE_READER_PATHS, getContentEntry } from '@/lib/content/registry';
import type { LearningProgressDocument } from '@/lib/types';

const path = DEEP_DIVE_READER_PATHS[0];
const catalog = DEEP_DIVE_READER_PATHS.map(({ id, entryIds }) => ({ id, entryIds }));
const entryId = path.entryIds[0];
const reviewedAt = getContentEntry(entryId).reviewedAt;
const savedAt = '2026-10-03T09:30:00.000Z';

function documentWith(overrides: Partial<LearningProgressDocument> = {}): LearningProgressDocument {
  return {
    version: 1,
    selectedPathId: path.id,
    paths: [{
      pathId: path.id,
      pathHref: `/deep-dives#deep-dive-path-${path.id}`,
      bookmark: { entryId, reviewedAt, savedAt },
      readSteps: [{ entryId, reviewedAt }],
    }],
    ...overrides,
  };
}

function storage(initial: string | null = null) {
  const values = new Map<string, string>();
  if (initial !== null) values.set(LEARNING_PROGRESS_STORAGE_KEY, initial);
  return {
    values,
    getItem: vi.fn((key: string) => values.get(key) ?? null),
    setItem: vi.fn((key: string, value: string) => { values.set(key, value); }),
    removeItem: vi.fn((key: string) => { values.delete(key); }),
  };
}

describe('browser-local learning progress boundaries', () => {
  it('sets only the valid learning_path parameter and preserves unrelated query and fragment state', () => {
    expect(mergeLearningPathUrl(
      'https://wiki.test/deep-dives/clp?keep=a&learning_path=old&keep=b#evidence-ladder',
      path.id,
      catalog,
    )).toBe(`/deep-dives/clp?keep=a&learning_path=${path.id}&keep=b#evidence-ladder`);
    expect(mergeLearningPathUrl(
      `https://wiki.test/deep-dives/clp?keep=a&learning_path=${path.id}#evidence-ladder`,
      null,
      catalog,
    )).toBe('/deep-dives/clp?keep=a#evidence-ladder');
    expect(() => mergeLearningPathUrl('https://wiki.test/deep-dives/clp?keep=a#part', 'javascript:alert(1)', catalog)).toThrow();
  });

  it('round-trips the bounded versioned schema and rejects unsafe or invalid data', () => {
    const valid = JSON.stringify(documentWith());
    expect(parseLearningProgress(valid, catalog)).toMatchObject({ ok: true, ignoredRecords: 0 });
    expect(parseLearningProgress(JSON.stringify({ ...documentWith(), version: 99 }), catalog)).toMatchObject({ ok: false, error: 'unsupported-version' });
    expect(parseLearningProgress(JSON.stringify(documentWith({ paths: [{ ...documentWith().paths[0], pathHref: 'https://evil.test/' }] })), catalog))
      .toMatchObject({ ok: false, error: 'invalid-schema' });
    expect(parseLearningProgress(JSON.stringify(documentWith({ paths: [{
      ...documentWith().paths[0],
      bookmark: { entryId, reviewedAt: '2026-02-30', savedAt },
    }] })), catalog)).toMatchObject({ ok: false, error: 'invalid-schema' });
    expect(parseLearningProgress(' '.repeat(MAX_LEARNING_PROGRESS_BYTES + 1), catalog)).toMatchObject({ ok: false, error: 'too-large' });
    expect(parseLearningProgress('{', catalog)).toMatchObject({ ok: false, error: 'malformed-json' });
  });

  it('drops removed content IDs while retaining a safe link to the current reader path', () => {
    const current = documentWith().paths[0];
    const parsed = parseLearningProgress(JSON.stringify({
      ...documentWith(),
      paths: [{ ...current, bookmark: { entryId: 'deep-dive-removed-entry', reviewedAt, savedAt }, readSteps: [{ entryId, reviewedAt }, { entryId: 'deep-dive-removed-entry', reviewedAt }] }],
    }), catalog);
    expect(parsed).toMatchObject({ ok: true, ignoredRecords: 2 });
    if (parsed.ok) {
      expect(parsed.document.paths[0]).toMatchObject({
        pathHref: `/deep-dives#deep-dive-path-${path.id}`,
        bookmark: null,
        readSteps: [{ entryId, reviewedAt }],
      });
    }
  });

  it('bounds the total number of imported path, bookmark, and read-step records', () => {
    const tooMany = documentWith({ paths: Array.from({ length: 101 }, (_, index) => ({
      pathId: `obsolete-path-${index}`,
      pathHref: `/deep-dives#deep-dive-path-obsolete-path-${index}`,
      bookmark: null,
      readSteps: [],
    })) });
    expect(parseLearningProgress(JSON.stringify(tooMany), catalog)).toMatchObject({ ok: false, error: 'too-many-records' });
  });

  it('treats inaccessible, malformed, quota-full, and reset storage as recoverable', () => {
    const blockedRead = { getItem: () => { throw new Error('private mode'); }, setItem: () => {}, removeItem: () => {} };
    expect(readLearningProgress(blockedRead, catalog)).toMatchObject({ status: 'unavailable' });
    expect(readLearningProgress(storage('{'), catalog)).toMatchObject({ status: 'invalid', error: 'malformed-json' });

    const blockedWrite = { getItem: () => null, setItem: () => { throw new Error('quota'); }, removeItem: () => {} };
    const doc = createLearningProgress(path.id, catalog);
    expect(saveLearningProgress(blockedWrite, doc, catalog)).toMatchObject({ ok: false, reason: 'unavailable' });

    const blockedReset = { getItem: () => null, setItem: () => {}, removeItem: () => { throw new Error('private mode'); } };
    expect(removeLearningProgress(blockedReset)).toMatchObject({ ok: false, reason: 'unavailable' });
  });

  it('reads without writing, and stores review-date snapshots only on explicit read or bookmark actions', () => {
    const store = storage();
    expect(readLearningProgress(store, catalog)).toEqual({ status: 'empty' });
    expect(store.setItem).not.toHaveBeenCalled();

    const initial = createLearningProgress(path.id, catalog);
    const read = markLearningStepRead(initial, path.id, entryId, reviewedAt, catalog);
    expect(read.paths[0].readSteps).toEqual([{ entryId, reviewedAt }]);
    const bookmarked = bookmarkLearningStep(read, path.id, entryId, reviewedAt, savedAt, catalog);
    expect(bookmarked.paths[0].bookmark).toEqual({ entryId, reviewedAt, savedAt });
    expect(saveLearningProgress(store, bookmarked, catalog)).toEqual({ ok: true });
    expect(store.getItem(LEARNING_PROGRESS_STORAGE_KEY)).toContain(savedAt);
  });
});
