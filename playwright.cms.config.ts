import { defineConfig, devices } from '@playwright/test';
import { SITE_URL } from './tests/integration/constants';

/*
  CMS integration suite — the migration proof.

  Unlike the default suite (playwright.config.ts), this one boots a REAL
  Payload CMS on SQLite, seeds it, builds Astro against it, and serves that
  build. Run it with `npm run test:e2e:cms`.

  It is deliberately a SEPARATE config so the default suite stays offline and
  deterministic: `npm run test:e2e` must keep passing with no CMS at all.

  Serial, single worker: the workflow specs create documents in a shared CMS,
  so parallel workers would race.
*/
export default defineConfig({
  testDir: './tests/integration',
  globalSetup: './tests/integration/global-setup.ts',
  globalTeardown: './tests/integration/global-teardown.ts',
  fullyParallel: false,
  workers: 1,
  forbidOnly: !!process.env.CI,
  retries: 0,
  reporter: process.env.CI ? [['github'], ['html', { open: 'never' }]] : 'list',
  // The CMS build + Astro build happen in globalSetup, which needs headroom.
  timeout: 60_000,
  use: {
    baseURL: SITE_URL,
    trace: 'on-first-retry',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
});
