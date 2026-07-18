# Editorial approval workflow — Directus setup

Content editors write and **submit** announcements/events; only admins
**publish** them to the live site. Enforcement lives here in Directus, not in
the Astro repo — editors never touch the site, and the site only ever renders
`status = published`.

Flow of a post:

```
draft ──(editor submits)──▶ in_review ──(admin approves)──▶ published ──▶ live
  ▲                                          │
  └──────────(admin requests changes)────────┘
```

Applies to the `announcements` and `events` collections.

> **Admins publish directly.** An admin (or the Approver role) has no status
> restriction, so creating an item already at `status = published` sends it
> straight to live — the deploy Flow fires on **create** as well as update.
> Only editors are boxed into `draft` → `in_review`.

## Automated setup

Most of the steps below are scripted. Set the status field values manually
(§1), then run the idempotent bootstrap (safe to re-run):

```bash
DIRECTUS_URL=https://cms.example \
DIRECTUS_ADMIN_TOKEN=<static admin token> \
APPROVER_EMAIL=approver@questlaguna.org \
DOKPLOY_DEPLOY_URL=<dokploy deploy hook> \
npm run cms:setup
```

It creates/reconciles the Editor + Approver roles, their policies and
permissions, and both Flows (`cms/scripts/setup-workflow.ts`). `APPROVER_EMAIL`
and `DOKPLOY_DEPLOY_URL` are optional — omit either to skip that Flow and wire
it in the admin instead. The rest of this document is the manual reference for
what the script builds.

## 1. The `status` field

On both `announcements` and `events`, make `status` a **dropdown** (string)
with exactly these values:

| Value        | Meaning                              |
| ------------ | ------------------------------------ |
| `draft`      | Being written. Not live.             |
| `in_review`  | Submitted by an editor, awaiting approval. Not live. |
| `published`  | Approved. Goes live at the next rebuild. |

Default new items to `draft`. (Keep `carousel_slides` on its existing
draft/published `status` unless you want slides reviewed too.)

## 2. Roles & policies

Directus 11 attaches permissions to **access policies**; assign each policy to
a role. Create two roles, each with one policy:

### Editor (writes, cannot publish)

On `announcements` and `events`:

- **Create** — allowed. Add a **Validation** rule so new items can't be born
  live:
  ```json
  { "status": { "_in": ["draft", "in_review"] } }
  ```
- **Read / Update** — allowed, with the **same Validation** on Update:
  ```json
  { "status": { "_in": ["draft", "in_review"] } }
  ```
  Because the validation forbids a payload that sets `published`, an editor
  can move an item to `draft` or `in_review` but never to `published`. Editing
  an already-live item means setting it back to `in_review` — so changes to
  live content are re-approved too. That is intended.
- **Delete** — your call (usually deny for editors; admins clean up).

Editors get **no** access to member/finance data — that lives in tierra, not
here (see `.claude/rules/content.md`).

### Admin / Approver (publishes)

Everything the editor policy allows, **without** the status validation rule, so
this role can set `status = published` (approve) or back to `draft` (request
changes). The built-in Administrator role already covers this; a dedicated
"Approver" policy lets you grant approval without full admin.

## 3. Flow — notify the approver on submit

So a submission doesn't sit unnoticed:

- **Trigger:** Event Hook → Action (non-blocking) → `items.create`,
  `items.update` on `announcements`, `events`.
- **Condition** operation: continue only when
  `{{ $trigger.payload.status }}` equals `in_review`.
- **Action:** *Send Email* (or *Send Notification*) to the approver, linking
  the preview URL (see §5).

## 4. Flow — deploy on publish (existing)

The publish → deploy Flow already described in `.claude/rules/content.md`:

- **Trigger:** Event Hook on `items.create` / `items.update` where the new
  `status` is `published`.
- **Action:** *Webhook / Request URL* → the Dokploy deploy hook for the site
  app. Fresh content is live in ~1–2 minutes.

Keeping the two Flows separate means "submitted for review" never triggers a
deploy; only an admin's approval does.

## 5. Preview before approving

The approver reviews the actual rendered page before publishing:

```
/news/preview/<slug>?token=<PREVIEW_SECRET>
```

This on-demand route (in the site, not Directus) renders `draft` and
`in_review` items live from Directus, `noindex`, with a banner marking the
state. Requirements:

- `PREVIEW_SECRET` set on the site service (see `.env.example`). Unset ⇒ the
  route returns 404 and preview is disabled.
- The site's `DIRECTUS_TOKEN` policy must have **read** access to non-published
  items (or issue a separate read token for preview). Without it the preview
  can't load a draft.

## What is NOT built here

- No registration/attendee tracking — `registration_url` is a plain link.
- No custom posting UI on the website — editors use the Directus admin.
- No member or finance data — that boundary belongs to tierra.
