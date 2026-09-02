import { test, expect } from '@playwright/test';

/*
  Connect page forms from the user's side. With no email backend configured the
  endpoints return 503, and the client must degrade gracefully to the Facebook
  Messenger copy-paste handoff — never a dead end.
*/

test('prayer form falls back to Messenger handoff when email is unconfigured', async ({ page }) => {
  await page.goto('/connect');

  const form = page.locator('#prayer-form');
  await form.locator('[name="request"]').fill('Please pray for safe travels for our team.');
  await form.locator('[data-submit]').click();

  const fallback = page.locator('#prayer-fallback');
  await expect(fallback).toBeVisible();
  await expect(form).toBeHidden();

  // The composed message is prefilled for pasting into Messenger.
  await expect(page.locator('#prayer-composed')).toHaveValue(/safe travels/);
});

test('prayer form blocks submit when the request is empty (required field)', async ({ page }) => {
  await page.goto('/connect');
  const form = page.locator('#prayer-form');
  await form.locator('[data-submit]').click();

  // Native required validation keeps the form visible; no fallback shown.
  await expect(form).toBeVisible();
  await expect(page.locator('#prayer-fallback')).toBeHidden();
  await expect(form.locator('[name="request"]:invalid')).toHaveCount(1);
});

test('question form falls back to Messenger handoff when email is unconfigured', async ({
  page,
}) => {
  await page.goto('/connect');

  const form = page.locator('#question-form');
  await form.locator('[name="question"]').fill('How do I join a community group?');
  await form.locator('[data-question-submit]').click();

  await expect(page.locator('#question-fallback')).toBeVisible();
  await expect(form).toBeHidden();
  await expect(page.locator('#question-composed')).toHaveValue(/community group/);
});

test('a services deep link preselects the pastoral topic and names the service', async ({
  page,
}) => {
  await page.goto('/services');

  const askLink = page.locator('a[href^="/connect?service="]').first();
  await expect(askLink).toBeVisible();
  await askLink.click();

  await expect(page).toHaveURL(/\/connect\?service=[a-z]+#ask$/);
  await expect(page.locator('#question-form [name="topic"]')).toHaveValue(
    'Pastoral services',
  );
  // The office reads this first line to know who to forward it to.
  await expect(page.locator('#question-form [name="question"]')).toHaveValue(/^About: /);
});

/*
  Same preselect, then all the way through to the composed message. Navigated
  without the #ask hash on purpose: the anchor triggers `scroll-behavior:
  smooth`, and the submit button never settles long enough for a click. The
  test above already covers the hash, and the query string is what drives the
  preselect either way.
*/
test('the pastoral topic survives the Messenger fallback', async ({ page }) => {
  await page.goto('/connect?service=wedding');

  const form = page.locator('#question-form');
  await expect(form.locator('[name="topic"]')).toHaveValue('Pastoral services');

  // The visitor types after the prefilled "About: <service>" line rather than
  // replacing it, which is what carries the service through to the office.
  const questionBox = form.locator('[name="question"]');
  const prefilled = await questionBox.inputValue();
  expect(prefilled).toMatch(/^About: Wedding Ceremony/);
  await questionBox.fill(`${prefilled}When is the next schedule?`);

  await form.locator('[data-question-submit]').click();

  // Email is unconfigured in this suite, so the form composes a message instead.
  const composed = page.locator('#question-composed');
  await expect(composed).toHaveValue(/About: Pastoral services/);
  await expect(composed).toHaveValue(/About: Wedding Ceremony/);
});
