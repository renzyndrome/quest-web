/*
  Seeds the CMS with the church's real starting content: the photo library
  from the admin's asset drop, plus the announcements, events and carousel
  slides that use it.

  Safe to run on every boot (see docker-entrypoint.sh). It is ADDITIVE ONLY:
  anything that already exists — matched by upload filename or by slug — is
  left completely untouched, so editors' later changes are never overwritten
  and deleted items do not silently come back... except that a deleted item
  WILL be recreated, so treat this as "ensure the starting set exists" rather
  than a sync. Editors who want an item gone should unpublish it.

  Usage:
    cd cms && npx payload run scripts/seed-initial.ts
    # or set SEED_ON_BOOT=true on the container
*/
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { getPayload } from 'payload';
import config from '../payload.config';
import { lexicalDoc } from '../src/lib/lexical';

const dirname = path.dirname(fileURLToPath(import.meta.url));
const ASSETS = path.resolve(dirname, '../seed/assets');

/** filename in cms/seed/assets → alt text (required on every image). */
const MEDIA: ReadonlyArray<readonly [string, string]> = [
  ['quest-laguna-logo.webp', 'Quest Laguna logo'],
  ['nextlevel-logo.webp', 'NextLevel Stronger 2026 wordmark'],
  ['nextlevel-cover.webp', 'NextLevel Stronger 2026 campaign banner'],
  ['isang-dekada-1.webp', 'Timeline of Quest Laguna from 2017 to 2021'],
  ['isang-dekada-2.webp', 'Timeline of Quest Laguna from 2022 to 2026'],
  ['worship.webp', 'Congregation with hands raised during Sunday worship'],
  ['community.webp', 'Members sharing a meal together after service'],
  ['growth.webp', 'Small group gathered for teaching at the Quest Laguna hall'],
  ['praying.webp', 'Members gathered around one another in prayer'],
  ['baptism.webp', 'Families gathered around the baptism pool at Quest Laguna'],
  ['quest-retreat.webp', 'Quest Retreat poster for August 29'],
  ['pre-quest-retreat.webp', 'Pre Quest Retreat poster for August 8'],
  ['discipleship-101.webp', 'Discipleship 101 group photo'],
  ['giving-qr.webp', 'Tithes and offering QR codes for BDO and GCash'],
  ['ministry-admin.webp', 'Admin Ministry team'],
  ['ministry-genzeal.webp', 'GenZeal youth ministry team'],
  ['ministry-media.webp', 'Media Ministry team'],
  ['ministry-dance.webp', 'Dance Ministry team'],
  ['ministry-bts.webp', 'BTS (behind the scenes) Ministry team'],
  ['ministry-kids.webp', 'Kids Ministry team'],
  ['ministry-ushering.webp', 'Ushering Ministry team'],
  ['ministry-praise-worship.webp', 'Praise and Worship Ministry team'],
  ['ministry-pastoral.webp', 'Pastoral Ministry team'],
];

/*
  Media ids keyed by filename. Both adapters we use (postgres in production,
  sqlite in tests) issue numeric ids, which is what the upload relation fields
  expect — hence number rather than a looser string | number.
*/
type MediaIds = Record<string, number>;

async function seedMedia(payload: any): Promise<MediaIds> {
  const ids: MediaIds = {};
  for (const [filename, alt] of MEDIA) {
    const filePath = path.join(ASSETS, filename);
    if (!existsSync(filePath)) {
      console.warn(`  skip (asset missing): ${filename}`);
      continue;
    }
    const existing = await payload.find({
      collection: 'media',
      where: { filename: { equals: filename } },
      limit: 1,
    });
    if (existing.docs.length > 0) {
      ids[filename] = existing.docs[0].id;
      continue;
    }
    const created = await payload.create({
      collection: 'media',
      data: { alt },
      filePath,
    });
    ids[filename] = created.id;
    console.log(`  + media ${filename}`);
  }
  return ids;
}

/** Creates a doc only when its slug is absent, so edits are never clobbered. */
async function ensureBySlug(payload: any, collection: string, slug: string, data: any) {
  const existing = await payload.find({
    collection,
    where: { slug: { equals: slug } },
    limit: 1,
  });
  if (existing.docs.length > 0) return false;
  await payload.create({ collection, data });
  console.log(`  + ${collection}/${slug}`);
  return true;
}

/*
  Optional admin account, for local development and first-boot convenience.

  Deliberately has NO default credentials: it only runs when both env vars are
  set, so a production deploy that does not set them gets the normal Payload
  onboarding screen instead of a guessable account. Existing users are never
  modified, so this cannot reset a real password.
*/
async function seedAdmin(payload: any): Promise<void> {
  const email = process.env.SEED_ADMIN_EMAIL;
  const password = process.env.SEED_ADMIN_PASSWORD;
  if (!email || !password) {
    console.log('Skipping admin seed (set SEED_ADMIN_EMAIL + SEED_ADMIN_PASSWORD to enable).');
    return;
  }
  const existing = await payload.find({
    collection: 'users',
    where: { email: { equals: email } },
    limit: 1,
  });
  if (existing.docs.length > 0) {
    console.log(`  admin ${email} already exists, leaving it alone`);
    return;
  }
  await payload.create({
    collection: 'users',
    data: { email, password, name: 'Administrator', role: 'admin' },
  });
  console.log(`  + admin ${email}`);
}

async function main(): Promise<void> {
  const payload = await getPayload({ config });

  console.log('\nSeeding admin…');
  await seedAdmin(payload);

  console.log('Seeding media…');
  const media = await seedMedia(payload);

  console.log('Seeding announcements…');
  await ensureBySlug(payload, 'announcements', 'isang-dekada-ng-katapatan', {
    title: 'Isang dekada ng katapatan',
    slug: 'isang-dekada-ng-katapatan',
    date: new Date('2026-07-21').toISOString(),
    category: 'Campaign',
    pinned: true,
    banner: media['isang-dekada-1.webp'],
    bannerAlt: 'Timeline of Quest Laguna from 2017 to 2021',
    body: lexicalDoc([
      'Sampung taon. Isang dekada ng katapatan ng Panginoon sa Quest Laguna.',
      'From Breakthrough in 2017, to All-Out, SISID, Laban and Unshakable, every season carried its own weight and its own grace. The church was planted, tested through the pandemic, and kept standing because the foundation was the Lord.',
      'The years since have been Empowered, Unstoppable and Revival. We look back not to celebrate ourselves, but to remember who carried us.',
    ]) as any,
    status: 'published',
  });

  await ensureBySlug(payload, 'announcements', 'nextlevel-stronger-2026', {
    title: 'NextLevel: Stronger 2026',
    slug: 'nextlevel-stronger-2026',
    date: new Date('2026-07-21').toISOString(),
    category: 'Campaign',
    pinned: false,
    banner: media['nextlevel-cover.webp'],
    bannerAlt: 'NextLevel Stronger 2026 campaign banner',
    body: lexicalDoc([
      'Stronger is our word for 2026. Not louder, not bigger. Stronger.',
      'Stronger in the Word, stronger in prayer, and stronger together as one church across our locations in Laguna. Watch this space for the gatherings and teaching series that carry the theme through the year.',
    ]) as any,
    status: 'published',
  });

  await ensureBySlug(payload, 'announcements', 'water-baptism-no-turning-back', {
    title: 'Water baptism: no turning back',
    slug: 'water-baptism-no-turning-back',
    date: new Date('2026-07-14').toISOString(),
    category: 'Announcement',
    pinned: false,
    banner: media['baptism.webp'],
    bannerAlt: 'Families gathered around the baptism pool at Quest Laguna',
    body: lexicalDoc([
      'Another group took the step of obedience and went into the water.',
      'If you have decided to follow Jesus and have not been baptised yet, talk to any of our pastors or leaders. We will walk you through what it means and when the next schedule opens.',
    ]) as any,
    status: 'published',
  });

  await ensureBySlug(payload, 'announcements', 'discipleship-101', {
    title: 'Discipleship 101 is open',
    slug: 'discipleship-101',
    date: new Date('2026-07-10').toISOString(),
    category: 'Update',
    pinned: false,
    banner: media['discipleship-101.webp'],
    bannerAlt: 'Discipleship 101 group photo',
    body: lexicalDoc([
      'Discipleship 101 is where a new believer learns the foundations: who God is, what happened at the cross, and what it means to follow Him day to day.',
      'It runs in small groups so there is room to ask questions. Ask a leader after any service to be placed in the next batch.',
    ]) as any,
    status: 'published',
  });

  console.log('Seeding events…');
  await ensureBySlug(payload, 'events', 'pre-quest-retreat-2026', {
    name: 'Pre Quest Retreat',
    slug: 'pre-quest-retreat-2026',
    date: new Date('2026-08-08').toISOString(),
    time: '15:00',
    venue: 'Quest Laguna Moriah Hall',
    banner: media['pre-quest-retreat.webp'],
    bannerAlt: 'Pre Quest Retreat poster for August 8',
    description: lexicalDoc([
      'A time of preparation before the main retreat. Come and set your heart for what God wants to do.',
    ]) as any,
    registrationOpen: false,
    status: 'published',
  });

  await ensureBySlug(payload, 'events', 'quest-retreat-2026', {
    name: 'Quest Retreat',
    slug: 'quest-retreat-2026',
    date: new Date('2026-08-29').toISOString(),
    time: '05:00',
    venue: 'Quest Laguna Moriah Hall',
    banner: media['quest-retreat.webp'],
    bannerAlt: 'Quest Retreat poster for August 29',
    description: lexicalDoc([
      'A whole Saturday set apart, from 5 AM to 6 PM at Moriah Hall.',
      'The fee is 250 pesos and meals are included. Reserve with your leader so we can plan the food and seating.',
    ]) as any,
    registrationOpen: true,
    status: 'published',
  });

  console.log('Seeding carousel slides…');
  // `as const` so `theme` narrows to the collection's literal union rather
  // than widening to string (which fails Payload's generated types).
  const slides = [
    {
      title: 'NextLevel: Stronger 2026',
      subtitle: 'Our word for the year',
      chip: 'Campaign',
      theme: 'red',
      image: media['nextlevel-cover.webp'],
      href: '/news/nextlevel-stronger-2026',
      order: 1,
    },
    {
      title: 'Quest Retreat',
      subtitle: 'August 29 at Moriah Hall',
      chip: 'This month',
      theme: 'deep',
      image: media['quest-retreat.webp'],
      href: '/events/quest-retreat-2026',
      order: 2,
    },
    {
      title: 'Isang dekada ng katapatan',
      subtitle: 'Ten years of His faithfulness',
      chip: 'Our story',
      theme: 'dark',
      image: media['worship.webp'],
      href: '/news/isang-dekada-ng-katapatan',
      order: 3,
    },
  ] as const;
  for (const slide of slides) {
    const existing = await payload.find({
      collection: 'carousel-slides',
      where: { title: { equals: slide.title } },
      limit: 1,
    });
    if (existing.docs.length > 0) continue;
    await payload.create({
      collection: 'carousel-slides',
      data: { ...slide, status: 'published' },
    });
    console.log(`  + slide ${slide.title}`);
  }

  console.log('\nseed:initial done\n');
}

try {
  await main();
  process.exit(0);
} catch (error) {
  console.error('seed:initial failed:', error);
  process.exit(1);
}
