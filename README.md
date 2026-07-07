# Quest Laguna — Church Website

The public website for **Quest Laguna**, a promise-driven church with nine
locations across Laguna, Philippines. 🇵🇭

Most of our visitors are on mid-range Android phones over variable 4G, so
this site is built mobile-first and ships almost zero JavaScript — pages are
static HTML served from a CDN, and the few interactive pieces (carousel,
menu, filters, prayer form) are small vanilla-JS islands.

**Live site**: [questlaguna.org](https://questlaguna.org)

## What's inside

- 🏠 **Home** — full-bleed photo hero, events carousel, upcoming events,
  latest news, and an introduction to the church
- 🎥 **Sermons** — featured player plus a filterable archive per service.
  YouTube embeds use a facade pattern: a lightweight thumbnail loads first,
  and the real player (~800KB of JS) only loads when you tap play
- 📰 **News** — pinned announcements, upcoming events, and updates
- 🙌 **Ministries** — six ministry areas and the teams inside them
- 💝 **Give** — GCash QR and in-person giving
- 🙏 **Connect** — a prayer request form that hands off to Facebook
  Messenger (a real, monitored channel) until the email backend ships

Every photo placeholder describes the real congregation photo that will
replace it — the design is intentionally full of people, not stock graphics.

## Tech stack

| Layer | Choice | Why |
|---|---|---|
| Framework | [Astro 5](https://astro.build) | Static-first, zero JS by default — fast on 4G |
| Styling | [Tailwind CSS 4](https://tailwindcss.com) | Design tokens live in one `@theme` block |
| Fonts | Self-hosted Poppins + Manrope | No Google Fonts round-trip |
| CMS | [Directus 11](https://directus.io) + Postgres | Marketing team edits content without touching code |
| Hosting | Docker on [Dokploy](https://dokploy.com) | Both site and CMS deploy from this one repo |

## Getting started

```bash
npm install
npm run dev        # http://localhost:4321
```

That's it — **no CMS, database, or API keys needed**. The site builds and
renders completely with built-in sample content (`src/lib/sample-content.ts`).
Real content sources are opt-in via environment variables:

| Variable | What it enables |
|---|---|
| `DIRECTUS_URL` + `DIRECTUS_TOKEN` | Announcements and carousel slides from the CMS |
| `EVENTS_API_URL` | Upcoming events from the church's events system |
| `SITE_URL` | Canonical URL for SEO/OG tags |

Copy `.env.example` to `.env` to configure. If a source is unset or
unreachable, the build falls back to sample content — it never fails.

## How content flows

| Content | Where it's managed | How it reaches the site |
|---|---|---|
| Announcements, carousel slides | Directus CMS | Fetched at build time, baked into static pages |
| Events & registration | Church events system (separate app) | Read-only feed; Register links go to that app |
| Sermons & live streams | YouTube | Facade embeds, per-service playlists |
| Prayer requests | Messenger handoff (email backend planned) | Never stored in the CMS |

Publishing in Directus triggers a rebuild via webhook, so edits go live in
about a minute — editors never touch git.

## Project structure

```
src/
  components/    Header, Footer, HeroBanner, EventsCarousel, YouTubeEmbed,
                 EventCard, PhotoSlot, Eyebrow, PillButton, ScriptureLine
  layouts/       Base.astro (fonts, SEO meta, shared chrome)
  lib/           directus.ts · events.ts · youtube.ts · sample-content.ts
  pages/         index · sermons · news · ministries · give · connect
  styles/        global.css (all design tokens in Tailwind's @theme)
cms/             Directus + Postgres docker-compose (deployable stack)
design_handoff_church_website/   original design handoff (reference only)
```

## Deploying

Two services deploy from this one repo (e.g. as Dokploy services):

1. **The site** — an Application service built from the root `Dockerfile`
   (port 8080). Set `SITE_URL` as a build-time env var and attach the domain.
2. **The CMS** — a Compose service from `cms/docker-compose.yml`
   (Directus + its own Postgres). Env vars are documented in
   `cms/.env.example`; generate secrets with `openssl rand -hex 32`.

First-run CMS setup: create the `announcements` and `carousel_slides`
collections, add a read-only "site" role token, and create a Flow that
calls the site's deploy webhook on publish.

## Roadmap

- [x] All six pages, image-rich, from the design handoff
- [x] Events carousel, YouTube facades, prayer form UI
- [x] CMS stack + sample-content fallbacks
- [ ] Real congregation photos (replacing labeled placeholders)
- [ ] Sermon archive from per-service YouTube playlists at build time
- [ ] Prayer form email backend
- [ ] Events feed integration
- [ ] Mobile QA pass (throttled Lighthouse, real devices, reduced motion)

## A note on brand & content

The Quest Laguna name, logo, campaign artwork, and site copy belong to
Quest Laguna church and are included here for the purpose of building and
maintaining this website. Feel free to learn from the code and architecture
— but please don't reuse the brand assets or content.

---

*"Go and make disciples of all nations." — Matthew 28:19*
