export function normalizeReadinessWarningMessage(value) {
  return typeof value === 'string' ? value.trim() : '';
}

export function isNonBlockingReadinessWarning(detail) {
  return detail?.severity === 'review' && detail?.category === 'mimir-support';
}

export function partitionReadinessWarnings(warnings, details) {
  const messagePolicies = new Map();

  for (const detail of details) {
    const message = normalizeReadinessWarningMessage(detail?.message);
    if (!message) {
      continue;
    }

    const blocking = !isNonBlockingReadinessWarning(detail);
    messagePolicies.set(message, (messagePolicies.get(message) ?? false) || blocking);
  }

  const blocking = [];
  const nonBlocking = [];
  for (const warning of warnings) {
    const message = normalizeReadinessWarningMessage(warning);
    if (!message) {
      continue;
    }

    if (messagePolicies.get(message) === false) {
      nonBlocking.push(message);
    } else {
      blocking.push(message);
    }
  }

  return {
    blocking: [...new Set(blocking)],
    nonBlocking: [...new Set(nonBlocking)],
  };
}
