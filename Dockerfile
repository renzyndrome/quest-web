# quest-web — Astro site (Dokploy application, port 8080)
FROM node:22-alpine AS build
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

# Content bakes into static pages at image build time.
# Set these as BUILD-TIME env vars in Dokploy; a Directus publish webhook
# triggers a redeploy so fresh content gets baked in.
ARG DIRECTUS_URL
ARG DIRECTUS_TOKEN
ARG EVENTS_API_URL
ARG SITE_URL
ENV DIRECTUS_URL=$DIRECTUS_URL \
    DIRECTUS_TOKEN=$DIRECTUS_TOKEN \
    EVENTS_API_URL=$EVENTS_API_URL \
    SITE_URL=$SITE_URL

RUN npm run build

FROM node:22-alpine
WORKDIR /app
ENV NODE_ENV=production HOST=0.0.0.0 PORT=8080

COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY package.json ./

EXPOSE 8080
CMD ["node", "./dist/server/entry.mjs"]
