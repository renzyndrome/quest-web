# quest-web — Quest Laguna public website

Public marketing and community website for Quest Laguna Church Inc., an
independent evangelical charismatic church established December 2024 in
Biñan City, Laguna, Philippines, with satellite locations across Laguna,
Cavite, and one in Hungary. Church facts (identity, beliefs, locations,
gatherings, ministries) come from the official handbook and live in
`src/lib/site.ts` — never restate them from memory. Traffic is mostly
mobile (mid-range Android, variable 4G) — mobile performance is the top
technical priority.

## Stack

- **Astro 7** — static-first, node adapter (standalone) for the on-demand
  routes (prayer/question endpoints, draft preview). Vanilla JS in `<script>`
  for the few interactive islands; no React/UI framework.
- **Tailwind CSS 4** — design tokens in `src/styles/global.css` `@theme`.
- **Payload CMS 3 + Postgres 16** — marketing content CMS, its own Next.js app
  in `cms/` (`cms/docker-compose.yml`). Collections, roles, and the
  publish/notify hooks are code under `cms/src/`, not click-configured.
- **Docker + Dokploy** — both the site (root `Dockerfile`) and the CMS
  (compose) deploy as Dokploy services on the DigitalOcean droplet.

## Commands

```bash
npm run dev            # dev server
npm run build          # production build (must pass before any handoff)
npm run preview        # preview the build
npm run test:e2e       # offline e2e — no CMS, sample content (must stay green)
npm run test:e2e:cms   # integration e2e — boots a real Payload CMS and builds against it
```

Node is managed via nvm (`~/.nvm/versions/node/v22.17.0`).

## Architecture boundaries — do not cross

- **This repo**: presentation + all public site content (announcements,
  carousel slides, events). Owned by the marketing team.
- **tierra** (separate repo; TanStack Start + Supabase, Dokploy on the same
  droplet): membership directory and finance ONLY. Its event management is
  decommissioned (decision 2026-07-08) — quest-web has no integration with
  it. Never touch member/finance data.
- **Events are marketing content** in the CMS `events` collection.
  Registration links are plain URLs pasted by marketing (Google Form, FB,
  etc.) — never rebuild registration/attendee tracking in this repo or in
  the CMS.
- **The CMS** gets its own Postgres (`quest_content`). Never connect it to
  tierra's Supabase.
- **Publishing is gated by approval**: editors set `draft`/`in_review`, only
  admins set `published`. Enforced in `cms/src/` — see `cms/WORKFLOW.md`.
- **Video lives on YouTube** (channel `UCqyGbGmIG_CmocMrAnrufsA`). Never
  self-host video; never ship a raw YouTube iframe (use a facade, e.g.
  lite-youtube-embed).
- Content fetchers in `src/lib/` must always fall back to
  `src/lib/sample-content.ts` so the site builds without a running CMS.

## Design direction

@.claude/rules/design.md

## Content rules

@.claude/rules/content.md

## Reference

`design_handoff_church_website/` is the original design handoff (tokens,
page specs, copy). It is the base design language — but the current
direction upgrades it to be image-rich (see design rules). Never edit the
handoff files; they are reference material.
