import { test, expect } from '@playwright/test';
import { E2E_PREVIEW_SECRET } from '../../playwright.config';

/*
  Draft-preview auth guard. The webServer runs with PREVIEW_SECRET set (see
  playwright.config.ts), so both auth-failure branches and the not-found branch
  are deterministic. Rendering an actual draft needs a live CMS with a
  draft item, which is out of scope for an offline E2E run — the guard is what
  we can and must prove here.

  All three preview routes (news, events, testimonies) share the same guard
  code, so each one is checked: a route added without the token check would be
  an unauthenticated read of unpublished content.
*/

const SLUG = 'any-draft-slug';
const SECTIONS = ['news', 'events', 'testimonies'] as const;

for (const section of SECTIONS) {
  test(`${section} preview without a token → 404`, async ({ request }) => {
    const res = await request.get(`/${section}/preview/${SLUG}`);
    expect(res.status()).toBe(404);
  });

  test(`${section} preview with a wrong token → 404`, async ({ request }) => {
    const res = await request.get(`/${section}/preview/${SLUG}?token=wrong-token`);
    expect(res.status()).toBe(404);
  });

  test(`${section} preview with the correct token but unknown slug → 404 (no live CMS)`, async ({
    request,
  }) => {
    const res = await request.get(`/${section}/preview/${SLUG}?token=${E2E_PREVIEW_SECRET}`);
    // Auth passes; the by-slug fetcher returns null (CMS unset) → 404.
    expect(res.status()).toBe(404);
  });
}
