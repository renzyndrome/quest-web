import { defineConfig, devices } from '@playwright/test';

/*
  E2E config for the built site. Playwright builds the site and starts the
  node standalone server (the same artifact Dokploy runs), then drives it.

  The server runs with a deterministic env: the CMS + Resend are left UNSET so
  content comes from sample-content and the forms exercise the "not configured
  → Messenger fallback" path — no live CMS or email is ever required (matches
  the "builds must never depend on a live CMS" rule). PREVIEW_SECRET is set to
  a known value so the draft-preview auth guard can be tested end to end.
*/
// Deliberately not Astro's default 4321 — avoids clashing with a running dev
// server. Override with E2E_PORT if this one is taken.
const PORT = Number(process.env.E2E_PORT) || 4329;
const PREVIEW_SECRET = 'e2e-preview-secret';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['github'], ['html', { open: 'never' }]] : 'list',
  // Exposed to specs via testInfo/project use so tests don't hardcode the secret.
  use: {
    baseURL: `http://127.0.0.1:${PORT}`,
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: 'npm run build && node ./dist/server/entry.mjs',
    url: `http://127.0.0.1:${PORT}`,
    timeout: 120_000,
    reuseExistingServer: !process.env.CI,
    env: {
      HOST: '127.0.0.1',
      PORT: String(PORT),
      PREVIEW_SECRET,
      // Intentionally no CMS_*, RESEND_*, QUESTION_* → sample content +
      // "not configured" form responses.
    },
  },
});

/** The preview secret the webServer runs with — imported by preview specs. */
export const E2E_PREVIEW_SECRET = PREVIEW_SECRET;
