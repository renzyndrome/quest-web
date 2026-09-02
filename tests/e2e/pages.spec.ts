import { test, expect } from '@playwright/test';

/*
  Static page rendering — the "reading" half of the publishing pipeline. All
  content here comes from sample-content (the CMS is unset in the test env),
  which is exactly the fallback the site must always build against.
*/

const PAGES: ReadonlyArray<{ path: string; heading: RegExp }> = [
  { path: '/', heading: /./ },
  { path: '/visit', heading: /When we gather/i },
  { path: '/about', heading: /Seven Quest Beliefs/i },
  { path: '/news', heading: /News & announcements/i },
  { path: '/testimonies', heading: /Life testimonies/i },
  { path: '/events', heading: /./ },
  { path: '/connect', heading: /prayer request/i },
  { path: '/give', heading: /./ },
  { path: '/sermons', heading: /./ },
  { path: '/ministries', heading: /Every member is a minister/i },
  { path: '/services', heading: /Pastoral services/i },
];

for (const { path, heading } of PAGES) {
  test(`${path} renders with 200 and a visible heading`, async ({ page }) => {
    const response = await page.goto(path);
    expect(response?.status(), `GET ${path}`).toBe(200);
    await expect(page.locator('h1, h2').first()).toBeVisible();
    if (heading.source !== '.') {
      await expect(page.getByRole('heading', { name: heading }).first()).toBeVisible();
    }
  });
}

test('news list links through to an announcement detail page', async ({ page }) => {
  await page.goto('/news');

  // First article link on the page → detail route.
  const firstArticleLink = page.locator('article a[href^="/news/"]').first();
  await expect(firstArticleLink).toBeVisible();
  const href = await firstArticleLink.getAttribute('href');
  expect(href).toMatch(/^\/news\/[a-z0-9-]+$/);

  await firstArticleLink.click();
  await expect(page).toHaveURL(new RegExp(`${href}$`));

  // Detail page shows a title (h1) and rendered rich-text body.
  await expect(page.locator('h1')).toBeVisible();
  await expect(page.locator('.rich-text')).toBeVisible();
  await expect(page.getByRole('link', { name: /back to all news/i })).toBeVisible();
});

test('testimonies list links through to a testimony detail page', async ({ page }) => {
  await page.goto('/testimonies');

  const firstCardLink = page.locator('article a[href^="/testimonies/"]').first();
  await expect(firstCardLink).toBeVisible();
  const href = await firstCardLink.getAttribute('href');
  expect(href).toMatch(/^\/testimonies\/[a-z0-9-]+$/);

  await firstCardLink.click();
  await expect(page).toHaveURL(new RegExp(`${href}$`));

  await expect(page.locator('h1')).toBeVisible();
  await expect(page.locator('.rich-text')).toBeVisible();
  await expect(page.getByRole('link', { name: /back to all testimonies/i })).toBeVisible();
});

test('news detail is indexable (no noindex on published pages)', async ({ page }) => {
  await page.goto('/news');
  const href = await page.locator('article a[href^="/news/"]').first().getAttribute('href');
  await page.goto(href!);
  await expect(page.locator('meta[name="robots"]')).toHaveCount(0);
});

test('about renders the whole distinctive statement, scripture and all', async ({ page }) => {
  await page.goto('/about');
  await expect(page.getByRole('heading', { name: /promise-driven church/i })).toBeVisible();

  // Shown in full, not folded: Pastor Apple asked for the statement as written.
  await expect(page.getByText('we choose to be a Promise-Driven Church')).toBeVisible();
  await expect(page.getByText('Numbers 23:19')).toBeVisible();
  await expect(page.getByText('faith simply refuses to make our limitations')).toBeVisible();

  // The Tagalog is marked so a screen reader switches pronunciation.
  await expect(page.locator('[lang="fil"]')).toHaveCount(2);
});
