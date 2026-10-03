'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import {
  MAX_LEARNING_PROGRESS_BYTES,
  bookmarkLearningStep,
  createLearningProgress,
  markLearningStepRead,
  mergeLearningPathUrl,
  parseLearningProgress,
  readLearningProgress,
  removeLearningProgress,
  saveLearningProgress,
  selectLearningPath,
  type LearningProgressPathDefinition,
  type LearningProgressStorage,
} from '@/lib/learning-progress';
import { replaceExplorerUrl } from '@/lib/explorer-url';
import type { LearningProgressDocument } from '@/lib/types';

interface LearningProgressEntryOption {
  id: string;
  title: string;
  href: string;
  reviewedAt: string;
}

interface LearningProgressPathOption {
  id: string;
  title: string;
  entries: LearningProgressEntryOption[];
}

interface DeepDiveLearningProgressProps {
  entryId: string;
  paths: LearningProgressPathOption[];
  catalog: LearningProgressPathDefinition[];
}

type StorageState = 'loading' | 'empty' | 'enabled' | 'invalid' | 'unavailable';

function browserStorage(): LearningProgressStorage | null {
  if (typeof window === 'undefined') return null;
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

function parseErrorMessage(error: string): string {
  if (error === 'unsupported-version') return 'This progress file uses a version this page cannot read. Import a version 1 file or reset the saved progress.';
  if (error === 'too-large') return 'This progress file is larger than 64 KiB.';
  if (error === 'too-many-records') return 'This progress file contains more than 100 records.';
  if (error === 'malformed-json') return 'This progress file is not valid JSON.';
  return 'This progress file does not match the supported learning-progress format.';
}

function entryPath(entry: LearningProgressEntryOption, pathId: string): string {
  const target = new URL(entry.href, 'https://wiki.invalid');
  target.searchParams.set('learning_path', pathId);
  return `${target.pathname}${target.search}${target.hash}`;
}

export function DeepDiveLearningProgress({ entryId, paths, catalog }: DeepDiveLearningProgressProps) {
  const [storageState, setStorageState] = useState<StorageState>('loading');
  const [progress, setProgress] = useState<LearningProgressDocument | null>(null);
  const [selectedPathId, setSelectedPathId] = useState('');
  const [notice, setNotice] = useState('');
  const [showRecoveryLink, setShowRecoveryLink] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);

  useEffect(() => {
    let cancelled = false;
    queueMicrotask(() => {
      if (cancelled) return;
      const requestedPathId = new URL(window.location.href).searchParams.get('learning_path');
      const requestedPath = paths.find((path) => path.id === requestedPathId);
      const stored = readLearningProgress(browserStorage(), catalog);

      if (stored.status === 'ready') {
        setProgress(stored.document);
        setStorageState('enabled');
        const savedPath = paths.find((path) => path.id === stored.document.selectedPathId);
        const selected = requestedPath?.id ?? (!requestedPathId ? savedPath?.id : undefined) ?? '';
        setSelectedPathId(selected);
        if (stored.ignoredRecords > 0) {
          setNotice(`${stored.ignoredRecords} saved item${stored.ignoredRecords === 1 ? ' was' : 's were'} from a path or article that has changed and ${stored.ignoredRecords === 1 ? 'was' : 'were'} ignored.`);
          setShowRecoveryLink(true);
        }
        if (!requestedPathId && savedPath) {
          try {
            replaceExplorerUrl(mergeLearningPathUrl(window.location.href, savedPath.id, catalog), ['learning_path']);
          } catch {
            setNotice('Saved progress loaded, but the learning_path URL could not be updated.');
          }
        }
      } else if (stored.status === 'invalid') {
        setStorageState('invalid');
        setNotice(`Saved progress could not be read. ${parseErrorMessage(stored.error)}`);
      } else if (stored.status === 'unavailable') {
        setStorageState('unavailable');
        setNotice('Browser storage is unavailable here. Reader paths and article links still work.');
      } else {
        setStorageState('empty');
      }

      if (requestedPath) setSelectedPathId(requestedPath.id);
      else if (requestedPathId) setNotice('That learning_path value is not a current path for this article. Choose a path to update it.');
    });
    return () => { cancelled = true; };
  }, [entryId, paths, catalog]);

  const selectedPath = paths.find((path) => path.id === selectedPathId);
  const currentEntry = selectedPath?.entries.find((entry) => entry.id === entryId);
  const pathProgress = progress?.paths.find((path) => path.pathId === selectedPathId);
  const bookmark = pathProgress?.bookmark ?? null;
  const bookmarkedEntry = selectedPath?.entries.find((entry) => entry.id === bookmark?.entryId);

  function persist(next: LearningProgressDocument, successMessage: string): boolean {
    const result = saveLearningProgress(browserStorage(), next, catalog);
    if (!result.ok) {
      setNotice(result.reason === 'too-large'
        ? 'Progress is over the 64 KiB limit. Reset old steps or export a copy before continuing.'
        : 'Progress could not be saved in this browser. Existing article and reader-path links remain available.');
      return false;
    }
    setProgress(next);
    setStorageState('enabled');
    setNotice(successMessage);
    setShowRecoveryLink(false);
    return true;
  }

  function choosePath(pathId: string) {
    if (!paths.some((path) => path.id === pathId)) return;
    setSelectedPathId(pathId);
    setNotice('');
    try {
      replaceExplorerUrl(mergeLearningPathUrl(window.location.href, pathId, catalog), ['learning_path']);
    } catch {
      setNotice('The selected path is shown here, but its URL could not be updated.');
    }
    if (progress) persist(selectLearningPath(progress, pathId, catalog), 'Selected path saved on this browser.');
  }

  function enableProgress() {
    if (!selectedPath) {
      setNotice('Choose a reader path before enabling local progress.');
      return;
    }
    persist(createLearningProgress(selectedPath.id, catalog), 'Local progress is enabled for this browser. Nothing is sent to an account or analytics service.');
  }

  function markCurrentStepRead() {
    if (!progress || !selectedPath || !currentEntry) return;
    const next = markLearningStepRead(progress, selectedPath.id, currentEntry.id, currentEntry.reviewedAt, catalog);
    persist(next, 'This step is marked as read on this browser. It does not record understanding or competence.');
  }

  function saveBookmark() {
    if (!progress || !selectedPath || !currentEntry) return;
    const next = bookmarkLearningStep(progress, selectedPath.id, currentEntry.id, currentEntry.reviewedAt, new Date().toISOString(), catalog);
    persist(next, 'Bookmark saved on this browser with the article review date.');
  }

  function resetProgress() {
    const result = removeLearningProgress(browserStorage());
    if (!result.ok) {
      setNotice('Saved progress could not be removed because browser storage is unavailable.');
      return;
    }
    setProgress(null);
    setStorageState('empty');
    setShowRecoveryLink(false);
    setNotice('Local progress was disabled and deleted from this browser.');
  }

  function exportProgress() {
    if (!progress) return;
    const blob = new Blob([JSON.stringify(progress, null, 2)], { type: 'application/json' });
    const href = URL.createObjectURL(blob);
    const link = window.document.createElement('a');
    link.href = href;
    link.download = 'thorchain-wiki-learning-progress.json';
    link.click();
    window.setTimeout(() => URL.revokeObjectURL(href), 1000);
    setNotice('A JSON copy of this browser’s learning progress was exported.');
  }

  async function importProgress() {
    if (!importFile) return;
    if (importFile.size > MAX_LEARNING_PROGRESS_BYTES) {
      setNotice(parseErrorMessage('too-large'));
      return;
    }
    let raw: string;
    try {
      raw = await importFile.text();
    } catch {
      setNotice('The selected progress file could not be read.');
      return;
    }
    const parsed = parseLearningProgress(raw, catalog);
    if (!parsed.ok) {
      setNotice(parseErrorMessage(parsed.error));
      return;
    }
    const result = saveLearningProgress(browserStorage(), parsed.document, catalog);
    if (!result.ok) {
      setNotice('The imported progress could not be saved in this browser. Reader navigation remains available.');
      return;
    }
    setProgress(parsed.document);
    setStorageState('enabled');
    const importedPath = paths.find((path) => path.id === parsed.document.selectedPathId);
    if (importedPath) {
      setSelectedPathId(importedPath.id);
    }
    setShowRecoveryLink(parsed.ignoredRecords > 0);
    let urlNotice = '';
    if (importedPath) {
      try {
        replaceExplorerUrl(mergeLearningPathUrl(window.location.href, importedPath.id, catalog), ['learning_path']);
      } catch {
        urlNotice = ' The progress was saved, but the learning_path URL could not be updated.';
      }
    }
    setNotice((parsed.ignoredRecords > 0
      ? `${parsed.ignoredRecords} obsolete path or article item${parsed.ignoredRecords === 1 ? ' was' : 's were'} ignored during import.`
      : 'Progress imported and saved on this browser.') + urlNotice);
  }

  function readStepIds(): Set<string> {
    return new Set(pathProgress?.readSteps.map((step) => step.entryId) ?? []);
  }

  if (paths.length === 0) return null;
  const readSteps = readStepIds();

  return (
    <section aria-labelledby="deep-dive-learning-progress-title" className="my-6 rounded-lg border border-border bg-surface-elevated/60 p-4 print:hidden">
      <h2 id="deep-dive-learning-progress-title" className="text-sm font-semibold text-slate-100">Your reading path</h2>
      <p className="mt-1 text-xs leading-relaxed text-slate-400">
        Path selection stays in this URL. Progress is stored only on this browser after you enable it. Reading marks describe navigation, not understanding or competence.
      </p>

      <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-end">
        <label className="flex-1 text-xs font-medium text-slate-300">
          Choose a reader path
          <select
            aria-label="Reader path to track"
            className="mt-1 block w-full min-w-0 max-w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-slate-100"
            value={selectedPathId}
            disabled={storageState === 'loading'}
            onChange={(event) => choosePath(event.target.value)}
          >
            <option value="">Choose a path</option>
            {paths.map((path) => <option key={path.id} value={path.id}>{path.title}</option>)}
          </select>
        </label>
        {storageState !== 'enabled' && storageState !== 'invalid' && (
          <button
            type="button"
            disabled={storageState === 'loading' || !selectedPath}
            onClick={enableProgress}
            className="rounded-md border border-accent/40 bg-accent/10 px-3 py-2 text-xs font-semibold text-slate-100 hover:border-accent/70 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Enable local progress on this browser
          </button>
        )}
      </div>

      {selectedPath && (
        <div className="mt-4 border-t border-border pt-3">
          <ol className="grid gap-2 sm:grid-cols-2">
            {selectedPath.entries.map((entry, index) => (
              <li key={entry.id} className="rounded-md border border-border bg-surface p-3 text-xs">
                <Link href={entryPath(entry, selectedPath.id)} className="font-medium text-slate-200 underline-offset-4 hover:text-accent hover:underline">
                  {index + 1}. {entry.title}
                </Link>
                <span className="mt-1 block text-slate-500">
                  {readSteps.has(entry.id)
                    ? `Marked as read · article review date ${pathProgress?.readSteps.find((step) => step.entryId === entry.id)?.reviewedAt ?? ''}`
                    : 'Not marked as read'}
                </span>
              </li>
            ))}
          </ol>

          {storageState === 'enabled' && currentEntry && (
            <div className="mt-3 flex flex-wrap gap-2">
              <button type="button" onClick={markCurrentStepRead} className="rounded-md border border-border px-3 py-2 text-xs font-medium text-slate-200 hover:border-accent/40">
                Mark this step as read
              </button>
              <button type="button" onClick={saveBookmark} className="rounded-md border border-border px-3 py-2 text-xs font-medium text-slate-200 hover:border-accent/40">
                Bookmark this step
              </button>
              <button type="button" onClick={exportProgress} className="rounded-md border border-border px-3 py-2 text-xs font-medium text-slate-200 hover:border-accent/40">
                Export JSON
              </button>
              <button type="button" onClick={resetProgress} className="rounded-md border border-border px-3 py-2 text-xs font-medium text-slate-300 hover:border-amber-400/50">
                Disable and delete local progress
              </button>
            </div>
          )}

          {bookmark && bookmarkedEntry && (
            <p className="mt-3 text-xs text-slate-400">
              <Link href={entryPath(bookmarkedEntry, selectedPath.id)} className="font-medium text-accent underline-offset-4 hover:underline">
                Resume from bookmark: {bookmarkedEntry.title}
              </Link>
              <span className="ml-2">Saved {bookmark.savedAt}; article review date {bookmark.reviewedAt}.</span>
            </p>
          )}
          {bookmark && bookmarkedEntry && bookmarkedEntry.reviewedAt > bookmark.reviewedAt && (
            <p role="status" className="mt-2 text-xs text-amber-200">
              This article’s authored review date is newer than the date saved with your bookmark ({bookmark.reviewedAt} → {bookmarkedEntry.reviewedAt}).
            </p>
          )}
          <Link href={`/deep-dives#deep-dive-path-${selectedPath.id}`} className="mt-3 inline-block text-xs text-slate-400 underline-offset-4 hover:text-accent hover:underline">
            Open this path in the reader-path list
          </Link>
        </div>
      )}

      <details className="mt-4 border-t border-border pt-3">
        <summary className="cursor-pointer text-xs font-medium text-slate-300">Import a progress file</summary>
        <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:items-center">
          <label className="text-xs text-slate-400">
            Version 1 JSON, at most 64 KiB. Import replaces progress saved on this browser.
            <input
              className="mt-1 block max-w-full text-xs"
              type="file"
              accept="application/json,.json"
              aria-label="Progress JSON file"
              onChange={(event) => setImportFile(event.target.files?.[0] ?? null)}
            />
          </label>
          <button type="button" disabled={!importFile} onClick={() => void importProgress()} className="rounded-md border border-border px-3 py-2 text-xs font-medium text-slate-200 disabled:opacity-50">
            Import and save on this browser
          </button>
        </div>
      </details>

      {storageState === 'invalid' && (
        <button type="button" onClick={resetProgress} className="mt-3 rounded-md border border-border px-3 py-2 text-xs font-medium text-slate-300 hover:border-amber-400/50">
          Reset unreadable saved progress
        </button>
      )}

      {notice && <p role="status" aria-live="polite" className="mt-3 text-xs leading-relaxed text-slate-300">{notice}</p>}
      {showRecoveryLink && (
        <p className="mt-2 text-xs">
          <Link href="/deep-dives#deep-dive-reader-paths" className="text-accent underline-offset-4 hover:underline">Browse current reader paths</Link>
        </p>
      )}
    </section>
  );
}
