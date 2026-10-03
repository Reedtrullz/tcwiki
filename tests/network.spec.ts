import { test, expect, type Locator } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import { fulfillJson, mockSwapperFirstNetwork } from './helpers/thornode-mocks';
