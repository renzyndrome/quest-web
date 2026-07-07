# quest-web — Quest Laguna public website

Public marketing and community website for Quest Laguna, a promise-driven
church with nine locations across Laguna, Philippines. Traffic is mostly
mobile (mid-range Android, variable 4G) — mobile performance is the top
technical priority.

## Stack

- **Astro 5** — static-first, node adapter (standalone) for future on-demand
  routes (prayer form endpoint, previews). Vanilla JS in `<script>` for the
  few interactive islands; no React/UI framework.
- **Tailwind CSS 4** — design tokens in `src/styles/global.css` `@theme`.
- **Directus 11 + Postgres 16** — marketing content CMS, `cms/docker-compose.yml`.
- **Docker + Dokploy** — both the site (root `Dockerfile`) and the CMS
  (compose) deploy as Dokploy services on the DigitalOcean droplet.

## Commands

```bash
npm run dev        # dev server
npm run build      # production build (must pass before any handoff)
npm run preview    # preview the build
```

Node is managed via nvm (`~/.nvm/versions/node/v22.17.0`).

## Architecture boundaries — do not cross

- **This repo**: presentation + marketing content only. Owned by the
  marketing team.
- **Directory app** (separate repo; TanStack Start + Supabase, Dokploy on the
  same droplet): system of record for members, events, registrations,
  finance. quest-web only READS events via `EVENTS_API_URL` and links out to
  its registration pages. Never write to it, never touch member/finance data.
- **Directus** gets its own Postgres (`quest_content`). Never connect it to
  the directory app's Supabase.
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
