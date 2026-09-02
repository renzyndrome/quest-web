/*
  Where uploaded files live.

  Two modes, chosen by whether R2_BUCKET is set — the same "no-op when the env
  is unset" pattern the deploy and notify hooks use:

    unset  → Payload writes to the local disk (MEDIA_DIR, a Docker volume).
             This is local development and both e2e suites.
    set    → files go to Cloudflare R2 and are served straight from its public
             domain, never through the CMS.

  Why R2 in production: the droplet has no CDN in front of it, so every photo
  on the site is a round trip to a single box, competing with the CMS itself
  for bandwidth — on an audience that is mostly mid-range Android on 4G. It
  also means uploads are the one thing on the droplet with no backup: a
  rebuilt volume takes the church's own photos with it. Object storage fixes
  both, and makes the self-hosted testimony video defensible, since that file
  no longer streams from the droplet either.

  `disablePayloadAccessControl` is safe here because `media` and `videos` are
  already world-readable (`read: () => true`) — they are public marketing
  images. Do NOT copy this for anything private.
*/
import { s3Storage } from '@payloadcms/storage-s3';
import type { Plugin, UploadCollectionSlug } from 'payload';

const bucket = process.env.R2_BUCKET ?? '';
const accountId = process.env.R2_ACCOUNT_ID ?? '';
const publicUrl = (process.env.R2_PUBLIC_URL ?? '').replace(/\/+$/, '');

/** True once the bucket is configured. Everything else stays on disk. */
export const usingR2 = Boolean(bucket);

/**
 * Public URL for one stored file.
 *
 * Payload passes the already-resized filename for each image preset, so the
 * `size` argument needs no special handling — `filename` is always the exact
 * object key's last segment.
 */
export const publicFileUrl = ({
  filename,
  prefix,
}: {
  filename: string;
  prefix?: string;
}): string =>
  [publicUrl, prefix, encodeURIComponent(filename)].filter(Boolean).join('/');

/**
 * Per-collection options. The prefix is the collection slug, which does two
 * jobs:
 *
 *  - namespaces objects in the bucket (media/… and videos/…) instead of
 *    dumping both collections at the root, since they share one bucket;
 *  - keeps the DATABASE SCHEMA IDENTICAL in both storage modes. The plugin
 *    adds its `prefix` column when `typeof prefix !== 'undefined' ||
 *    alwaysInsertFields`, but only forwards `alwaysInsertFields` on the
 *    disabled path — so without an explicit prefix the column would exist
 *    with R2 off and vanish with R2 on, and migrations generated locally
 *    would fight migrations generated against production.
 */
const servedFromR2 = (prefix: string) => ({
  prefix,
  // Serve from the bucket's public domain rather than proxying every byte
  // back through the CMS container.
  disablePayloadAccessControl: true as const,
  generateFileURL: publicFileUrl,
});

/**
 * The storage plugin, covering every upload collection it is given.
 *
 * It takes the list rather than hard-coding it so payload.config.ts can pass
 * the same array it registers, making it impossible to add an upload
 * collection to the app and forget to give it storage — which would silently
 * leave that collection writing to the droplet while everything else moved to
 * R2.
 *
 * Note this is about upload COLLECTIONS, not content types. Every banner on
 * the site (news, events, testimonies, carousel slides) is a relation into the
 * shared `media` collection, so all of them are covered by `media` alone.
 */
export const storageFor = (uploadCollections: readonly string[]): Plugin =>
  s3Storage({
  enabled: usingR2,
  /*
    Keep the database schema identical whether or not R2 is configured.
    Without this the plugin only adds its `prefix` column when enabled, so a
    migration generated locally (no R2) would be missing a column production
    (R2) expects. One schema, one migration, no drift.
  */
  alwaysInsertFields: true,
  collections: Object.fromEntries(
    uploadCollections.map((slug) => [slug, servedFromR2(slug)]),
  ) as Partial<Record<UploadCollectionSlug, ReturnType<typeof servedFromR2>>>,
  bucket,
  config: {
    // R2 is single-region behind the scenes and expects the literal 'auto'.
    region: 'auto',
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    forcePathStyle: true,
    credentials: {
      accessKeyId: process.env.R2_ACCESS_KEY_ID ?? '',
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY ?? '',
    },
  },
  });
