# Content rules — quest-web

## Ownership boundary

- Directus (cms/) = ALL public site content: announcements, carousel
  slides, events, page copy, photos. Own Postgres (`quest_content`), own
  uploads.
- tierra (TanStack Start + Supabase) = membership directory + finance only.
  Its event management is decommissioned (2026-07-08); quest-web has no
  integration with it. Never model member, registration, or finance data
  in Directus.
- Event registration is a plain `registration_url` field — marketing pastes
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

## Fetch pattern (see src/lib/directus.ts)

- All fetchers are read-only, filter on `status = published`, and fall back
  to `src/lib/sample-content.ts` on any failure — builds must never depend
  on a live CMS.
- Image URLs go through `assetUrl()` with transform params (width, format,
  quality) — never serve originals.

## Current collections (create in Directus admin; keep this list updated)

- `announcements`: title (string), slug (string, unique, URL-safe — use a
  slug interface generated from title), date (date), category (dropdown:
  Announcement/Update/Campaign/Event), body (rich text, limited), banner
  (image, optional), banner_alt (string, required when banner set), pinned
  (boolean), status (dropdown: draft/in_review/published — see approval
  workflow below). Detail pages render at `/news/[slug]`.
- `carousel_slides`: title, subtitle (string), chip (string), theme
  (dropdown: red/dark/cream/deep), image (optional), href (string), sort
  (integer), status.
- `events`: name (string), slug (string, unique, URL-safe), date (date),
  time (time, optional), venue (string, optional), description (rich text,
  limited, optional), banner (image, optional), banner_alt (string, required
  when banner set), registration_url (string, optional), registration_open
  (boolean), status (dropdown: draft/in_review/published).
  Site shows only published events with date >= build date; detail pages
  render at `/events/[slug]` (past events age out at the next rebuild).

## Editorial approval workflow (draft → in_review → published)

Publishing to the live site is gated by an approval step. **Content editors
write and submit; only admins publish.** This is enforced by Directus roles +
permissions — the Astro site cannot enforce it (editors work in Directus, and
only `status = published` is ever rendered). Full setup runbook: `cms/WORKFLOW.md`.

- `status` is a three-value dropdown on `announcements` and `events`:
  `draft` (being written), `in_review` (submitted, awaiting approval),
  `published` (live at the next rebuild).
- **Editor** role: create + edit items and set status to `draft` or
  `in_review`. Editors must NOT have permission to set `published`.
- **Admin/Approver** role: everything the editor can do, plus set status to
  `published` (approve) or back to `draft` (request changes).
- Reviewers preview an item before approving via the on-demand preview route
  `/news/preview/<slug>?token=<PREVIEW_SECRET>` — it renders drafts and
  `in_review` items live (never indexed), with a banner marking the state.
- A Directus Flow notifies the approver when an item enters `in_review`; the
  existing publish Flow (below) fires only on `published`.

## Rich text rendering (trust assumption)

Detail pages render `body`/`description` with `set:html` at build time.
This is safe only while: editors are trusted church staff, the WYSIWYG
toolbar is limited, and there is no user-generated content. Configure the
Directus WYSIWYG to strip pasted/source HTML beyond the allowed tags
(p, strong, em, a, ul, ol, li). If editor trust ever widens, add a
build-time sanitize pass (e.g. sanitize-html) inside the fetchers in
`src/lib/directus.ts` / `src/lib/events.ts` — build-only dependency, zero
client JS.

## Publish → deploy

Content bakes into static pages at build time. A Directus Flow (on publish)
calls the Dokploy deploy webhook for the site app so fresh content goes live
in ~1–2 minutes. If content seems stale, check that Flow first.

## Privacy

- No member PII in this repo, in Directus, or in logs.
- Prayer requests (future endpoint) are emailed to the prayer team only —
  never stored in the CMS, never logged with contents.
