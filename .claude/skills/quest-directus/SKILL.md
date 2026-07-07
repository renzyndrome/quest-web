---
name: quest-directus
description: Wire Directus-backed content into quest-web — collection spec, permissions, fetch function with sample fallback, publish webhook. Use when adding or changing CMS-driven content.
---

# Wiring Directus content into quest-web

Read `.claude/rules/content.md` for boundaries. This skill is the how-to.
For schema design decisions, delegate to the `quest-content-modeler` agent.

## The pattern (four pieces, always all four)

1. **Sample data** in `src/lib/sample-content.ts` — the site must build and
   look complete with zero infrastructure running.
2. **Fetch function** in `src/lib/directus.ts`:

```ts
export async function getThings(): Promise<Thing[]> {
  const { sampleThings } = await import('./sample-content');
  const data = await directusFetch<Thing[]>(
    '/items/things?filter[status][_eq]=published&sort=-date&limit=20',
  );
  return data ?? sampleThings;
}
```

3. **Collection in Directus admin** (manual, document in rules/content.md):
   - Collection name: snake_case plural. Enable status field
     (published/draft), and sort field if ordering matters.
   - Fields: typed interfaces only — dropdowns for categories, image for
     photos (alt text required), rich text with limited toolbar for body.
   - Permissions: Public role → read → published only. Or better, keep
     Public closed and use a read-only static token (`DIRECTUS_TOKEN`) for a
     "site" role.
4. **Publish → deploy Flow** (once per project): Directus Flow on
   item.create/update in content collections → webhook POST to the Dokploy
   deploy hook of the site app. Content is baked at build time; without the
   Flow, published content will not appear.

## Images

Directus file ids → URLs via `assetUrl(id, 'width=1200&format=webp&quality=80')`.
Pick width from the actual layout slot; never serve originals.

## Environment

- `DIRECTUS_URL` + `DIRECTUS_TOKEN` (read-only static token) — build-time
  env vars (Dokploy build args for the site image; `.env` locally).
- CMS stack: `cms/docker-compose.yml` (Dokploy compose service).
  Local: `cd cms && cp .env.example .env && docker compose up -d`
  → admin at http://localhost:8055.

## Testing

- Unset `DIRECTUS_URL` → build must succeed on sample content.
- Set it against local Directus → build must show CMS content.
- Break the URL → build must warn and fall back, never fail.
