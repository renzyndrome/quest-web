/*
  Builds the "Preview" button URL shown beside Save in the document editor,
  and the same link in the approval email.

  Payload renders the button whenever a collection defines `admin.preview`,
  and opens whatever URL this returns in a new tab (target="_blank"). It
  points at the site's on-demand preview route, which renders the item exactly
  as the public page would — including drafts and items still in review.

  Returning null hides the button. That happens when PREVIEW_SECRET is unset
  (preview is disabled site-side too, so the route would 404) or before the
  item has a slug, i.e. on a brand-new unsaved document.

  Note the secret travels in the query string, so every signed-in CMS user can
  read it. That is the existing design — editors must be able to preview their
  own drafts — but it means PREVIEW_SECRET guards discovery, not authorship.
*/
import type { CollectionConfig } from 'payload';

type PreviewURL = NonNullable<NonNullable<CollectionConfig['admin']>['preview']>;

/*
  Collection slug → the site URL segment its preview route lives under.

  These differ on purpose: the `announcements` collection is called "News" on
  the site, and `life-testimonies` shortens to `/testimonies`. Keeping the
  mapping in one place is what stops the button and the email from drifting
  apart, or from pointing at a route that does not exist.

  A collection missing from this map has no preview route and gets no button.
*/
export const PREVIEW_SECTIONS: Record<string, string> = {
  announcements: 'news',
  events: 'events',
  'life-testimonies': 'testimonies',
};

/** The full preview URL, or null when preview is unavailable. */
export function previewUrl(collectionSlug: string | undefined, slug: unknown): string | null {
  const secret = process.env.PREVIEW_SECRET;
  const section = collectionSlug ? PREVIEW_SECTIONS[collectionSlug] : undefined;
  if (!secret || !section || typeof slug !== 'string' || slug === '') return null;

  const siteUrl = (process.env.SITE_URL ?? 'https://questlaguna.org').replace(/\/+$/, '');
  return `${siteUrl}/${section}/preview/${encodeURIComponent(slug)}?token=${encodeURIComponent(secret)}`;
}

/** `admin.preview` for a collection. Pass the collection's own slug. */
export const previewUrlFor =
  (collectionSlug: string): PreviewURL =>
  (doc) =>
    previewUrl(collectionSlug, doc?.slug);
