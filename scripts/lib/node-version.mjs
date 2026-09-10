export const REQUIRED_NODE_MAJOR = 22;
export const REQUIRED_NODE_MIN_MINOR = 12;

function parseNodeVersionParts(version) {
  const normalized = typeof version === 'string' ? version.trim() : '';
  const match = /^v?(\d+)(?:\.(\d+))?(?:\.|$)/.exec(normalized);
  if (!match) {
    throw new Error(`Could not parse Node.js version ${JSON.stringify(version)}.`);
  }

  return {
    major: Number.parseInt(match[1], 10),
    minor: match[2] ? Number.parseInt(match[2], 10) : 0,
  };
}

export function parseNodeMajor(version) {
  return parseNodeVersionParts(version).major;
}

export function formatNodeVersion(version) {
  const normalized = typeof version === 'string' ? version.trim() : '';
  if (!normalized) {
    return 'unknown';
  }

  return normalized.startsWith('v') ? normalized : `v${normalized}`;
}

export function isSupportedNodeVersion(version = process.versions.node) {
  const { major, minor } = parseNodeVersionParts(version);
  return major === REQUIRED_NODE_MAJOR && minor >= REQUIRED_NODE_MIN_MINOR;
}

export function unsupportedNodeVersionMessage(version = process.versions.node) {
  return [
    `THORChain Wiki requires Node.js >=${REQUIRED_NODE_MAJOR}.${REQUIRED_NODE_MIN_MINOR}.0 <${REQUIRED_NODE_MAJOR + 1}; current runtime is ${formatNodeVersion(version)}.`,
    'Run `nvm use` from the repository root before local proof, release smoke, or development scripts.',
  ].join(' ');
}

export function assertSupportedNodeVersion(version = process.versions.node) {
  if (!isSupportedNodeVersion(version)) {
    throw new Error(unsupportedNodeVersionMessage(version));
  }
}
