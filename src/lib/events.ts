/*
  Events — marketing-owned content in the Directus `events` collection.
  Decision 2026-07-08: the tierra app is the membership directory ONLY
  (its event management is being decommissioned). Events shown on the
  site are created by marketing in Directus; the registration link is a
  plain URL field (Google Form, FB event, whatever the team uses).

  Note: "upcoming" is evaluated at build time. Publishing/updating an
  event triggers a rebuild via the Directus Flow, and a scheduled daily
  rebuild keeps date filtering honest as events pass.
*/
import { assetUrl, directusFetch } from './directus';

export interface ChurchEvent {
  id: string;
  slug: string;
  name: string;
  date: string;
  time?: string;
  venue?: string;
  /** Rich text HTML (limited toolbar) shown on the event detail page. */
  description?: string;
  bannerUrl?: string | null;
  registrationUrl?: string | null;
  registrationOpen?: boolean;
}

interface RawEvent {
  id: string;
  slug: string;
  name: string;
  date: string;
  time: string | null;
  venue: string | null;
  description: string | null;
  banner: string | null;
  registration_url: string | null;
  registration_open: boolean | null;
}

export async function getUpcomingEvents(): Promise<ChurchEvent[]> {
  const { sampleEvents } = await import('./sample-content');
  const today = new Date().toISOString().slice(0, 10);
  const data = await directusFetch<RawEvent[]>(
    `/items/events?filter[status][_eq]=published&filter[date][_gte]=${today}&sort=date&limit=12`,
  );
  // null = CMS unset/unreachable → sample content. An empty array from a
  // live CMS is a legitimate "no upcoming events" state.
  if (data === null) return sampleEvents;
  return data.map((event) => ({
    id: event.id,
    slug: event.slug,
    name: event.name,
    date: event.date,
    time: event.time ?? undefined,
    venue: event.venue ?? undefined,
    description: event.description ?? undefined,
    bannerUrl: assetUrl(event.banner, 'width=800&format=webp&quality=80'),
    registrationUrl: event.registration_url,
    registrationOpen: event.registration_open ?? false,
  }));
}

export function formatEventDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-PH', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });
}

/** '15:00' → '3:00 PM' */
export function formatEventTime(time?: string): string | null {
  if (!time) return null;
  const [hours, minutes] = time.split(':').map(Number);
  if (Number.isNaN(hours)) return null;
  const suffix = hours >= 12 ? 'PM' : 'AM';
  const hour12 = hours % 12 || 12;
  return `${hour12}:${String(minutes || 0).padStart(2, '0')} ${suffix}`;
}
