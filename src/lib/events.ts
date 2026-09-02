/*
  Events — marketing-owned content in the Payload `events` collection.
  Decision 2026-07-08: the tierra app is the membership directory ONLY
  (its event management is being decommissioned). Events shown on the
  site are created by marketing in the CMS; the registration link is a
  plain URL field (Google Form, FB event, whatever the team uses).

  Note: "upcoming" is evaluated at build time. Publishing/updating an
  event triggers a rebuild via the CMS deploy hook, and a scheduled daily
  rebuild keeps date filtering honest as events pass.
*/
import { cmsFetch, mediaUrl, mediaAlt, type RawMedia, type AnnouncementStatus } from './cms';

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
  bannerAlt?: string;
  registrationUrl?: string | null;
  registrationOpen?: boolean;
  /** Editorial state — only 'published' reaches the live site. */
  status?: AnnouncementStatus;
}

interface RawEvent {
  id: string | number;
  slug: string;
  name: string;
  date: string;
  time?: string | null;
  venue?: string | null;
  descriptionHtml?: string | null;
  banner?: RawMedia | string | null;
  registrationUrl?: string | null;
  registrationOpen?: boolean | null;
  status?: AnnouncementStatus;
}

const mapEvent = (event: RawEvent): ChurchEvent => ({
  id: String(event.id),
  slug: event.slug,
  name: event.name,
  date: event.date,
  time: event.time ?? undefined,
  venue: event.venue ?? undefined,
  description: event.descriptionHtml ?? undefined,
  bannerUrl: mediaUrl(event.banner, 'card'),
  bannerAlt: mediaAlt(event.banner),
  registrationUrl: event.registrationUrl ?? null,
  registrationOpen: event.registrationOpen ?? false,
  status: event.status,
});

export async function getUpcomingEvents(): Promise<ChurchEvent[]> {
  const { sampleEvents } = await import('./sample-content');
  const today = new Date().toISOString().slice(0, 10);
  const data = await cmsFetch<RawEvent[]>(
    `/api/events?where[status][equals]=published&where[date][greater_than_equal]=${today}&sort=date&limit=12&depth=1`,
  );
  // null = CMS unset/unreachable → sample content. An empty array from a
  // live CMS is a legitimate "no upcoming events" state.
  if (data === null) return sampleEvents;
  return data.map(mapEvent);
}

/**
 * Fetch a single event by slug.
 *
 * `preview: true` drops the `status = published` filter so unpublished drafts
 * resolve — this backs the on-demand preview route reached from the CMS
 * "Preview" button. It also drops the upcoming-date filter, so an approver can
 * still preview an event whose date has already passed. Preview reads live
 * from the CMS only: no sample fallback, so a missing slug returns null.
 *
 * Reading drafts requires an authenticated request, i.e. CMS_TOKEN must be set.
 */
export async function getEventBySlug(
  slug: string,
  { preview = false }: { preview?: boolean } = {},
): Promise<ChurchEvent | null> {
  const encoded = encodeURIComponent(slug);
  const statusFilter = preview ? '' : '&where[status][equals]=published';
  const data = await cmsFetch<RawEvent[]>(
    `/api/events?where[slug][equals]=${encoded}${statusFilter}&limit=1&depth=1`,
  );
  if (!data || data.length === 0) return null;
  return mapEvent(data[0]);
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
