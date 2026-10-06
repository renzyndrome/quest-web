# GenZeal youth site: Next.js + Puck, standalone output.
#
# Deployed as its own Dokploy Compose service (see docker-compose.yml).
# The pages table is created on first request; there are no migrations.

FROM node:22-alpine AS builder
WORKDIR /app

RUN apk add --no-cache libc6-compat
COPY package.json package-lock.json* ./
RUN npm ci

COPY . .

ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN apk add --no-cache libc6-compat

# Standalone output bundles only the server + its used dependencies
# (sharp's native binaries included).
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

RUN mkdir -p /app/uploads

EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME=0.0.0.0
ENV UPLOAD_DIR=/app/uploads

CMD ["node", "server.js"]
