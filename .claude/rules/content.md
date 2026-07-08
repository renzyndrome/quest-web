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
  (image, optional), pinned (boolean), status (published/draft).
  Detail pages render at `/news/[slug]`.
- `carousel_slides`: title, subtitle (string), chip (string), theme
  (dropdown: red/dark/cream/deep), image (optional), href (string), sort
  (integer), status.
- `events`: name (string), slug (string, unique, URL-safe), date (date),
  time (time, optional), venue (string, optional), description (rich text,
  limited, optional), banner (image, optional), registration_url (string,
  optional), registration_open (boolean), status (published/draft).
  Site shows only published events with date >= build date; detail pages
  render at `/events/[slug]` (past events age out at the next rebuild).

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
