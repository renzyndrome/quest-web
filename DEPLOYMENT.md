# Deployment & configuration — quest-web

Two Dokploy services deploy from this one repo, both on the DigitalOcean
droplet. The site builds and runs fully on sample content with **no env vars
set** — every integration below is opt-in and degrades gracefully.

> **Deploying for the first time? Start at [First deploy — order of
> operations](#first-deploy--order-of-operations) at the bottom.** The order
> matters: the site needs an API key that only exists once the CMS is up.

## 1. Site (Dokploy Application service)

- **Build**: root `Dockerfile`, container port `8080`
- **Domain**: `questlaguna.org` (HTTPS on, Let's Encrypt)
- **Runtime**: Node standalone server (`node ./dist/server/entry.mjs`). The
  node adapter is required because the prayer endpoint renders on demand.

### Build-time env (baked into the static pages)

| Variable | Effect if unset |
|---|---|
| `SITE_URL` | Canonical/OG URLs default to `https://questlaguna.org` |
| `CMS_URL` | Content uses sample fallback. Public CMS URL, e.g. `https://cms.questlaguna.org` (no trailing slash) |
| `CMS_TOKEN` | (with URL) read-only site API key; **required to preview drafts** |
| `CMS_REQUIRED` | **Set to `true` in production.** Unset, an unreachable CMS silently bakes in placeholder sample content and the build still succeeds. Set, that becomes a failed build |
| `YOUTUBE_API_KEY` | Sermons archive uses sample entries |
| `YOUTUBE_PLAYLIST_FAMILY` / `_YOUNGPRO` / `_YOUTH` / `_DAWN` | Per-service playlists; unset services are skipped |

### Runtime env (read by the live server — NOT baked into the build)

| Variable | Effect if unset |
|---|---|
| `RESEND_API_KEY` | Prayer form falls back to the Messenger handoff |
| `PRAYER_TEAM_EMAIL` | " |
| `PRAYER_FROM_EMAIL` | " (must be a Resend-verified sender, e.g. `prayer@questlaguna.org`) |
| `QUESTION_TEAM_EMAIL` / `QUESTION_FROM_EMAIL` | Connect-page question form falls back to Messenger |
| `PREVIEW_SECRET` | Draft preview route disabled (returns 404) |

> **Why the split matters:** secrets that must never appear in the shipped
> HTML/JS (the Resend key) are read via `process.env` at request time in
> `src/pages/api/prayer.ts`. Build-time vars (`import.meta.env`) are used only
> in server/build context (fetchers), never sent to the browser.

## 2. CMS (Dokploy Compose service)

- **Compose path**: `cms/docker-compose.yml` (Payload 3 + its own Postgres 16)
- **Domain**: `cms.questlaguna.org` → service `payload`, port `3000`, HTTPS on
- **Env**: see `cms/.env.example` (`openssl rand -hex 32` for secrets)

Collections, roles, and the publish/notify hooks are **defined in code** under
`cms/src/`, so there is nothing to click-configure.

The container boots via `cms/docker-entrypoint.sh`: it runs `payload migrate`
(always — fatal on failure, so it never serves a stale schema), optionally
seeds the starting content when `SEED_ON_BOOT=true`, then serves. The initial
migration is committed at `cms/src/migrations/`; run `npm run migrate:create`
in `cms/` and commit the result whenever a collection changes.

Set `SEED_ON_BOOT=true` for the FIRST deploy to load the church's photo
library and starting announcements/events/slides, then set it back to `false`.
The seed is additive and never overwrites existing items, so leaving it on is
safe — it just slows restarts.

### CMS env (set in the Dokploy environment tab)

| Variable | Required | Value |
|---|---|---|
| `PAYLOAD_SECRET` | **yes** | `openssl rand -hex 32`. Changing it invalidates every API key and login session |
| `DB_PASSWORD` | **yes** | `openssl rand -hex 32` |
| `DB_USER` / `DB_DATABASE` | no | default `payload` / `quest_content` |
| `PAYLOAD_PUBLIC_SERVER_URL` | **yes** | `https://cms.questlaguna.org`. **Media URLs are built from this** — if it is wrong or still `localhost`, every image baked into the site points at a dead host |
| `SITE_ORIGIN` | no | `https://questlaguna.org` (browser CORS allow-list) |
| `SITE_URL` | no | `https://questlaguna.org` (used in approval emails) |
| `SEED_ON_BOOT` | first deploy | `true` for the first boot to load the church's photo library and starting content; set to `false` afterwards |
| `DOKPLOY_DEPLOY_URL` | recommended | the SITE service's Dokploy deploy webhook — publishing then rebuilds the site (~1–2 min) |
| `RESEND_API_KEY` + `APPROVER_EMAIL` + `APPROVER_FROM_EMAIL` | optional | emails the approver when an item enters `in_review`; all three or none |
| `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD` | **leave unset** | local-development only. Unset means Payload shows its onboarding screen so the first admin picks their own password |

`MEDIA_DIR` is fixed to `/app/media` by the compose file and backed by the
`payload_media` volume — do not override it.

## First deploy — order of operations

The site's build needs an API key that only exists after the CMS is running,
so the CMS goes first.

**1. Deploy the CMS.** Compose service, path `cms/docker-compose.yml`, domain
`cms.questlaguna.org` → service `payload`, port `3000`, HTTPS on. Set the env
above **with `SEED_ON_BOOT=true`**.

On boot the container runs `payload migrate`, then the seed. Watch the logs
for:

```
[cms] applying migrations…
INFO: Migrated:  20260805_161855_initial
[cms] seeding initial content…
  + admin ...                      (only if SEED_ADMIN_* set — production: skipped)
  + media quest-laguna-logo.webp   ... 23 images
  + announcements/isang-dekada-ng-katapatan   ... 4 announcements
  + events/quest-retreat-2026                 ... 2 events
  + slide NextLevel: Stronger 2026            ... 3 slides
seed:initial done
[cms] starting server…
```

The 23 photos ship **inside the image** (`cms/seed/assets/`, 5.3 MB) — there is
nothing to upload manually. They land in the `payload_media` volume and are
ordinary CMS records from then on: editable, unpublishable, deletable.

**2. Create the first admin.** Open `https://cms.questlaguna.org/admin`
immediately — the onboarding screen creates it, and there is no default
account. Set its Role to *Admin / approver*.

**3. Create the site's read-only user.** Users → Create (e.g.
`site@questlaguna.org`) → enable **API Key** → copy it.

**4. Deploy the site.** Application service, root `Dockerfile`, port `8080`,
domain `questlaguna.org`. Set the build-time env — `CMS_URL`,
`CMS_TOKEN` (the key from step 3), `SITE_URL`, and **`CMS_REQUIRED=true`** —
plus the runtime env (`PREVIEW_SECRET`, and the Resend vars if used).

**5. Set `DOKPLOY_DEPLOY_URL`** on the CMS to the site's deploy webhook, and
**flip `SEED_ON_BOOT` to `false`**. Add a daily scheduled rebuild so past
events age out of the "upcoming" list.

### Verify the deploy

```bash
curl -s https://cms.questlaguna.org/api/announcements | head -c 200   # published only
curl -sI https://questlaguna.org/news | head -1                       # 200
```

- `https://questlaguna.org/news` shows the real church announcements, not
  "Dawn service resumes" (that string is sample content — seeing it means the
  build fell back, which `CMS_REQUIRED=true` should have prevented).
- An announcement banner's `src` is `https://cms.questlaguna.org/api/media/file/…webp`
  and loads. If it points at `localhost`, `PAYLOAD_PUBLIC_SERVER_URL` was wrong
  when the media was uploaded.
- `https://questlaguna.org/news/preview/<slug>?token=<PREVIEW_SECRET>` renders
  a draft. A 404 with a correct token means `CMS_TOKEN` cannot read drafts
  (see the warning below).

> **A wrong `CMS_TOKEN` fails quietly.** Payload treats an invalid API key as
> an anonymous reader rather than rejecting it, so the build still gets all
> published content and looks completely healthy — only draft preview breaks.
> `CMS_REQUIRED` cannot catch this. Test the preview URL after deploying.

> **Rotating `CMS_TOKEN` or `CMS_URL` needs a site rebuild**, not a restart:
> they are `import.meta.env` values baked in at build time, including for the
> preview route.

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
