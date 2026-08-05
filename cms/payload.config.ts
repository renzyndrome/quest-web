/*
  Quest Laguna content CMS — Payload 3.

  Holds MARKETING CONTENT ONLY (announcements, events, carousel slides, media).
  Member and finance data live in the separate membership app — never model
  them here (see .claude/rules/content.md).

  The editorial approval workflow that used to be click-configured in Directus
  now lives in code: src/access/roles.ts, src/fields/statusField.ts, and the
  two hooks in src/hooks/.
*/
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildConfig } from 'payload';
import { postgresAdapter } from '@payloadcms/db-postgres';
import { sqliteAdapter } from '@payloadcms/db-sqlite';
import { lexicalEditor } from '@payloadcms/richtext-lexical';
import sharp from 'sharp';

import { Users } from './src/collections/Users';
import { Media } from './src/collections/Media';
import { Announcements } from './src/collections/Announcements';
import { Events } from './src/collections/Events';
import { CarouselSlides } from './src/collections/CarouselSlides';

const dirname = path.dirname(fileURLToPath(import.meta.url));

/*
  Postgres in dev and production. The e2e integration run sets CMS_TEST_SQLITE
  so the suite needs no database service — what it exercises (REST query shape,
  access rules, hooks, the Astro integration) is adapter-independent.
*/
const database = process.env.CMS_TEST_SQLITE
  ? sqliteAdapter({
      client: { url: process.env.DATABASE_URI || 'file:./e2e.db' },
      push: true,
    })
  : postgresAdapter({
      pool: { connectionString: process.env.DATABASE_URI },
    });

export default buildConfig({
  serverURL: process.env.PAYLOAD_PUBLIC_SERVER_URL || 'http://localhost:3000',
  secret: process.env.PAYLOAD_SECRET || '',
  admin: {
    user: Users.slug,
    meta: { titleSuffix: ' — Quest Laguna CMS' },
  },
  collections: [Announcements, Events, CarouselSlides, Media, Users],
  editor: lexicalEditor(),
  db: database,
  sharp,
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
  telemetry: false,
  cors: process.env.SITE_ORIGIN ? [process.env.SITE_ORIGIN] : '*',
})
