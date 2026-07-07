/*
  Read-only feed from the church directory app (TanStack Start + Supabase).
  That app is the system of record for events, registrations, and members.
  quest-web only displays events and links out to registration — never writes.
*/

export interface ChurchEvent {
  id: string;
  name: string;
  date: string;
  time?: string;
  venue?: string;
  bannerUrl?: string | null;
  registrationUrl?: string | null;
  registrationOpen?: boolean;
}

const EVENTS_API_URL: string | undefined = import.meta.env.EVENTS_API_URL;

export async function getUpcomingEvents(): Promise<ChurchEvent[]> {
  const { sampleEvents } = await import('./sample-content');
  if (!EVENTS_API_URL) return sampleEvents;
  try {
    const res = await fetch(EVENTS_API_URL);
    if (!res.ok) {
      console.warn(`[events] feed responded ${res.status}; using sample events`);
      return sampleEvents;
    }
    const events = (await res.json()) as ChurchEvent[];
    return events.length > 0 ? events : sampleEvents;
  } catch (error) {
    console.warn('[events] feed unreachable; using sample events', error);
    return sampleEvents;
  }
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
