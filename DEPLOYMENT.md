# Deployment & configuration — quest-web

Two Dokploy services deploy from this one repo, both on the DigitalOcean
droplet. The site builds and runs fully on sample content with **no env vars
set** — every integration below is opt-in and degrades gracefully.

## 1. Site (Dokploy Application service)

- **Build**: root `Dockerfile`, container port `8080`
- **Domain**: `questlaguna.org` (HTTPS on, Let's Encrypt)
- **Runtime**: Node standalone server (`node ./dist/server/entry.mjs`). The
  node adapter is required because the prayer endpoint renders on demand.

### Build-time env (baked into the static pages)

| Variable | Effect if unset |
|---|---|
| `SITE_URL` | Canonical/OG URLs default to `https://questlaguna.org` |
| `DIRECTUS_URL` | Content uses sample fallback |
| `DIRECTUS_TOKEN` | (with URL) read-only site token |
| `YOUTUBE_API_KEY` | Sermons archive uses sample entries |
| `YOUTUBE_PLAYLIST_FAMILY` / `_YOUNGPRO` / `_YOUTH` / `_DAWN` | Per-service playlists; unset services are skipped |

### Runtime env (read by the live server — NOT baked into the build)

| Variable | Effect if unset |
|---|---|
| `RESEND_API_KEY` | Prayer form falls back to the Messenger handoff |
| `PRAYER_TEAM_EMAIL` | " |
| `PRAYER_FROM_EMAIL` | " (must be a Resend-verified sender, e.g. `prayer@questlaguna.org`) |

> **Why the split matters:** secrets that must never appear in the shipped
> HTML/JS (the Resend key) are read via `process.env` at request time in
> `src/pages/api/prayer.ts`. Build-time vars (`import.meta.env`) are used only
> in server/build context (fetchers), never sent to the browser.

## 2. CMS (Dokploy Compose service)

- **Compose path**: `cms/docker-compose.yml` (Directus 11 + its own Postgres 16)
- **Domain**: `cms.questlaguna.org` → service `directus`, port `8055`, HTTPS on
- **Env**: see `cms/.env.example` (`openssl rand -hex 32` for secrets)

### First-run CMS checklist

1. Log in with `ADMIN_EMAIL` / `ADMIN_PASSWORD`, change the password.
2. Create collections per `.claude/rules/content.md`:
   `announcements`, `carousel_slides`, `events` — including the `slug` and
   `banner_alt` fields.
3. Create a **site** role: read-only access to *published* items; generate a
   static token → `DIRECTUS_TOKEN` on the site service.
4. Create a **Flow**: on item create/update in content collections → webhook
   POST to the site service's Dokploy deploy URL (publish → live in ~1–2 min).
5. Add a **daily scheduled rebuild** (Directus scheduled Flow or cron hitting
   the same deploy webhook) so past events age out of the "upcoming" list.

## Integration setup (when ready)

### Prayer email (Resend)
1. Create a Resend account, verify the sending domain (`questlaguna.org`).
2. Set `RESEND_API_KEY`, `PRAYER_TEAM_EMAIL`, `PRAYER_FROM_EMAIL` as **runtime**
   env on the site service. Redeploy.
3. Test: submit the Connect form → the team inbox receives it, and the page
   shows "We've received your request." Confidential submissions carry a
   `[Confidential]` subject marker.

### Sermons (YouTube) — three tiers, pick your effort level
- **Now (no setup):** the archive already shows real recent uploads via the
  channel's public RSS feed (keyless), uncategorized.
- **Key only:** set `YOUTUBE_API_KEY` (Google Cloud → enable YouTube Data
  API v3). The archive switches to real **past live broadcasts** (filtered via
  `liveStreamingDetails`), still uncategorized. No playlist maintenance.
- **Key + playlists:** also create one playlist per service in YouTube Studio,
  drop each recording into the right one, and set the four `YOUTUBE_PLAYLIST_*`
  vars. The archive becomes **categorized** with the service filter tabs.

Set the vars as build env, then redeploy (or wait for the daily rebuild).

## TLS gotcha (seen once)

If a domain serves `TRAEFIK DEFAULT CERT` (browser shows "Not Secure") the
Let's Encrypt account email is unset. Set it in Dokploy → **Web Server**
settings, then restart Traefik (`docker restart dokploy-traefik`). LE
rate-limits failed issuance to 5/hour/domain.
