---
name: quest-payload
description: Wire Payload CMS-backed content into quest-web — collection config, access rules, fetch function with sample fallback, publish hook. Use when adding or changing CMS-driven content.
---

# Wiring Payload CMS content into quest-web

Read `.claude/rules/content.md` for boundaries. This skill is the how-to.
For schema design decisions, delegate to the `quest-content-modeler` agent.

The CMS is its own Next.js + Payload app in `cms/`. Collections, roles, and
hooks are **code** — never click-configured — so every change is reviewable
and testable.

## The pattern (four pieces, always all four)

1. **Sample data** in `src/lib/sample-content.ts` — the site must build and
   look complete with zero infrastructure running.

2. **Collection config** in `cms/src/collections/Things.ts`:

```ts
export const Things: CollectionConfig = {
  slug: 'things',
  access: {
    read: readPublishedOrAuthenticated,   // public sees published only
    create: isAuthenticated,
    update: isAuthenticated,
    delete: isAdmin,
  },
  hooks: {
    afterRead: [addHtmlFields(['body'])], // rich text → bodyHtml
    afterChange: [deployWebhook, notifyApprover],
  },
  fields: [
    { name: 'title', type: 'text', required: true },
    { name: 'slug', type: 'text', required: true, unique: true, index: true },
    { name: 'image', type: 'upload', relationTo: 'media' },
    statusField,                          // draft | in_review | published
  ],
};
```

Register it in `cms/payload.config.ts`, then `cd cms && npm run migrate:create`
and commit the migration (postgres needs it; dev push-mode is not used in prod).

3. **Fetch function** in `src/lib/cms.ts` — always with the sample fallback:

```ts
export async function getThings(): Promise<Thing[]> {
  const { sampleThings } = await import('./sample-content');
  const data = await cmsFetch<RawThing[]>(
    '/api/things?where[status][equals]=published&sort=-date&limit=20&depth=1',
  );
  if (data === null) return sampleThings;   // null = CMS unset/unreachable
  return data.map(mapThing);
}
```

`cmsFetch` unwraps Payload's `{ docs }` envelope and returns `null` on any
failure. An empty array from a live CMS is a legitimate "nothing here" state —
only `null` should trigger the fallback.

4. **Deploy hook** — already wired: `deployWebhook` on `afterChange` POSTs
   `DOKPLOY_DEPLOY_URL` when an item is published. Content bakes at build time,
   so without it published content never appears.

## Images

Use `depth=1` so upload relations arrive populated, then resolve with
`mediaUrl(doc.image, 'banner' | 'card')`. Presets are defined once in
`cms/src/collections/Media.ts` (`banner` 1200w, `card` 800w, webp q80) — add a
preset there rather than requesting arbitrary sizes. Alt text is required.

## Rich text

Payload stores Lexical JSON. `addHtmlFields([...])` converts it server-side so
the site receives a plain HTML string (`bodyHtml`, `descriptionHtml`). Never
import Lexical into the Astro app; keep the editor's feature set limited
(paragraph, bold, italic, link, lists).

## Environment

- Site: `CMS_URL` + `CMS_TOKEN` (a site user's API key) — build-time env
  (Dokploy build args; `.env` locally). `PREVIEW_SECRET` is runtime-only.
- CMS: `cms/.env.example` → `cms/.env`. Local:
  `cd cms && docker compose up -d` → admin at http://localhost:3000/admin.

## Testing

- `npm run test:e2e` — must pass with the CMS unset (sample content).
- `npm run test:e2e:cms` — boots a real Payload on SQLite, seeds it, builds
  against it. Add assertions here when you add a collection.
- Break `CMS_URL` → build must warn and fall back, never fail.
