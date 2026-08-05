# quest-web — Astro site (Dokploy application, port 8080)
FROM node:22-alpine AS build
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

# Content bakes into static pages at image build time.
# Set these as BUILD-TIME env vars in Dokploy; the CMS publish hook
# triggers a redeploy so fresh content gets baked in.
ARG CMS_URL
ARG CMS_TOKEN
ARG SITE_URL
ENV CMS_URL=$CMS_URL \
    CMS_TOKEN=$CMS_TOKEN \
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
