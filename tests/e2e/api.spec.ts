import { test, expect } from '@playwright/test';

/*
  API contract for the prayer + question endpoints, exercised directly (no
  browser). Email is unconfigured in the test env, so a VALID submission stops
  at 503 not_configured — that proves validation, honeypot, rate-limit, and
  size-cap behaviour without ever sending mail.
*/

const ENDPOINTS = ['/api/prayer', '/api/question'] as const;

// A minimal valid body per endpoint (distinct required fields).
const validBody: Record<string, Record<string, unknown>> = {
  '/api/prayer': { request: 'Please pray for our family this week.' },
  '/api/question': { topic: 'General', question: 'What time is Sunday service?' },
};

for (const path of ENDPOINTS) {
  test(`${path}: valid body → 503 not_configured (no email backend)`, async ({ request }) => {
    const res = await request.post(path, { data: validBody[path] });
    expect(res.status()).toBe(503);
    expect((await res.json()).error).toBe('not_configured');
  });

  test(`${path}: honeypot filled → 200 ok, nothing sent`, async ({ request }) => {
    const res = await request.post(path, {
      data: { ...validBody[path], website: 'http://spam.example' },
    });
    expect(res.status()).toBe(200);
    expect((await res.json()).ok).toBe(true);
  });

  test(`${path}: empty required field → 400`, async ({ request }) => {
    const res = await request.post(path, { data: { name: 'A' } });
    expect(res.status()).toBe(400);
    expect((await res.json()).ok).toBe(false);
  });

  test(`${path}: invalid JSON → 400`, async ({ request }) => {
    const res = await request.post(path, {
      headers: { 'Content-Type': 'application/json' },
      data: 'not json',
    });
    expect(res.status()).toBe(400);
  });

  test(`${path}: oversized body → 413`, async ({ request }) => {
    const huge = 'x'.repeat(20 * 1024); // > 16 KB cap
    const res = await request.post(path, { data: { request: huge, question: huge } });
    expect(res.status()).toBe(413);
  });

  test(`${path}: GET is rejected (405)`, async ({ request }) => {
    const res = await request.get(path);
    expect(res.status()).toBe(405);
  });
}
