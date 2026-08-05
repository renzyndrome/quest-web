/*
  Read-only Payload CMS client for marketing content.
  Every getter degrades gracefully to sample content so the site
  always builds — with or without a running CMS.

  Rich text: Payload stores Lexical JSON, but the CMS converts it server-side
  and serves `bodyHtml` / `descriptionHtml` strings (see cms/src/fields/
  richTextHtml.ts). The site therefore keeps rendering plain HTML with
  `set:html` and needs no Lexical dependency.
*/

export interface Announcement {
  id: string;
  slug: string;
  title: string;
  date: string;
  category: string;
  /** Rich text HTML from the CMS (limited toolbar). Sample content uses plain <p> tags. */
  body: string;
  pinned: boolean;
  /** Fully-resolved image URL (banner preset), or null. */
  banner: string | null;
  /** Alt text for the banner. */
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

const CMS_URL: string | undefined = import.meta.env.CMS_URL;
const CMS_TOKEN: string | undefined = import.meta.env.CMS_TOKEN;

/** A populated Payload upload document (depth=1). */
export interface RawMedia {
  url?: string | null;
  sizes?: Record<string, { url?: string | null } | undefined>;
}

/**
 * Fetches a Payload REST collection. Returns null when the CMS is unset or
 * unreachable so every caller can fall back to sample content — the site must
 * build without a running CMS.
 */
export async function cmsFetch<T>(path: string): Promise<T | null> {
  if (!CMS_URL) return null;
  try {
    const res = await fetch(`${CMS_URL}${path}`, {
      headers: CMS_TOKEN
        ? // Payload's API-key scheme is `<users-collection-slug> API-Key <key>`.
          { Authorization: `users API-Key ${CMS_TOKEN}` }
        : undefined,
    });
    if (!res.ok) {
      console.warn(`[cms] ${path} responded ${res.status}; using sample content`);
      return null;
    }
    const json = (await res.json()) as { docs: T };
    return json.docs;
  } catch (error) {
    console.warn(`[cms] fetch failed for ${path}; using sample content`, error);
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

/**
 * Resolves a populated media doc to a URL for the given size preset, falling
 * back to the original file. Payload returns absolute URLs when serverURL is
 * configured; relative ones are prefixed defensively.
 */
export function mediaUrl(
  media: RawMedia | string | null | undefined,
  size: 'banner' | 'card',
): string | null {
  // depth=0 or an unpopulated relation yields a bare id — nothing to render.
  if (!media || typeof media === 'string') return null;
  const url = media.sizes?.[size]?.url ?? media.url;
  if (!url) return null;
  if (/^https?:\/\//i.test(url)) return url;
  return CMS_URL ? `${CMS_URL}${url}` : url;
}

interface RawAnnouncement {
  id: string | number;
  slug: string;
  title: string;
  date: string;
  category: string;
  bodyHtml?: string | null;
  pinned?: boolean | null;
  banner?: RawMedia | string | null;
  bannerAlt?: string | null;
  status?: AnnouncementStatus;
}

const mapAnnouncement = (raw: RawAnnouncement): Announcement => ({
  id: String(raw.id),
  slug: raw.slug,
  title: raw.title,
  date: raw.date,
  category: raw.category,
  body: raw.bodyHtml ?? '',
  pinned: Boolean(raw.pinned),
  banner: mediaUrl(raw.banner, 'banner'),
  bannerAlt: raw.bannerAlt ?? undefined,
  status: raw.status,
});

export async function getAnnouncements(): Promise<Announcement[]> {
  const { sampleAnnouncements } = await import('./sample-content');
  const data = await cmsFetch<RawAnnouncement[]>(
    '/api/announcements?where[status][equals]=published&sort=-pinned,-date&limit=20&depth=1',
  );
  if (data === null) return sampleAnnouncements;
  return data.map(mapAnnouncement);
}

/**
 * Fetch a single announcement by slug.
 *
 * `preview: true` drops the `status = published` filter so unpublished drafts
 * resolve — this backs the on-demand preview route (src/pages/news/preview/
 * [slug].astro) editors use before flipping an item to published. Preview
 * reads live from the CMS only: there is no sample fallback (sample content
 * has no drafts), so a missing slug or unreachable CMS returns null.
 *
 * Reading drafts requires an authenticated request, i.e. CMS_TOKEN must be set.
 */
export async function getAnnouncementBySlug(
  slug: string,
  { preview = false }: { preview?: boolean } = {},
): Promise<Announcement | null> {
  const encoded = encodeURIComponent(slug);
  const statusFilter = preview ? '' : '&where[status][equals]=published';
  const data = await cmsFetch<RawAnnouncement[]>(
    `/api/announcements?where[slug][equals]=${encoded}${statusFilter}&limit=1&depth=1`,
  );
  if (!data || data.length === 0) return null;
  return mapAnnouncement(data[0]);
}

interface RawSlide {
  id: string | number;
  title: string;
  subtitle?: string | null;
  chip?: string | null;
  theme: CarouselSlide['theme'];
  image?: RawMedia | string | null;
  href?: string | null;
}

export async function getCarouselSlides(): Promise<CarouselSlide[]> {
  const { sampleSlides } = await import('./sample-content');
  const data = await cmsFetch<RawSlide[]>(
    '/api/carousel-slides?where[status][equals]=published&sort=order&limit=8&depth=1',
  );
  if (!data || data.length === 0) return sampleSlides;
  return data.map((slide) => ({
    id: String(slide.id),
    title: slide.title,
    subtitle: slide.subtitle ?? undefined,
    chip: slide.chip ?? undefined,
    theme: slide.theme,
    image: mediaUrl(slide.image, 'banner'),
    href: slide.href ?? undefined,
  }));
}
