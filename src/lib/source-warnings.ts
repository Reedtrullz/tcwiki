import type { NetworkStatusSourceWarning } from '@/lib/types';

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
