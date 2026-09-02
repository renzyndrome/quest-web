import type { Announcement, CarouselSlide } from './cms';
import type { ChurchEvent } from './events';
import type { Testimony } from './testimonies';
import type { ServiceSlug } from './site';

/*
  Fallback content so the site builds and renders without a running
  the CMS. Every fetch function falls back to these.
  Replace nothing here to "fix" content — real content lives in the CMS.

  Church facts (locations, gatherings, mission, ministries) are NOT here.
  They live in site.ts, which is real site copy rather than fallback data.
*/

export interface SermonEntry {
  /** Which weekly service. null when uncategorized (e.g. the channel RSS feed). */
  service: ServiceSlug | null;
  title: string;
  date: string;
  /** null until real per-video links are supplied — facade falls back to the uploads playlist */
  videoId: string | null;
}

// Placeholder archive. In production this comes from per-service YouTube
// playlists fetched at build time (see README roadmap).
export const sampleSermons: SermonEntry[] = [
  { service: 'family', title: 'Stronger in the Promise', date: '2026-07-05', videoId: null },
  { service: 'youngpro', title: 'Faith at Work', date: '2026-07-03', videoId: null },
  { service: 'dawn', title: 'Morning by Morning', date: '2026-07-04', videoId: null },
  { service: 'youth', title: 'Rooted', date: '2026-07-04', videoId: null },
  { service: 'family', title: 'One Family, One Mission', date: '2026-06-28', videoId: null },
  { service: 'youngpro', title: 'Rest Is Not a Reward', date: '2026-06-26', videoId: null },
] as const;

export const sampleSlides: CarouselSlide[] = [
  {
    id: 'sample-1',
    title: 'NEXTLEVEL Stronger 2026',
    subtitle: 'Our year-long journey of going deeper together.',
    chip: 'Campaign',
    theme: 'red',
    image: '/images/campaign-banner-800.jpg',
    href: '/news',
  },
  {
    id: 'sample-2',
    title: 'Quest Retreat',
    subtitle: 'Three days away with God and each other. Registration opens soon.',
    chip: 'March 2026',
    theme: 'dark',
    image: null,
    href: '/news',
  },
  {
    id: 'sample-3',
    title: 'Water Baptism',
    subtitle: 'Take your next step. Talk to your location pastor to join.',
    chip: 'Every quarter',
    theme: 'cream',
    image: null,
    href: '/connect',
  },
  {
    id: 'sample-4',
    title: 'Combined Worship Night',
    subtitle: 'Every location, one room, one voice.',
    chip: 'Save the date',
    theme: 'deep',
    image: null,
    href: '/news',
  },
];

export const sampleAnnouncements: Announcement[] = [
  {
    id: 'sample-a1',
    slug: 'nextlevel-stronger-kickoff',
    title: 'NEXTLEVEL Stronger kicks off this month',
    date: '2026-07-05',
    category: 'Campaign',
    body: '<p>Our new season starts with a combined worship service at our main location in Biñan. All locations are invited.</p><p>This year we go deeper together as one church family, one mission. Expect combined services, new discipleship classes, and stories from every location.</p><p>Ask your location pastor how your family can be part of it.</p>',
    pinned: true,
    banner: null,
  },
  {
    id: 'sample-a2',
    slug: 'elevate-bigger-hall',
    title: 'Elevate moves to a bigger hall',
    date: '2026-06-27',
    category: 'Update',
    body: '<p>Starting this Friday, Elevate gathers at the NXTGN Hall. Same time, 7:00 PM.</p><p>Bring a friend from work. Dinner is on us for first-timers.</p>',
    pinned: false,
    banner: null,
  },
  {
    id: 'sample-a3',
    slug: 'dawn-prayer-rally-resumes',
    title: 'Dawn Prayer Rally resumes at all locations',
    date: '2026-06-20',
    category: 'Announcement',
    body: '<p>Saturday 5:00 AM prayer and worship is back. Come as you are.</p>',
    pinned: false,
    banner: null,
  },
];

export const sampleEvents: ChurchEvent[] = [
  {
    id: 'sample-e1',
    slug: 'quest-retreat-2026',
    name: 'Quest Retreat 2026',
    date: '2026-08-14',
    time: '08:00',
    venue: 'Cavinti Retreat Center',
    description:
      '<p>Three days away with God and each other. Worship, teaching, good food, and time to breathe.</p><p>Open to all locations. Slots are limited, so register early. Talk to your location pastor if you need help with the registration fee. No one gets left behind over money.</p>',
    bannerUrl: null,
    registrationUrl: null,
    registrationOpen: true,
  },
  {
    id: 'sample-e2',
    slug: 'discipleship-101',
    name: 'Discipleship 101',
    date: '2026-07-26',
    time: '15:00',
    venue: 'NXTGN Hall',
    description:
      '<p>A four-week class for new believers and anyone who wants a refresher on the basics of following Jesus.</p><p>No prerequisites. Bring a Bible and a notebook.</p>',
    bannerUrl: null,
    registrationUrl: null,
    registrationOpen: true,
  },
  {
    id: 'sample-e3',
    slug: 'water-baptism-q3',
    name: 'Water Baptism',
    date: '2026-08-30',
    time: '10:00',
    venue: 'Quest Laguna Church, Biñan',
    description:
      '<p>Take your next step and go public with your faith. Family and friends are welcome to come and celebrate with you.</p><p>Talk to your location pastor to prepare.</p>',
    bannerUrl: null,
    registrationUrl: null,
    registrationOpen: false,
  },
];

/*
  Fictional placeholder stories, not real members — the privacy rule in
  .claude/rules/content.md keeps member details out of this repo entirely.

  All three carry no video on purpose. A fabricated YouTube id would render a
  dead thumbnail and a player that goes nowhere, so the offline build shows the
  written story alone. The video path is exercised against a real seeded link
  in the CMS integration suite instead.
*/
export const sampleTestimonies: Testimony[] = [
  {
    id: 'sample-t1',
    slug: 'found-a-family-in-binan',
    title: 'I came for the music and found a family',
    person: 'Rowena',
    date: '2026-07-12',
    body: '<p>I moved to Biñan for work and knew no one. A workmate invited me to a Friday gathering and I only said yes because I liked the worship.</p><p>I kept coming back for the people. They asked how my week went and remembered the answer. When my father got sick, three of them drove with me to the hospital at midnight.</p><p>I gave my life to Christ a year later. What changed me was not one sermon. It was watching a group of people live out what they sang about.</p>',
    video: null,
    banner: null,
    bannerCard: null,
  },
  {
    id: 'sample-t2',
    slug: 'starting-over-after-the-debt',
    title: 'Starting over after the debt',
    person: 'Jomar',
    date: '2026-06-18',
    body: '<p>I lost my business in 2023 and spent two years hiding from people I owed money to. I was angry at God and at myself.</p><p>A friend brought me to Dawn Prayer. I did not pray for months. I just sat there.</p><p>Slowly I started telling the truth about my situation. The men in my group helped me build a repayment plan and checked on me every week. I am not out of debt yet. But I am no longer hiding, and I sleep at night.</p>',
    video: null,
    banner: null,
    bannerCard: null,
  },
  {
    id: 'sample-t3',
    slug: 'the-question-i-was-afraid-to-ask',
    title: 'The question I was afraid to ask',
    person: 'Grace',
    date: '2026-05-30',
    body: '<p>I grew up in church but never believed any of it. I thought asking questions out loud would get me in trouble.</p><p>In Discipleship 101 I finally asked whether God was real. Nobody flinched. The leader said it was a fair question and spent the next four weeks working through it with me.</p><p>I still have questions. The difference is that I ask them now, and I ask them inside a church that is not afraid of them.</p>',
    video: null,
    banner: null,
    bannerCard: null,
  },
];
