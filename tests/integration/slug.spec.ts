import { test, expect, type APIRequestContext } from '@playwright/test';
import { CMS_URL } from './constants';

/*
  Automatic slugs, proven against the real CMS.

  Editors never see this field (cms/src/fields/slugField.ts), which is exactly
  why it needs covering: if the hook stops firing, nothing in the admin UI
  would show it, and the first symptom would be a broken public URL.

  Three guarantees:
    1. a slug is derived from the title when none is given
    2. two items sharing a title do not collide
    3. renaming an item never changes its address
*/

async function login(request: APIRequestContext): Promise<string> {
  const res = await request.post(`${CMS_URL}/api/users/login`, {
    data: { email: 'admin@questlaguna.org', password: 'e2e-admin-password' },
  });
  expect(res.status()).toBe(200);
  return (await res.json()).token as string;
}

const auth = (token: string) => ({ Authorization: `JWT ${token}` });

/** Unique per run — these create real rows in a shared, already-seeded CMS. */
const RUN = Date.now().toString(36);

const lexicalBody = {
  root: {
    type: 'root',
    format: '',
    indent: 0,
    version: 1,
    direction: 'ltr',
    children: [
      {
        type: 'paragraph',
        format: '',
        indent: 0,
        version: 1,
        direction: 'ltr',
        textFormat: 0,
        children: [
          { type: 'text', detail: 0, format: 0, mode: 'normal', style: '', text: 'Body.', version: 1 },
        ],
      },
    ],
  },
};

/** Creates a testimony with NO slug, returning the doc the CMS built. */
async function create(request: APIRequestContext, token: string, title: string) {
  const res = await request.post(`${CMS_URL}/api/life-testimonies`, {
    headers: auth(token),
    data: { title, date: new Date('2026-03-01').toISOString(), body: lexicalBody, status: 'draft' },
  });
  expect(res.status(), `create "${title}"`).toBe(201);
  return (await res.json()).doc;
}

test('a slug is generated from the title when the editor supplies none', async ({ request }) => {
  const token = await login(request);
  const doc = await create(request, token, `Bagong Simula sa Biñan ${RUN}`);

  // Lowercased, hyphenated, and the ñ folded to n rather than dropped.
  expect(doc.slug).toBe(`bagong-simula-sa-binan-${RUN}`);
});

test('two items with the same title get distinct slugs', async ({ request }) => {
  const token = await login(request);
  const title = `Water Baptism ${RUN}`;

  const first = await create(request, token, title);
  const second = await create(request, token, title);

  expect(first.slug).toBe(`water-baptism-${RUN}`);
  // Not a duplicate, and not a unique-constraint error naming a hidden field.
  expect(second.slug).toBe(`water-baptism-${RUN}-2`);
});

test('renaming an item keeps its original address', async ({ request }) => {
  const token = await login(request);
  const doc = await create(request, token, `Original Title ${RUN}`);
  const original = doc.slug;

  const res = await request.patch(`${CMS_URL}/api/life-testimonies/${doc.id}`, {
    headers: auth(token),
    data: { title: `Completely Different Title ${RUN}` },
  });
  expect(res.status()).toBe(200);

  // The old URL is already public — on Facebook, in the approval email.
  expect((await res.json()).doc.slug).toBe(original);
});
