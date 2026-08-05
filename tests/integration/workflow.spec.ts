import { test, expect, type APIRequestContext } from '@playwright/test';
import { CMS_URL } from './constants';

/*
  The editorial approval workflow, enforced against the real CMS.

  Under Directus this lived in click-configured roles, policies and Flows that
  nothing could test. In Payload it is code (cms/src/access/roles.ts and
  cms/src/fields/statusField.ts), so it can be proven:

    - an editor may save draft and in_review, but NOT published
    - an admin may publish, including creating an item already published
*/

async function login(
  request: APIRequestContext,
  email: string,
  password: string,
): Promise<string> {
  const res = await request.post(`${CMS_URL}/api/users/login`, {
    data: { email, password },
  });
  expect(res.status(), `login ${email}`).toBe(200);
  const body = await res.json();
  expect(body.token, `token for ${email}`).toBeTruthy();
  return body.token as string;
}

const auth = (token: string) => ({ Authorization: `JWT ${token}` });

/*
  Slugs are unique per run: these specs create real documents in a shared CMS,
  and `slug` is a unique index, so fixed slugs would 400 on any re-run against
  an already-seeded database.
*/
const RUN = `${Date.now().toString(36)}`;

function announcement(name: string, status: string) {
  const slug = `wf-${name}-${RUN}`;
  return {
    title: `Workflow test ${slug}`,
    slug,
    date: new Date('2026-03-01').toISOString(),
    category: 'Announcement',
    body: {
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
    },
    status,
  };
}

test.describe('editor cannot publish', () => {
  test('an editor may create a draft', async ({ request }) => {
    const token = await login(request, 'editor@questlaguna.org', 'e2e-editor-password');
    const res = await request.post(`${CMS_URL}/api/announcements`, {
      headers: auth(token),
      data: announcement('editor-draft', 'draft'),
    });
    expect(res.status()).toBe(201);
  });

  test('an editor may submit for review', async ({ request }) => {
    const token = await login(request, 'editor@questlaguna.org', 'e2e-editor-password');
    const res = await request.post(`${CMS_URL}/api/announcements`, {
      headers: auth(token),
      data: announcement('editor-in-review', 'in_review'),
    });
    expect(res.status()).toBe(201);
    expect((await res.json()).doc.status).toBe('in_review');
  });

  test('an editor CANNOT create a published item', async ({ request }) => {
    const token = await login(request, 'editor@questlaguna.org', 'e2e-editor-password');
    const res = await request.post(`${CMS_URL}/api/announcements`, {
      headers: auth(token),
      data: announcement('editor-published', 'published'),
    });
    expect(res.status()).toBeGreaterThanOrEqual(400);
    expect(JSON.stringify(await res.json())).toMatch(/only admins can publish/i);
  });

  test('an editor CANNOT promote an existing draft to published', async ({ request }) => {
    const token = await login(request, 'editor@questlaguna.org', 'e2e-editor-password');
    const created = await request.post(`${CMS_URL}/api/announcements`, {
      headers: auth(token),
      data: announcement('editor-promote', 'draft'),
    });
    const { doc } = await created.json();

    const res = await request.patch(`${CMS_URL}/api/announcements/${doc.id}`, {
      headers: auth(token),
      data: { status: 'published' },
    });
    expect(res.status()).toBeGreaterThanOrEqual(400);
    expect(JSON.stringify(await res.json())).toMatch(/only admins can publish/i);
  });
});

test.describe('admin publishes directly', () => {
  test('an admin may create an item already published', async ({ request }) => {
    const token = await login(request, 'admin@questlaguna.org', 'e2e-admin-password');
    const res = await request.post(`${CMS_URL}/api/announcements`, {
      headers: auth(token),
      data: announcement('admin-published', 'published'),
    });
    expect(res.status()).toBe(201);
    expect((await res.json()).doc.status).toBe('published');
  });

  test('an admin may approve an editor submission', async ({ request }) => {
    const editorToken = await login(request, 'editor@questlaguna.org', 'e2e-editor-password');
    const created = await request.post(`${CMS_URL}/api/announcements`, {
      headers: auth(editorToken),
      data: announcement('admin-approves', 'in_review'),
    });
    const { doc } = await created.json();

    const adminToken = await login(request, 'admin@questlaguna.org', 'e2e-admin-password');
    const res = await request.patch(`${CMS_URL}/api/announcements/${doc.id}`, {
      headers: auth(adminToken),
      data: { status: 'published' },
    });
    expect(res.status()).toBe(200);
    expect((await res.json()).doc.status).toBe('published');
  });
});
