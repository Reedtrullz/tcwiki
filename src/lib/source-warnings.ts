import type { NetworkStatusSourceWarning } from '@/lib/types';

export interface SourceWarningSignals {
  messages: string[];
  details: NetworkStatusSourceWarning[];
}

function isWarningDetail(value: unknown): value is NetworkStatusSourceWarning {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return false;
  }

  const detail = value as Record<string, unknown>;
  return ['critical', 'warning', 'review'].includes(String(detail.severity)) &&
    ['freshness', 'pinning', 'height-divergence', 'source-shape', 'mimir-parse', 'mimir-support', 'unknown-chain', 'unknown-operation', 'other'].includes(String(detail.category)) &&
    typeof detail.message === 'string' && detail.message.trim().length > 0 &&
    typeof detail.action === 'string' &&
    [detail.keys, detail.scopes].every((items) => items === undefined || (Array.isArray(items) && items.every((item) => typeof item === 'string')));
}

function unique<T>(values: T[]) {
  return [...new Set(values)];
}

export function uniqueSourceWarningDetails(details: NetworkStatusSourceWarning[]) {
  const seen = new Set<string>();
  return details.filter((detail) => {
    const key = JSON.stringify([detail.severity, detail.category, detail.message, detail.action, detail.keys ?? [], detail.scopes ?? []]);
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
}

export function collectSourceWarningSignals(value: unknown, seen = new Set<object>()): SourceWarningSignals {
  if (!value || typeof value !== 'object' || seen.has(value)) {
    return { messages: [], details: [] };
  }
  seen.add(value);

  const entries = Array.isArray(value)
    ? value.map((nested): [string, unknown] => ['', nested])
    : Object.entries(value);
  const messages: string[] = [];
  const details: NetworkStatusSourceWarning[] = [];

  for (const [key, nested] of entries) {
    if (key === 'sourceWarnings' || key === 'sourceWarningDetails') {
      if (!Array.isArray(nested)) {
        messages.push('Unrecognized source warning; warning contract needs review.');
        continue;
      }
      for (const warning of nested) {
        if (key === 'sourceWarnings' && typeof warning === 'string' && warning.trim()) {
          messages.push(warning);
        } else if (key === 'sourceWarningDetails' && isWarningDetail(warning)) {
          details.push(warning);
        } else {
          messages.push('Unrecognized source warning; warning contract needs review.');
        }
      }
    } else {
      const child = collectSourceWarningSignals(nested, seen);
      messages.push(...child.messages);
      details.push(...child.details);
    }
  }

  return { messages: unique(messages), details: uniqueSourceWarningDetails(details) };
}

function warningKeyCount(detail: NetworkStatusSourceWarning | undefined, message: string) {
  if (detail?.keys?.length) {
    return detail.keys.length;
  }

  const count = message.match(/^(\d+)\s+/)?.[1];
  if (count) {
    return Number(count);
  }

  const [, rawKeys] = message.split(':');
  if (!rawKeys) {
    return 0;
  }

  return rawKeys
    .replace(/\.$/, '')
    .split(',')
    .map((key) => key.trim())
    .filter(Boolean)
    .length;
}

export function summarizeSourceWarning(
  detail: NetworkStatusSourceWarning | undefined,
  fallbackMessage = 'Source warning needs review.'
) {
  const message = detail?.message?.trim() || fallbackMessage;
  const category = detail?.category;

  if (category === 'unknown-operation' || /operation-like Mimir keys?/i.test(message)) {
    const count = warningKeyCount(detail, message);
    return count > 0
      ? `${count} operation-like Mimir key${count === 1 ? '' : 's'} need review.`
      : 'Operation-like Mimir keys need review.';
  }

  if (category === 'unknown-chain' || /unknown chain-scoped Mimir keys?/i.test(message)) {
    const count = warningKeyCount(detail, message);
    return count > 0
      ? `${count} unknown chain-scoped Mimir key${count === 1 ? '' : 's'} need review.`
      : 'Unknown chain-scoped Mimir keys need review.';
  }

  if (category === 'mimir-support' || /operational-support Mimir keys?/i.test(message)) {
    const count = warningKeyCount(detail, message);
    return count > 0
      ? `${count} operational-support Mimir key${count === 1 ? '' : 's'} need review.`
      : 'Operational-support Mimir keys need review.';
  }

  return message.length > 220 ? `${message.slice(0, 217)}...` : message;
}
