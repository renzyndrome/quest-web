import { test, expect } from '@playwright/test';
import { SEED } from './constants';

/*
  The migration proof: a real Payload CMS, seeded with a published and an
  in_review announcement, driving a real Astro build.

  This is what the offline suite CANNOT show — that published content actually
  renders, unpublished content actually stays hidden, and the approval workflow
  is visible end to end.
*/

test.describe('published content renders', () => {
  test('the published announcement appears on /news', async ({ page }) => {
    await page.goto('/news');
    await expect(page.getByRole('heading', { name: SEED.publishedTitle })).toBeVisible();
  });

  test('its detail page renders the rich text converted from Lexical', async ({ page }) => {
    const response = await page.goto(`/news/${SEED.publishedSlug}`);
    expect(response?.status()).toBe(200);

    await expect(page.locator('h1')).toHaveText(SEED.publishedTitle);
    // Proves the CMS-side Lexical → HTML conversion reached the page as HTML.
    await expect(page.locator('.rich-text p')).toContainText(SEED.publishedBodyText);
  });

  test('the banner uses a generated webp size preset from the CMS', async ({ page }) => {
    await page.goto(`/news/${SEED.publishedSlug}`);
    const banner = page.locator('main img').first();
    await expect(banner).toBeVisible();

    const src = await banner.getAttribute('src');
    // Payload imageSizes preset: <name>-1200x675.webp served from the CMS.
    expect(src).toMatch(/^http:\/\/127\.0\.0\.1:\d+\/api\/media\/file\/.+\.webp$/);
    await expect(banner).toHaveAttribute('alt', /congregation/i);

    // The image must actually load, not just be referenced.
    const res = await page.request.get(src!);
    expect(res.status()).toBe(200);
    expect(res.headers()['content-type']).toContain('image/webp');
  });

  test('the upcoming event renders (date >= today query works)', async ({ page }) => {
    await page.goto('/events');
    await expect(page.getByText(SEED.eventName).first()).toBeVisible();
  });

  test('the published testimony appears on /testimonies', async ({ page }) => {
    await page.goto('/testimonies');
    await expect(page.getByRole('heading', { name: SEED.testimonyTitle })).toBeVisible();
    await expect(page.getByText(SEED.testimonyPerson).first()).toBeVisible();
  });

  test('the testimony detail page renders the rich text converted from Lexical', async ({
    page,
  }) => {
    const response = await page.goto(`/testimonies/${SEED.testimonySlug}`);
    expect(response?.status()).toBe(200);

    await expect(page.locator('h1')).toHaveText(SEED.testimonyTitle);
    await expect(page.locator('.rich-text p')).toContainText(SEED.testimonyBodyText);
  });

  test('the pasted YouTube link becomes a facade, never a raw iframe', async ({ page }) => {
    await page.goto(`/testimonies/${SEED.testimonySlug}`);

    // The URL the editor pasted was parsed down to its video id, and the
    // player is deferred behind a play button.
    const facade = page.locator('[data-yt-facade]');
    await expect(facade).toHaveAttribute(
      'data-embed',
      new RegExp(`youtube-nocookie\\.com/embed/${SEED.testimonyVideoId}`),
    );
    await expect(page.getByRole('button', { name: /^Play:/ })).toBeVisible();
    // Nothing loads the real player until a visitor taps it.
    await expect(page.locator('iframe')).toHaveCount(0);
  });
});

test.describe('unpublished content stays hidden', () => {
  test('the in_review announcement is absent from /news', async ({ page }) => {
    await page.goto('/news');
    await expect(page.getByText(SEED.inReviewTitle)).toHaveCount(0);
    await expect(page.locator(`a[href="/news/${SEED.inReviewSlug}"]`)).toHaveCount(0);
    await expect(page.getByText(SEED.inReviewBodyText)).toHaveCount(0);
  });

  test('its detail page was never built (404)', async ({ request }) => {
    const res = await request.get(`/news/${SEED.inReviewSlug}`);
    expect(res.status()).toBe(404);
  });

  test('the public CMS API itself hides it from anonymous callers', async ({ request }) => {
    const { CMS_URL } = await import('./constants');
    const res = await request.get(`${CMS_URL}/api/announcements?limit=50`);
    expect(res.status()).toBe(200);
    const body = await res.json();
    const slugs = body.docs.map((d: { slug: string }) => d.slug);
    expect(slugs).toContain(SEED.publishedSlug);
    expect(slugs).not.toContain(SEED.inReviewSlug);
  });

  test('the in_review testimony is absent from /testimonies', async ({ page }) => {
    await page.goto('/testimonies');
    await expect(page.getByText(SEED.inReviewTestimonyTitle)).toHaveCount(0);
    await expect(
      page.locator(`a[href="/testimonies/${SEED.inReviewTestimonySlug}"]`),
    ).toHaveCount(0);
    await expect(page.getByText(SEED.inReviewTestimonyBodyText)).toHaveCount(0);
  });

  test('the in_review testimony detail page was never built (404)', async ({ request }) => {
    const res = await request.get(`/testimonies/${SEED.inReviewTestimonySlug}`);
    expect(res.status()).toBe(404);
  });
});

test.describe('draft preview (the approval step)', () => {
  test('renders the in_review item with the correct status banner', async ({ page }) => {
    const { PREVIEW_SECRET } = await import('./constants');
    const response = await page.goto(
      `/news/preview/${SEED.inReviewSlug}?token=${PREVIEW_SECRET}`,
    );
    expect(response?.status()).toBe(200);

    await expect(page.locator('h1')).toHaveText(SEED.inReviewTitle);
    await expect(page.locator('.rich-text p')).toContainText(SEED.inReviewBodyText);
    // The label an approver relies on to know what they are looking at.
    await expect(page.getByText('In review — awaiting approval')).toBeVisible();
  });

  test('is never indexable', async ({ page }) => {
    const { PREVIEW_SECRET } = await import('./constants');
    await page.goto(`/news/preview/${SEED.inReviewSlug}?token=${PREVIEW_SECRET}`);
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute(
      'content',
      /noindex/,
    );
  });

  test('rejects a wrong token even against a live CMS', async ({ request }) => {
    const res = await request.get(`/news/preview/${SEED.inReviewSlug}?token=wrong-token`);
    expect(res.status()).toBe(404);
  });

  test('rejects a missing token', async ({ request }) => {
    const res = await request.get(`/news/preview/${SEED.inReviewSlug}`);
    expect(res.status()).toBe(404);
  });

  test('renders an in_review testimony, the route the CMS Preview button opens', async ({
    page,
  }) => {
    const { PREVIEW_SECRET } = await import('./constants');
    const response = await page.goto(
      `/testimonies/preview/${SEED.inReviewTestimonySlug}?token=${PREVIEW_SECRET}`,
    );
    expect(response?.status()).toBe(200);

    await expect(page.locator('h1')).toHaveText(SEED.inReviewTestimonyTitle);
    await expect(page.locator('.rich-text p')).toContainText(SEED.inReviewTestimonyBodyText);
    await expect(page.getByText('In review — awaiting approval')).toBeVisible();
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', /noindex/);
  });
});
