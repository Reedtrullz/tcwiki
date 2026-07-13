#!/usr/bin/env node
import { assertSupportedNodeVersion } from './lib/node-version.mjs';

try {
  assertSupportedNodeVersion();
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
}
