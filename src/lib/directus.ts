/*
  Read-only Directus client for marketing content.
  Every getter degrades gracefully to sample content so the site
  always builds — with or without a running CMS.
*/

export interface Announcement {
  id: string;
  slug: string;
  title: string;
  date: string;
  category: string;
  /** Rich text HTML from Directus (limited toolbar). Sample content uses plain <p> tags. */
  body: string;
  pinned: boolean;
  banner: string | null;
  /** Alt text for the banner (banner_alt field in Directus). */
  bannerAlt?: string;
  /**
   * Editorial state: 'draft' | 'in_review' | 'published'. Only 'published'
   * ever reaches the live site (fetchers filter on it); the other states are
   * visible only through the draft-preview route. See .claude/rules/content.md
   * for the editor → admin approval workflow.
   */
  status?: AnnouncementStatus;
}

export type AnnouncementStatus = 'draft' | 'in_review' | 'published';

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

export async function directusFetch<T>(path: string): Promise<T | null> {
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

const HTML_ENTITIES: Record<string, string> = {
  '&amp;': '&',
  '&nbsp;': ' ',
  '&quot;': '"',
  '&#39;': "'",
  '&apos;': "'",
  '&lsquo;': '‘',
  '&rsquo;': '’',
  '&ldquo;': '“',
  '&rdquo;': '”',
  '&lt;': '<',
  '&gt;': '>',
};

/** Plain-text preview of a rich-text body, for list rows and cards. */
export function excerpt(html: string, max = 160): string {
  const text = html
    .replace(/<[^>]+>/g, ' ')
    // Decode numeric (decimal + hex) refs, then the common named entities.
    .replace(/&#(\d+);|&#x([0-9a-f]+);|&[a-z]+;/gi, (match, dec, hex) => {
      if (dec != null) return String.fromCodePoint(Number(dec));
      if (hex != null) return String.fromCodePoint(parseInt(hex, 16));
      return HTML_ENTITIES[match.toLowerCase()] ?? match;
    })
    .replace(/\s+/g, ' ')
    .trim();
  return text.length > max ? `${text.slice(0, max).trimEnd()}…` : text;
}

/** Directus file id → public asset URL (optionally with transform params). */
export function assetUrl(fileId: string | null | undefined, params = ''): string | null {
  if (!fileId || !DIRECTUS_URL) return null;
  return `${DIRECTUS_URL}/assets/${fileId}${params ? `?${params}` : ''}`;
}

export async function getAnnouncements(): Promise<Announcement[]> {
  const { sampleAnnouncements } = await import('./sample-content');
  const data = await directusFetch<RawAnnouncement[]>(
    '/items/announcements?filter[status][_eq]=published&sort=-pinned,-date&limit=20',
  );
  if (data === null) return sampleAnnouncements;
  return data.map(mapAnnouncement);
}

type RawAnnouncement = Omit<Announcement, 'bannerAlt'> & { banner_alt?: string | null };

const mapAnnouncement = ({ banner_alt, ...rest }: RawAnnouncement): Announcement => ({
  ...rest,
  bannerAlt: banner_alt ?? undefined,
});

/**
 * Fetch a single announcement by slug.
 *
 * `preview: true` drops the `status = published` filter so unpublished drafts
 * resolve — this backs the on-demand preview route (src/pages/news/preview/
 * [slug].astro) editors use before flipping an item to published. Preview
 * reads live from Directus only: there is no sample fallback (sample content
 * has no drafts), so a missing slug or unreachable CMS returns null.
 *
 * Reading drafts requires the DIRECTUS_TOKEN role to have read access to
 * non-published items in the announcements collection.
 */
export async function getAnnouncementBySlug(
  slug: string,
  { preview = false }: { preview?: boolean } = {},
): Promise<Announcement | null> {
  // Filter on slug via Directus; equality only, no interpolation of the raw
  // value into a filter operator. Encode to keep the query well-formed.
  const encoded = encodeURIComponent(slug);
  const statusFilter = preview ? '' : '&filter[status][_eq]=published';
  const data = await directusFetch<RawAnnouncement[]>(
    `/items/announcements?filter[slug][_eq]=${encoded}${statusFilter}&limit=1`,
  );
  if (!data || data.length === 0) return null;
  return mapAnnouncement(data[0]);
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
