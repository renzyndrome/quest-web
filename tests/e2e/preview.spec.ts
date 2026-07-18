import { test, expect } from '@playwright/test';
import { E2E_PREVIEW_SECRET } from '../../playwright.config';

/*
  Draft-preview auth guard. The webServer runs with PREVIEW_SECRET set (see
  playwright.config.ts), so both auth-failure branches and the not-found branch
  are deterministic. Rendering an actual draft needs a live Directus with a
  draft item, which is out of scope for an offline E2E run — the guard is what
  we can and must prove here.
*/

const SLUG = 'any-draft-slug';

test('preview without a token → 404', async ({ request }) => {
  const res = await request.get(`/news/preview/${SLUG}`);
  expect(res.status()).toBe(404);
});

test('preview with a wrong token → 404', async ({ request }) => {
  const res = await request.get(`/news/preview/${SLUG}?token=wrong-token`);
  expect(res.status()).toBe(404);
});

test('preview with the correct token but unknown slug → 404 (no live CMS)', async ({ request }) => {
  const res = await request.get(`/news/preview/${SLUG}?token=${E2E_PREVIEW_SECRET}`);
  // Auth passes; getAnnouncementBySlug returns null (Directus unset) → 404.
  expect(res.status()).toBe(404);
});
