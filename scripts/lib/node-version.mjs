export const REQUIRED_NODE_MAJOR = 22;

export function parseNodeMajor(version) {
  const normalized = typeof version === 'string' ? version.trim() : '';
  const match = /^v?(\d+)(?:\.|$)/.exec(normalized);
  if (!match) {
    throw new Error(`Could not parse Node.js version ${JSON.stringify(version)}.`);
  }

  return Number.parseInt(match[1], 10);
}

export function formatNodeVersion(version) {
  const normalized = typeof version === 'string' ? version.trim() : '';
  if (!normalized) {
    return 'unknown';
  }

  return normalized.startsWith('v') ? normalized : `v${normalized}`;
}

export function isSupportedNodeVersion(version = process.versions.node) {
  return parseNodeMajor(version) === REQUIRED_NODE_MAJOR;
}

export function unsupportedNodeVersionMessage(version = process.versions.node) {
  return [
    `THORChain Wiki requires Node.js ${REQUIRED_NODE_MAJOR}.x; current runtime is ${formatNodeVersion(version)}.`,
    'Run `nvm use` from the repository root before local proof, release smoke, or development scripts.',
  ].join(' ');
}

export function assertSupportedNodeVersion(version = process.versions.node) {
  if (!isSupportedNodeVersion(version)) {
    throw new Error(unsupportedNodeVersionMessage(version));
  }
}
