/*
  Deterministic seed for the CMS integration e2e run (see
  tests/integration/global-setup.ts). Uses the Payload Local API, so it needs
  no running HTTP server and bypasses access control.

  Seeds exactly what the specs assert against:
    - a site user with a FIXED API key (the Astro build authenticates with it)
    - an admin and an editor user (role behaviour)
    - a PUBLISHED announcement (must render on /news and its detail page)
    - an IN_REVIEW announcement (must NOT render, but must preview)
    - a future-dated PUBLISHED event (proves the date >= today query)
    - a published carousel slide

  Idempotent: clears the collections it owns before inserting.
*/
import { getPayload } from 'payload';
import sharp from 'sharp';
import config from '../payload.config';

export const SEED = {
  apiKey: 'e2e-api-key-fixed-for-tests',
  publishedSlug: 'e2e-published-announcement',
  publishedTitle: 'Combined worship night in Biñan',
  publishedBodyText: 'This announcement is published and must appear on the news page.',
  inReviewSlug: 'e2e-in-review-announcement',
  inReviewTitle: 'Draft awaiting approval from the team',
  inReviewBodyText: 'This one is awaiting approval and must never appear publicly.',
  eventSlug: 'e2e-upcoming-event',
  eventName: 'Quest Family Retreat',
  slideTitle: 'Welcome home to Quest Laguna',
} as const;

/** Minimal Lexical document wrapping a single paragraph of text. */
function lexicalParagraph(text: string) {
  return {
    root: {
      type: 'root',
      format: '',
      indent: 0,
      version: 1,
      direction: 'ltr' as const,
      children: [
        {
          type: 'paragraph',
          format: '',
          indent: 0,
          version: 1,
          direction: 'ltr' as const,
          textFormat: 0,
          children: [
            {
              type: 'text',
              detail: 0,
              format: 0,
              mode: 'normal',
              style: '',
              text,
              version: 1,
            },
          ],
        },
      ],
    },
  };
}

async function main(): Promise<void> {
  const payload = await getPayload({ config });

  // Clean slate so re-runs are deterministic.
  for (const collection of ['announcements', 'events', 'carousel-slides', 'media', 'users'] as const) {
    await payload.delete({ collection, where: { id: { exists: true } } });
  }

  await payload.create({
    collection: 'users',
    data: {
      email: 'site@questlaguna.org',
      password: 'e2e-site-password',
      name: 'Site reader',
      role: 'admin',
      enableAPIKey: true,
      apiKey: SEED.apiKey,
    },
  });
  await payload.create({
    collection: 'users',
    data: {
      email: 'admin@questlaguna.org',
      password: 'e2e-admin-password',
      name: 'Approver',
      role: 'admin',
    },
  });
  await payload.create({
    collection: 'users',
    data: {
      email: 'editor@questlaguna.org',
      password: 'e2e-editor-password',
      name: 'Editor',
      role: 'editor',
    },
  });

  // A real (tiny) image so the upload pipeline + imageSizes actually run.
  const png = await sharp({
    create: { width: 1600, height: 900, channels: 3, background: { r: 216, g: 30, b: 47 } },
  })
    .png()
    .toBuffer();

  const banner = await payload.create({
    collection: 'media',
    data: { alt: 'Congregation gathered for Sunday service' },
    file: {
      data: png,
      mimetype: 'image/png',
      name: 'e2e-banner.png',
      size: png.byteLength,
    },
  });

  await payload.create({
    collection: 'announcements',
    data: {
      title: SEED.publishedTitle,
      slug: SEED.publishedSlug,
      date: new Date('2026-01-15').toISOString(),
      category: 'Announcement',
      body: lexicalParagraph(SEED.publishedBodyText) as any,
      pinned: true,
      banner: banner.id,
      bannerAlt: 'Congregation gathered for Sunday service',
      status: 'published',
    },
  });

  await payload.create({
    collection: 'announcements',
    data: {
      title: SEED.inReviewTitle,
      slug: SEED.inReviewSlug,
      date: new Date('2026-02-20').toISOString(),
      category: 'Update',
      body: lexicalParagraph(SEED.inReviewBodyText) as any,
      pinned: false,
      status: 'in_review',
    },
  });

  // Dated a year out so it stays "upcoming" regardless of when tests run.
  const future = new Date();
  future.setFullYear(future.getFullYear() + 1);
  await payload.create({
    collection: 'events',
    data: {
      name: SEED.eventName,
      slug: SEED.eventSlug,
      date: future.toISOString(),
      time: '15:00',
      venue: 'Quest Center, Santa Rosa',
      description: lexicalParagraph('Join us for a weekend together.') as any,
      registrationUrl: 'https://example.com/register',
      registrationOpen: true,
      status: 'published',
    },
  });

  await payload.create({
    collection: 'carousel-slides',
    data: {
      title: SEED.slideTitle,
      subtitle: 'Nine locations across Laguna',
      chip: 'This Sunday',
      theme: 'red',
      href: '/connect',
      order: 1,
      status: 'published',
    },
  });

  console.log('seed: ok');
  process.exit(0);
}

// Top-level await: the payload CLI runner exits as soon as the module body
// settles, so a bare main().catch() would end the process before any of the
// async seeding actually ran.
try {
  await main();
} catch (error) {
  console.error('seed failed:', error);
  process.exit(1);
}
