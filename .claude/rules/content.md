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
- Never ask an editor for something the system can work out. The URL slug is
  derived from the title (`cms/src/fields/slugField.ts`) and hidden from
  editors; image alt text is read from the media record, where it is already
  required, instead of being retyped per use. A field that exists only because
  it was easier to store than to infer is a field to delete.
- Rich text fields get a document-formatting toolbar and nothing more:
  paragraphs, h2/h3, bold, italic, strikethrough, blockquote, horizontal rule,
  links, lists, indent. No colours, fonts, sizes or alignment — and no
  underline, which would be indistinguishable from a link. The feature list
  lives in `cms/src/fields/limitedEditor.ts`, and
  every tag it can emit must have a matching rule in the site's `.rich-text`
  block (`src/styles/global.css`) — add the style before adding the feature.
- Category values are a fixed dropdown, not free text.
- Every image requires alt text, captured ONCE on the `media` record itself.
  Collections never carry their own `bannerAlt`.
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

Every collection below carries an auto `slug` (see "Structured slots") and a
`status`; neither is listed per collection.

- `announcements`: title, date, category (select:
  Announcement/Update/Campaign/Event), body (rich text, limited), banner
  (upload), pinned (checkbox). Detail pages render at `/news/[slug]`.
- `carousel-slides`: title, subtitle, chip, theme (select:
  red/dark/cream/deep), image (upload), href, order (number). No slug — slides
  are not pages.
- `events`: name, date, time (text, 24h), venue, description (rich text,
  limited), banner (upload), registrationUrl, registrationOpen.
  Site shows only published events with date >= build date; detail pages
  render at `/events/[slug]` (past events age out at the next rebuild).
- `life-testimonies`: title, person (optional, blank = anonymous), date, body
  (rich text, limited), video (group: url — a YouTube or Facebook link, whose
  kind the site infers; file → `videos`; poster → `media`), banner (upload).
  Detail pages render at `/testimonies/[slug]`.
- `media`: upload collection, required `alt`, size presets banner/card,
  `image/*` only.
- `videos`: upload collection for self-hosted testimony video, required `alt`,
  `video/mp4` and `video/webm` only, no size presets. Last resort — the rule
  is still that video lives on YouTube (there is no CDN in front of the
  droplet), so the video link sits above the upload and its help text says so.
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
- Reviewers preview an item before approving via the **Preview** button beside
  Save in the CMS, which opens the on-demand preview route in a new tab:
  `/<section>/preview/<slug>?token=<PREVIEW_SECRET>` for news, events and
  testimonies. It renders drafts and `in_review` items live (never indexed),
  with a banner marking the state. The button comes from `admin.preview` on
  each collection; the collection → URL-section map is the single source of
  truth in `cms/src/lib/previewUrl.ts` (`announcements` → `/news`,
  `life-testimonies` → `/testimonies`), shared with the approval email.
  `PREVIEW_SECRET` must be set to the SAME value on both the CMS and the site
  — the CMS builds the link, the site validates the token.
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

## Where uploaded files live

Two modes, switched by whether `R2_BUCKET` is set on the CMS
(`cms/src/lib/storage.ts`):

- **unset** — Payload writes to `MEDIA_DIR`, a Docker volume on the droplet.
  This is local dev and both e2e suites, and it is what makes the test runs
  need no cloud credentials.
- **set** — files go to Cloudflare R2 and are served from `R2_PUBLIC_URL`
  (a custom domain on the bucket), never through the CMS container. Production
  should run this way: the droplet has no CDN, so otherwise every photo is a
  round trip to one box for an audience mostly on mobile data, and the volume
  is the only thing on the droplet with no backup.

Objects are namespaced by collection slug in the bucket (`media/…`,
`videos/…`), since both collections share one bucket. That prefix is also what
keeps the DATABASE SCHEMA identical in both modes: the plugin adds its
`prefix` column when a prefix is set OR `alwaysInsertFields` is on, but only
forwards `alwaysInsertFields` on the disabled path. Without the explicit
prefix the column would exist with R2 off and vanish with R2 on, and
migrations generated locally would fight migrations generated against
production. Do not drop either setting.

`disablePayloadAccessControl` is on for `media` and `videos`: both are already
`read: () => true` public marketing assets. Never copy that setting to a
collection holding anything private.

Uploaded filenames are never rewritten in place — replacing an image produces
a new filename — so files are cached `immutable` for a year
(`cms/next.config.mjs` for the disk path, Cloudflare rules for the R2 path).

## Publish → deploy

Content bakes into static pages at build time. `cms/src/hooks/
deployWebhook.ts` calls the Dokploy deploy webhook for the site app when an
item is published (create or update), so fresh content goes live in ~1–2
minutes. If content seems stale, check `DOKPLOY_DEPLOY_URL` on the CMS first.

## Privacy

- No member PII in this repo, in the CMS, or in logs.
- Pastoral service coordinators appear on `/services` by FIRST NAME only
  (`PASTORAL_SERVICES` in `src/lib/site.ts`). Never add a surname, phone
  number, email address or handle, even when marketing supplies one. Requests
  reach them through the question form, which emails `QUESTION_TEAM_EMAIL` for
  the office to forward.
- Prayer requests (future endpoint) are emailed to the prayer team only —
  never stored in the CMS, never logged with contents.
