import { describe, expect, it } from 'vitest';
import {
  assertSupportedNodeVersion,
  formatNodeVersion,
  isSupportedNodeVersion,
  parseNodeMajor,
  unsupportedNodeVersionMessage,
} from '../../scripts/lib/node-version.mjs';

describe('Node version guard', () => {
  it('accepts only Node 22 major versions', () => {
    expect(isSupportedNodeVersion('22.22.3')).toBe(true);
    expect(isSupportedNodeVersion('v22.0.0')).toBe(true);
    expect(isSupportedNodeVersion('20.19.5')).toBe(false);
    expect(isSupportedNodeVersion('23.0.0')).toBe(false);
  });

  it('parses and formats version strings used by process.version and process.versions.node', () => {
    expect(parseNodeMajor('22.22.3')).toBe(22);
    expect(parseNodeMajor('v22.22.3')).toBe(22);
    expect(formatNodeVersion('22.22.3')).toBe('v22.22.3');
    expect(formatNodeVersion('v22.22.3')).toBe('v22.22.3');
  });

  it('fails closed on malformed or unsupported versions with a useful local fix', () => {
    expect(() => parseNodeMajor('banana')).toThrow(/Could not parse Node\.js version/);
    expect(() => assertSupportedNodeVersion('20.19.5')).toThrow(/requires Node\.js 22\.x/);
    expect(unsupportedNodeVersionMessage('20.19.5')).toContain('Run `nvm use`');
  });
});
