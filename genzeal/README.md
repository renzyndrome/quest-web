# GenZeal

Youth sub-site of Quest Laguna Church at genzeal.questlaguna.org. A small
Next.js 16 app with a Puck visual editor: pages are stored as Puck JSON in
its own Postgres, uploaded photos are converted to WebP on a Docker volume.
It is a separate Dokploy Compose service with no link to the main site's CMS
or to the membership app.

## Local development

```bash
cd genzeal
npm install

# Postgres on localhost:5432 (needs the dokploy-network to exist once:
# docker network create dokploy-network)
DB_PASSWORD=dev docker compose run --rm -p 5432:5432 postgres

# In another terminal
DATABASE_URI=postgres://genzeal:dev@localhost:5432/genzeal \
EDITOR_PASSWORD=dev \
npm run dev
```

The `pages` table is created on the first request. Uploads land in
`genzeal/uploads/` unless `UPLOAD_DIR` is set.

Checks: `npm run typecheck`, `npm run build`. The build never touches the
database.

## Editing

All editor URLs ask for HTTP Basic sign-in: any username, `EDITOR_PASSWORD`
as the password.

- `/edit`: list of pages, plus a form to open a new one
- `/home/edit`: the home page
- `/<page>/edit`: any other page, e.g. `/camp-2026/edit`

Publish in the editor saves the page; it is live immediately. Page addresses
are lowercase letters, digits and hyphens, nested with `/`.

## Deploy on Dokploy

1. Create service → Compose, point at this repo, compose path
   `genzeal/docker-compose.yml`.
2. Set the env vars from `.env.example`: `DB_PASSWORD`, `EDITOR_PASSWORD`
   (both via `openssl rand -hex 32`), optionally `DB_USER`, `DB_DATABASE`.
3. Add the domain `genzeal.questlaguna.org` → service `genzeal`, port 3000,
   HTTPS on.
4. Deploy, open `/edit`, build the home page.

## Photos on R2

Set `R2_BUCKET`, `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`
and `R2_PUBLIC_URL` to store new uploads in Cloudflare R2 instead of the
volume. It is the SAME bucket and credentials as the CMS; GenZeal objects land
under `genzeal/`. `R2_PUBLIC_URL` is what gets baked into each `<img src>`, so
it must be publicly reachable. With `R2_BUCKET` set and any other R2 var
missing, uploads fail and the server log names the missing var. Photos
uploaded before the switch stay on the volume and keep working.

## Backups

Two volumes hold everything: `genzeal_db` (page content) and
`genzeal_uploads` (every photo uploaded while R2 is off). The uploads volume
has no other copy; back up both.
