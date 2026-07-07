# Content rules — quest-web

## Ownership boundary

- Directus (cms/) = marketing content only: announcements, carousel slides,
  page copy, photos. Own Postgres (`quest_content`), own uploads.
- Directory app (TanStack Start + Supabase) = members, events,
  registrations, finance. quest-web reads events via `EVENTS_API_URL`
  (read-only) and links to its registration URLs. Never write; never model
  member or finance data in Directus.

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

- `announcements`: title (string), date (date), category (dropdown:
  Announcement/Update/Campaign/Event), body (rich text, limited), banner
  (image, optional), pinned (boolean), status (published/draft).
- `carousel_slides`: title, subtitle (string), chip (string), theme
  (dropdown: red/dark/cream/deep), image (optional), href (string), sort
  (integer), status.

## Publish → deploy

Content bakes into static pages at build time. A Directus Flow (on publish)
calls the Dokploy deploy webhook for the site app so fresh content goes live
in ~1–2 minutes. If content seems stale, check that Flow first.

## Privacy

- No member PII in this repo, in Directus, or in logs.
- Prayer requests (future endpoint) are emailed to the prayer team only —
  never stored in the CMS, never logged with contents.
