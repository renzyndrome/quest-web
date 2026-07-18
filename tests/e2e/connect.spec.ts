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
