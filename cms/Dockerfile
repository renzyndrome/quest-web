# Quest Laguna content CMS — Payload 3 on Next.js, standalone output.
#
# Deployed as its own Dokploy service, separate from the site image (see the
# repo-root Dockerfile). Migrations run on boot: with the postgres adapter,
# schema changes MUST be applied by `payload migrate`, not dev push-mode.

FROM node:22-alpine AS builder
WORKDIR /app

RUN apk add --no-cache libc6-compat
COPY package.json package-lock.json* ./
RUN npm ci

COPY . .

# Next needs a value at build time; the real secret is injected at runtime.
ENV PAYLOAD_SECRET=build-time-placeholder
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV MEDIA_DIR=/app/media

RUN apk add --no-cache libc6-compat

# Standalone output bundles only the server + its used dependencies.
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public
# Migrations + config are needed by the `payload migrate` step on boot.
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/payload.config.ts ./payload.config.ts
COPY --from=builder /app/src ./src

RUN mkdir -p /app/media

EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

# Apply pending migrations, then serve. If migrate fails the container exits
# rather than serving against a stale schema.
CMD ["sh", "-c", "npx payload migrate && node server.js"]
