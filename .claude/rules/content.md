# Content rules — quest-web

## Ownership boundary

- Payload CMS (cms/) = ALL public site content: announcements, carousel
  slides, events, page copy, photos. Own Postgres (`quest_content`), own
  uploads.
- tierra (TanStack Start + Supabase) = membership directory + finance only.
  Its event management is decommissioned (2026-07-08); quest-web has no
  integration with it. Never model member, registration, or finance data
  in the CMS.
- Event registration is a plain `registrationUrl` field — marketing pastes
  whatever link they use (Google Form, FB event). Never build registration
  or attendee tracking into this site or the CMS.

## Structured slots, not free-form

Editors control words and images, never design:

- Model content as typed fields (title, date, category dropdown, image,
  body). No color/font/size fields, no raw HTML fields.
- Rich text fields get a limited toolbar (bold, italic, links, lists).
- Category values are a fixed dropdown, not free text.
- Every image field requires alt text.
- Layout variety comes from a curated block library mapped to our Astro
  components — never a free-form page builder.

## Fetch pattern (see src/lib/cms.ts)

- All fetchers are read-only, filter on `status = published`, and fall back
  to `src/lib/sample-content.ts` on any failure — builds must never depend
  on a live CMS. `cmsFetch()` returning `null` is what triggers that
  fallback; never let an error escape it.
- Requests carry `depth=1` so upload relations arrive populated, and images
  resolve through `mediaUrl()` to a named size preset (`banner` 1200w,
  `card` 800w, both webp q80) — never serve originals.
- Rich text is converted to HTML server-side by the CMS and arrives as
  `bodyHtml` / `descriptionHtml`. The site never parses Lexical JSON.

## Current collections (defined in code — cms/src/collections/)

Changing a collection means editing its file and running `npm run
migrate:create` in `cms/`. Keep this list in sync.

- `announcements`: title, slug (unique, URL-safe), date, category (select:
  Announcement/Update/Campaign/Event), body (rich text, limited), banner
  (upload), bannerAlt (required when banner set), pinned (checkbox),
  status (select: draft/in_review/published — see approval workflow below).
  Detail pages render at `/news/[slug]`.
- `carousel-slides`: title, subtitle, chip, theme (select:
  red/dark/cream/deep), image (upload), href, order (number), status.
- `events`: name, slug (unique, URL-safe), date, time (text, 24h),
  venue, description (rich text, limited), banner (upload), bannerAlt
  (required when banner set), registrationUrl, registrationOpen, status.
  Site shows only published events with date >= build date; detail pages
  render at `/events/[slug]` (past events age out at the next rebuild).
- `media`: upload collection, required `alt`, size presets banner/card.
- `users`: auth + API key; `role` is `editor` or `admin`.

## Editorial approval workflow (draft → in_review → published)

Publishing to the live site is gated by an approval step. **Content editors
write and submit; only admins publish.** This is enforced in CMS code — the
Astro site cannot enforce it (editors work in the CMS, and only
`status = published` is ever rendered). Runbook: `cms/WORKFLOW.md`; the rules
live in `cms/src/access/roles.ts` and `cms/src/fields/statusField.ts` and are
covered by `tests/integration/workflow.spec.ts`.

- `status` is a three-value dropdown on `announcements` and `events`:
  `draft` (being written), `in_review` (submitted, awaiting approval),
  `published` (live at the next rebuild).
- **Editor** role: create + edit items and set status to `draft` or
  `in_review`. The `statusField` validate rejects `published` for non-admins,
  on create as well as update.
- **Admin/Approver** role: everything the editor can do, plus set status to
  `published` (approve) or back to `draft` (request changes). An admin may
  create an item already published — it goes straight to live.
- Reviewers preview an item before approving via the on-demand preview route
  `/news/preview/<slug>?token=<PREVIEW_SECRET>` — it renders drafts and
  `in_review` items live (never indexed), with a banner marking the state.
- `cms/src/hooks/notifyApprover.ts` emails the approver when an item enters
  `in_review`; the deploy hook (below) fires only on `published`. Both no-op
  when their env vars are unset.

## Rich text rendering (trust assumption)

Detail pages render `body`/`description` with `set:html` at build time. The
HTML is produced by the CMS from Lexical JSON (`cms/src/fields/
richTextHtml.ts`), and the editor is restricted to a limited feature set
(paragraph, bold, italic, link, lists) — so the markup is structurally
constrained by the editor rather than sanitized after the fact. This is safe
only while editors are trusted church staff and there is no user-generated
content. If editor trust ever widens, add a build-time sanitize pass (e.g.
sanitize-html) inside the fetchers in `src/lib/cms.ts` / `src/lib/events.ts`
— build-only dependency, zero client JS.

## Publish → deploy

Content bakes into static pages at build time. `cms/src/hooks/
deployWebhook.ts` calls the Dokploy deploy webhook for the site app when an
item is published (create or update), so fresh content goes live in ~1–2
minutes. If content seems stale, check `DOKPLOY_DEPLOY_URL` on the CMS first.

## Privacy

- No member PII in this repo, in the CMS, or in logs.
- Prayer requests (future endpoint) are emailed to the prayer team only —
  never stored in the CMS, never logged with contents.
