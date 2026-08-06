# Running and verifying locally

## The short version

```bash
make install   # once
make dev       # CMS + Postgres + site, one command
```

Then the site is at http://localhost:4321 and the CMS admin at
http://localhost:3000/admin (`admin@questlaguna.local` / `localdev12345`).
Ctrl-C stops the site; the CMS keeps running until `make down`.

`make` on its own lists every target. `make doctor` checks your toolchain.
The Makefile picks up the nvm-pinned Node automatically, so you do not need to
`nvm use` first.

| Target | What it does |
|---|---|
| `make dev` | CMS in the background, site dev server in the foreground |
| `make cms` / `make down` | start / stop just the CMS stack |
| `make reset` | wipe the CMS database and uploads, then start fresh |
| `make logs` | follow the CMS logs |
| `make migrate` | apply pending migrations |
| `make migrate-create` | generate a migration after a collection change |
| `make seed` | re-run the content seed (additive) |
| `make admin` | print the local admin credentials |
| `make test` / `make test-cms` | offline / integration e2e |
| `make test-all` | type-check plus both suites |

The rest of this document is what those targets do underneath, and what to
click through to verify the CMS actually works.

---

## Doing it by hand

Two ways to run. Pick **A** if you just want to see the site and click around
the CMS; pick **B** if you are changing CMS code and want fast reloads.

Node is managed via nvm — `nvm use 22.17.0` before any `npm` command.

---

## A. Full stack in Docker (closest to production)

This runs exactly what deploys: the CMS image, its Postgres, migrations on
boot, and the church's starting content.

```bash
cd cms
docker compose --env-file local.env \
  -f docker-compose.yml -f docker-compose.local.yml up --build
```

`--env-file local.env` is required, not optional: `docker-compose.yml` guards
`PAYLOAD_SECRET` and `DB_PASSWORD` with `${VAR:?}` so a production deploy fails
loudly when they are missing, and compose resolves those guards before any
overlay applies. `local.env` is committed and holds dev-only values.

First run takes a few minutes (it builds the Next image). You are ready when
the logs show the boot sequence complete:

```
[cms] applying migrations…
INFO: Migrated:  20260805_161855_initial (805ms)
[cms] seeding initial content…
  + admin admin@questlaguna.local
  + media quest-laguna-logo.webp
  ... 23 media, 4 announcements, 2 events, 3 slides ...
seed:initial done
[cms] starting server…
```

Then:

| What | Where |
|---|---|
| CMS admin | http://localhost:3000/admin |
| Email | `admin@questlaguna.local` |
| Password | `localdev12345` |

Those credentials come from `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD` in
`local.env`. **Production has no seeded admin and no default credentials** —
the seed only creates one when both vars are set, so a real deploy that omits
them gets Payload's onboarding screen and the first admin chooses their own
password.

Now run the site against it, in a second terminal from the repo root:

```bash
nvm use 22.17.0
CMS_URL=http://localhost:3000 npm run dev
```

Open http://localhost:4321.

To stop, and to wipe the database and uploads for a clean re-run:

```bash
cd cms
docker compose --env-file local.env \
  -f docker-compose.yml -f docker-compose.local.yml down -v
```

---

## B. CMS in node, Postgres in Docker (fast iteration)

```bash
# 1. Postgres only
cd cms
docker compose --env-file local.env \
  -f docker-compose.yml -f docker-compose.local.yml up -d postgres

# 2. CMS, with hot reload
npm install
export PAYLOAD_SECRET=local-dev-secret
export DATABASE_URI=postgres://payload:devpass@localhost:55432/quest_content
export PAYLOAD_PUBLIC_SERVER_URL=http://localhost:3000
export MEDIA_DIR=./media
npm run migrate                      # apply schema
SEED_ADMIN_EMAIL=admin@questlaguna.local \
SEED_ADMIN_PASSWORD=localdev12345 \
  npm run seed:initial               # admin + starting content
npm run dev                          # http://localhost:3000/admin
```

Then the site from the repo root, as above.

---

## What to verify

**Content reaches the site.** With the CMS running, the home page carousel,
`/news` and `/events` show the seeded church content instead of the built-in
samples. Announcement banners should be webp URLs served from
`localhost:3000/api/media/file/...`.

**The approval workflow.** This is the part worth clicking through:

1. In the admin, create a user with **Role = Content editor**, log in as them.
2. Create an announcement and try to set **Status = Published** → it is
   rejected with *"Only admins can publish."*
3. Set it to **In review** and save. That works.
4. Log back in as the admin and preview it before approving:
   ```
   http://localhost:4321/news/preview/<slug>?token=<PREVIEW_SECRET>
   ```
   You need `PREVIEW_SECRET` set on the *site* when you start it:
   ```bash
   CMS_URL=http://localhost:3000 PREVIEW_SECRET=localpreview npm run dev
   ```
   The page renders with an *"In review — awaiting approval"* banner. A wrong
   token gives a 404.
5. As the admin, set **Status = Published**. Restart the site build to see it
   go live (content bakes at build time; in production the deploy hook does
   this automatically).

**Content is editable.** Everything the seed creates is ordinary CMS content —
edit a seeded announcement's title, rebuild, and the change shows. Re-running
the seed will not undo it.

---

## Automated checks

```bash
npm run test:e2e       # 26 tests, no CMS needed (sample-content fallback)
npm run test:e2e:cms   # 17 tests, boots a real Payload and builds against it
npx astro check        # types
npm run build          # production build
```

`test:e2e:cms` is self-contained: it starts its own CMS on SQLite, seeds test
fixtures, builds the site, and tears everything down. It needs ports 3310 and
4330 free.

---

## Troubleshooting

**"port is already serving" from `test:e2e:cms`** — a previous run's CMS is
still up. Find and stop it:
```bash
ss -ltnp | grep -E ':3310|:4330'
```

**Site shows sample content, not CMS content** — `CMS_URL` was not set when you
started the site, or the CMS is unreachable. This is by design: the site never
fails to build because the CMS is down, it falls back to
`src/lib/sample-content.ts`. Check the terminal for a `[cms] … using sample
content` warning.

**Migrations fail on boot** — the container exits on purpose rather than serve
against a stale schema. If you changed a collection, generate and commit a
migration:
```bash
cd cms && npm run migrate:create
```

**Seeded content did not appear** — check `SEED_ON_BOOT=true`. The seed is
additive: it skips anything whose filename or slug already exists, so it
prints nothing on a second run. That is expected.
