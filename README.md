# quest-web — Quest Laguna public website

Public marketing/community website for Quest Laguna church (nine locations,
Laguna, Philippines). Mobile-first: most visitors are on mid-range Android
phones over variable 4G.

**Stack**: Astro 5 · Tailwind 4 · Directus 11 + Postgres 16 (content CMS) ·
Docker on Dokploy (DigitalOcean droplet).

## Quick start

```bash
npm install
npm run dev        # http://localhost:4321
```

The site builds and renders with built-in sample content — no CMS or API
needed. Real content sources are opt-in via env vars (see `.env.example`).

## How content flows

| Content | System of record | Path to the site |
|---|---|---|
| Announcements, carousel slides, page copy | Directus (`cms/`) | Fetched at build time, baked into static pages |
| Events + registration | Directory app (separate repo, TanStack Start + Supabase) | Read-only feed via `EVENTS_API_URL`; Register links go to the app |
| Sermons / live streams | YouTube | Embeds (facade pattern), per-service playlists |
| Prayer requests | (phase 2) server endpoint → prayer team email | Never stored in the CMS |

Content is baked at build time. Publishing in Directus triggers a rebuild
via a Directus Flow → Dokploy deploy webhook (~1–2 min to live).

## Deploying on Dokploy

Two services from this one repo:

**1. CMS (Compose service)**
- Compose path: `cms/docker-compose.yml`
- Env vars: see `cms/.env.example` (generate secrets with `openssl rand -hex 32`)
- Domain: e.g. `cms.questlaguna.org` → service `directus`, port `8055`
- First login with `ADMIN_EMAIL`/`ADMIN_PASSWORD`, then:
  1. Create collections `announcements` and `carousel_slides`
     (field specs in `.claude/rules/content.md`)
  2. Create a "site" role with read-only access to published items; make a
     static token for it → `DIRECTUS_TOKEN`
  3. Create a Flow: on item create/update in content collections → webhook
     POST to the site app's Dokploy deploy URL

**2. Site (Application service)**
- Build: root `Dockerfile`, port `8080`
- Build-time env: `DIRECTUS_URL`, `DIRECTUS_TOKEN`, `EVENTS_API_URL`, `SITE_URL`
- Domain: `questlaguna.org` (put Cloudflare in front for edge caching — the
  site is static HTML, so cache aggressively)

## Local CMS

```bash
cd cms && cp .env.example .env   # fill in secrets
docker compose up -d              # uncomment the ports mapping first
# admin at http://localhost:8055
```

## Project structure

```
src/
  components/    SiteHeader, SiteFooter, HeroBanner, EventsCarousel,
                 PhotoSlot, Eyebrow, PillButton, ScriptureLine
  layouts/       Base.astro (fonts, SEO meta, header/footer)
  lib/           directus.ts (CMS fetch), events.ts (directory app feed),
                 sample-content.ts (fallbacks — site always builds)
  pages/         index + sermons/news/ministries/give/connect
  styles/        global.css (Tailwind 4 @theme — all design tokens)
cms/             Directus + Postgres compose (Dokploy)
design_handoff_church_website/   original design handoff (reference only)
.claude/         project rules, agents, skills for Claude Code
```

## Roadmap

- [x] Scaffold: tokens, fonts, shared chrome, image-rich home, carousel
- [x] Home: mini About, upcoming events + latest news sections with see-all
- [x] Sermons: featured player (facade), service cards, filterable archive
- [x] News: pinned card, upcoming events strip, announcement rows
- [x] Ministries & Give: full layouts (giving = GCash QR + in person; the QR
      image is a client-supplied placeholder — dashed box)
- [x] Connect: prayer form UI with success state (client-side only)
- [ ] Photos: replace `PhotoSlot` placeholders with real congregation photos
- [ ] Sermons archive: real per-service YouTube playlists fetched at build
      (replaces sample entries in `sample-content.ts`)
- [ ] Prayer form backend: server endpoint (`prerender = false`) → email to
      prayer team; wire the form's submit handler to it
- [ ] Events API on the directory app + TLS domain for it
- [ ] Directus media → Cloudflare R2 (S3 driver) when uploads grow
- [ ] Mobile QA: Lighthouse throttled, real device, reduced-motion
