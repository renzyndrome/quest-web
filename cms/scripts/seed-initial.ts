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
  // September 2026 event posters, from the church's Facebook page.
  ['event-2026-09-calendar.webp', 'September 2026 events calendar'],
  ['event-2026-09-foundational-class.webp', 'Foundational Class and General Assembly poster, September 6 at Moriah Hall'],
  ['event-2026-09-san-pedro-harvest.webp', 'Quest San Pedro Harvest poster, September 6 at Sining Residences'],
  ['event-2026-09-sod-enrollment.webp', 'School of Discipleship enrollment poster, September 13'],
  ['event-2026-09-dasmarinas-harvest.webp', 'Quest Dasmariñas Harvest poster, September 13'],
  ['event-2026-09-genzeal.webp', 'GenZeal youth service schedule for September'],
  ['event-2026-09-vision-keepers.webp', 'Vision Keepers Equipping Program graduation poster, September 20'],
  ['event-2026-09-elevate.webp', 'Elevate young professionals service schedule for September'],
  ['event-2026-09-godly-couples-night.webp', 'Godly Couples Night poster, September 27 at Molito Alabang'],
  ['event-2026-09-casile-harvest.webp', 'Quest Casile Harvest poster, September 27'],
  ['event-2026-09-prayer-and-fasting.webp', 'Prayer and Fasting poster, September 28 to 30'],
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
    body: lexicalDoc([
      'Discipleship 101 is where a new believer learns the foundations: who God is, what happened at the cross, and what it means to follow Him day to day.',
      'It runs in small groups so there is room to ask questions. Ask a leader after any service to be placed in the next batch.',
    ]) as any,
    status: 'published',
  });

  await ensureBySlug(payload, 'announcements', 'september-2026-events', {
    title: 'September 2026 events',
    slug: 'september-2026-events',
    date: new Date('2026-09-01').toISOString(),
    category: 'Event',
    pinned: true,
    banner: media['event-2026-09-calendar.webp'],
    body: lexicalDoc([
      'The September calendar for Quest Laguna: the launch of Next Level at the Foundational Class and General Assembly, Harvest gatherings at San Pedro, Dasmariñas and Casile, School of Discipleship enrollment, the Vision Keepers graduation, the Elevate second anniversary, Godly Couples Night, and three days of prayer and fasting to close the month.',
      'Each one has its own page under Events.',
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
    description: lexicalDoc([
      'A whole Saturday set apart, from 5 AM to 6 PM at Moriah Hall.',
      'The fee is 250 pesos and meals are included. Reserve with your leader so we can plan the food and seating.',
    ]) as any,
    registrationOpen: true,
    status: 'published',
  });

  /*
    September 2026, from the church's Facebook posters. Only what the poster
    says is recorded: where a poster gives no time or venue, the field stays
    empty rather than guessed. Weekly gatherings (Dawn Prayerworks, the regular
    Elevate and GenZeal services) are not events; they live on the site's
    gatherings list.
  */
  const septemberEvents = [
    {
      slug: 'foundational-class-general-assembly-2026-09',
      name: 'Foundational Class and General Assembly',
      date: '2026-09-06',
      venue: 'Moriah Hall',
      banner: 'event-2026-09-foundational-class.webp',
      description: ['Foundational Class and General Assembly, with the launching of Next Level.'],
    },
    {
      slug: 'quest-san-pedro-harvest-2026-09',
      name: 'Quest San Pedro Harvest',
      date: '2026-09-06',
      time: '17:00',
      venue: 'Sining Residences',
      banner: 'event-2026-09-san-pedro-harvest.webp',
      description: ['Harvest gathering of Quest San Pedro.'],
    },
    {
      slug: 'sod-enrollment-2026-09',
      name: 'School of Discipleship Enrollment',
      date: '2026-09-13',
      banner: 'event-2026-09-sod-enrollment.webp',
      description: ['Enrollment for the School of Discipleship.'],
    },
    {
      slug: 'quest-dasmarinas-harvest-2026-09',
      name: 'Quest Dasmariñas Harvest',
      date: '2026-09-13',
      time: '17:00',
      banner: 'event-2026-09-dasmarinas-harvest.webp',
      description: ['Harvest gathering of Quest Dasmariñas.'],
    },
    {
      slug: 'genzeal-prayerworks-2026-09',
      name: 'GenZeal Prayerworks',
      date: '2026-09-15',
      banner: 'event-2026-09-genzeal.webp',
      description: ['GenZeal Prayerworks for students and young people.'],
    },
    {
      slug: 'vision-keepers-graduation-2026-09',
      name: 'Vision Keepers Equipping Program: Last Topic and Graduation',
      date: '2026-09-20',
      banner: 'event-2026-09-vision-keepers.webp',
      description: ['The last topic and the graduation of the Vision Keepers Equipping Program.'],
    },
    {
      slug: 'elevate-2nd-anniversary-2026-09',
      name: 'Elevate 2nd Anniversary Celebration',
      date: '2026-09-25',
      banner: 'event-2026-09-elevate.webp',
      description: ['Elevate, the young professionals gathering, marks its second anniversary.'],
    },
    {
      slug: 'godly-couples-night-2026-09',
      name: 'Godly Couples Night',
      date: '2026-09-27',
      venue: 'Molito Alabang',
      banner: 'event-2026-09-godly-couples-night.webp',
      description: ['An evening for couples at Molito Alabang.'],
    },
    {
      slug: 'quest-casile-harvest-2026-09',
      name: 'Quest Casile Harvest',
      date: '2026-09-27',
      time: '15:00',
      banner: 'event-2026-09-casile-harvest.webp',
      description: ['Harvest gathering of Quest Casile.'],
    },
    {
      slug: 'prayer-and-fasting-2026-09',
      name: 'Prayer and Fasting',
      date: '2026-09-28',
      time: '20:00',
      banner: 'event-2026-09-prayer-and-fasting.webp',
      description: [
        'Three days of prayer and fasting. September 28 and 29 are online through Google Meet at 8 PM. September 30 is at NXTGN Hall at 7 PM.',
      ],
    },
  ] as const;
  for (const event of septemberEvents) {
    await ensureBySlug(payload, 'events', event.slug, {
      name: event.name,
      slug: event.slug,
      date: new Date(event.date).toISOString(),
      ...('time' in event ? { time: event.time } : {}),
      ...('venue' in event ? { venue: event.venue } : {}),
      banner: media[event.banner],
      description: lexicalDoc([...event.description]) as any,
      registrationOpen: false,
      status: 'published',
    });
  }

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
