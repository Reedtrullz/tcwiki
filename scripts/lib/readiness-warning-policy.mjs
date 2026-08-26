export function normalizeReadinessWarningMessage(value) {
  return typeof value === 'string' ? value.trim() : '';
}

export function isNonBlockingReadinessWarning(detail) {
  if (detail?.severity !== 'review') {
    return false;
  }

  // Chain-scoped keys only reach the unknown-chain classifier when their chain
  // is absent from inbound_addresses, so they cannot pause routable flows;
  // the warning itself stays visible for review.
  return detail?.category === 'mimir-support' || detail?.category === 'unknown-chain';
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
