/*
  Shared constants for the CMS integration run. Kept in their own module (not
  the Playwright config) so specs can import them without pulling the config's
  side effects into the worker.

  These MUST match what cms/scripts/seed-e2e.ts inserts.
*/
export const CMS_PORT = Number(process.env.E2E_CMS_PORT) || 3310;
export const SITE_PORT = Number(process.env.E2E_SITE_PORT) || 4330;

export const CMS_URL = `http://127.0.0.1:${CMS_PORT}`;
export const SITE_URL = `http://127.0.0.1:${SITE_PORT}`;

export const CMS_API_KEY = 'e2e-api-key-fixed-for-tests';
export const PREVIEW_SECRET = 'e2e-preview-secret';

export const SEED = {
  publishedSlug: 'e2e-published-announcement',
  publishedTitle: 'Isang dekada ng katapatan',
  publishedBodyText: 'This announcement is published and must appear on the news page.',
  inReviewSlug: 'e2e-in-review-announcement',
  inReviewTitle: 'Draft awaiting approval from the team',
  inReviewBodyText: 'This one is awaiting approval and must never appear publicly.',
  eventSlug: 'e2e-upcoming-event',
  eventName: 'Quest Family Retreat',
  slideTitle: 'Welcome home to Quest Laguna',
} as const;
