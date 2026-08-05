# Editorial approval workflow — Payload CMS

Content editors write and **submit** announcements/events; only admins
**publish** them to the live site. Unlike the previous Directus setup, none of
this is click-configured: it is code in this repo, reviewed like any other
change and covered by tests.

Flow of a post:

```
draft ──(editor submits)──▶ in_review ──(admin approves)──▶ published ──▶ live
  ▲                                          │
  └──────────(admin requests changes)────────┘
```

> **Admins publish directly.** The admin role has no status restriction, so
> creating an item already at `status = published` sends it straight to live —
> the deploy hook fires on **create** as well as update. Only editors are
> boxed into `draft` → `in_review`.

## Where the rules live

| Rule | File |
| --- | --- |
| Public sees published only; authenticated sees drafts | `src/access/roles.ts` → `readPublishedOrAuthenticated` |
| Editors cannot set `published` (create or update) | `src/fields/statusField.ts` → `validate` |
| Editors cannot promote themselves to admin | `src/collections/Users.ts` → `role` field access |
| Publish → rebuild the site | `src/hooks/deployWebhook.ts` |
| Submit → email the approver | `src/hooks/notifyApprover.ts` |
| Lexical rich text → HTML for the site | `src/fields/richTextHtml.ts` |

All of it is verified by `npm run test:e2e:cms` from the repo root (see
`tests/integration/workflow.spec.ts`).

## Roles

Set a user's **Role** field in the admin (Users collection):

- **Content editor** — create and edit announcements/events; may set status to
  `draft` or `in_review`. Attempting to publish is rejected with
  "Only admins can publish."
- **Admin / approver** — everything the editor can do, plus set `published`
  (approve) or back to `draft` (request changes), delete items, and manage
  users.

## First run

1. Deploy the compose stack (see `docker-compose.yml` header for Dokploy steps).
2. Open `https://<your-cms-domain>/admin` — Payload's onboarding screen creates
   the **first admin user**. There is no seeded default account and no
   admin password in env; whoever opens it first sets the credentials.
   Do this immediately after the first deploy.
3. In that user's profile, set **Role = Admin / approver**.
4. Create the site's read-only user:
   - Users → Create, e.g. `site@questlaguna.org`
   - Enable **API Key**, copy the generated key
   - Set it as `CMS_TOKEN` in the SITE app's build args (see repo-root
     `.env.example`), with `CMS_URL` pointing at this CMS.
   - Because reads are authenticated, this key can also see drafts — which is
     what the site's preview route needs.

## Preview before approving

The approver reviews the actual rendered page before publishing:

```
/news/preview/<slug>?token=<PREVIEW_SECRET>
```

This on-demand route lives in the site (not the CMS). It renders `draft` and
`in_review` items live, `noindex`, with a banner reading either
"Draft — not published" or "In review — awaiting approval". Requirements:

- `PREVIEW_SECRET` set on the site service (repo-root `.env.example`). Unset ⇒
  the route returns 404 and preview is disabled.
- `CMS_TOKEN` set, so the site can read non-published items.

## Notifications and deploys

Both are hooks that **no-op when their env is unset**, so local dev and the
test suite stay silent:

- `DOKPLOY_DEPLOY_URL` — POSTed when an item is published, so content bakes
  into a fresh build (~1–2 minutes). If content looks stale on the live site,
  check this first.
- `RESEND_API_KEY` + `APPROVER_EMAIL` + `APPROVER_FROM_EMAIL` — emails the
  approver when an item enters `in_review`.

Keep them separate: "submitted for review" must never trigger a deploy.

## Schema changes

The postgres adapter requires committed migrations — dev push-mode is not used
in production, and the container runs `payload migrate` on boot.

```bash
cd cms
npm run migrate:create   # after changing any collection
git add src/migrations
```

## What is NOT built here

- No registration or attendee tracking — `registrationUrl` is a plain link.
- No custom posting UI on the website — editors use the Payload admin.
- No member or finance data — that boundary belongs to the membership app.
