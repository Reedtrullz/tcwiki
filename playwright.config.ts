import { defineConfig, devices } from '@playwright/test';

const cloudflare = process.env.PLAYWRIGHT_RUNTIME === 'cloudflare';
const localBaseURL = cloudflare ? 'http://127.0.0.1:3015' : 'http://localhost:3000';
const externalBaseURL = process.env.PLAYWRIGHT_BASE_URL;

export default defineConfig({
  testDir: './tests',
  testMatch: '**/*.spec.ts',
  timeout: 60 * 1000,
  expect: { timeout: 5000 },
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'list',
  use: {
    baseURL: externalBaseURL || localBaseURL,
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'mobile-chromium',
      use: { ...devices['Pixel 7'] },
    },
  ],
  webServer: externalBaseURL
    ? undefined
    : {
        command: process.env.PLAYWRIGHT_WEB_SERVER_COMMAND || (cloudflare ? 'node scripts/start-cloudflare-candidate.mjs' : 'node scripts/start-playwright-server.mjs'),
        url: localBaseURL,
        reuseExistingServer: false,
        timeout: 120 * 1000,
      },
});
