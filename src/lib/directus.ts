/*
  Read-only Directus client for marketing content.
  Every getter degrades gracefully to sample content so the site
  always builds — with or without a running CMS.
*/

export interface Announcement {
  id: string;
  title: string;
  date: string;
  category: string;
  body: string;
  pinned: boolean;
  banner: string | null;
}

export interface CarouselSlide {
  id: string;
  title: string;
  subtitle?: string;
  chip?: string;
  theme: 'red' | 'dark' | 'cream' | 'deep';
  image?: string | null;
  href?: string;
}

const DIRECTUS_URL: string | undefined = import.meta.env.DIRECTUS_URL;
const DIRECTUS_TOKEN: string | undefined = import.meta.env.DIRECTUS_TOKEN;

async function directusFetch<T>(path: string): Promise<T | null> {
  if (!DIRECTUS_URL) return null;
  try {
    const res = await fetch(`${DIRECTUS_URL}${path}`, {
      headers: DIRECTUS_TOKEN
        ? { Authorization: `Bearer ${DIRECTUS_TOKEN}` }
        : undefined,
    });
    if (!res.ok) {
      console.warn(`[directus] ${path} responded ${res.status}; using sample content`);
      return null;
    }
    const json = (await res.json()) as { data: T };
    return json.data;
  } catch (error) {
    console.warn(`[directus] fetch failed for ${path}; using sample content`, error);
    return null;
  }
}

/** Directus file id → public asset URL (optionally with transform params). */
export function assetUrl(fileId: string | null | undefined, params = ''): string | null {
  if (!fileId || !DIRECTUS_URL) return null;
  return `${DIRECTUS_URL}/assets/${fileId}${params ? `?${params}` : ''}`;
}

export async function getAnnouncements(): Promise<Announcement[]> {
  const { sampleAnnouncements } = await import('./sample-content');
  const data = await directusFetch<Announcement[]>(
    '/items/announcements?filter[status][_eq]=published&sort=-pinned,-date&limit=20',
  );
  return data ?? sampleAnnouncements;
}

export async function getCarouselSlides(): Promise<CarouselSlide[]> {
  const { sampleSlides } = await import('./sample-content');
  type Raw = Omit<CarouselSlide, 'image'> & { image: string | null };
  const data = await directusFetch<Raw[]>(
    '/items/carousel_slides?filter[status][_eq]=published&sort=sort&limit=8',
  );
  if (!data || data.length === 0) return sampleSlides;
  return data.map((slide) => ({
    ...slide,
    image: assetUrl(slide.image, 'width=1200&format=webp&quality=80'),
  }));
}
