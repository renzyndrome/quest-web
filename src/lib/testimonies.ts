/*
  Life Testimonies — stories from the congregation, in the Payload
  `life-testimonies` collection. Rendered at /testimonies and
  /testimonies/[slug].

  Same contract as the announcements fetchers in ./cms: read-only,
  published-only on the public routes, and a sample-content fallback so the
  site builds with no CMS running. Rich text arrives as `bodyHtml`, already
  converted server-side — the site never parses Lexical JSON.

  The one addition is the optional video. The CMS stores whatever the editor
  pasted or uploaded; deciding what that actually is (YouTube, Facebook, a
  file) happens here, so components receive something renderable.
*/
import { cmsFetch, mediaUrl, mediaAlt, type RawMedia, type AnnouncementStatus } from './cms';
import { youtubeIdFromUrl, facebookEmbedSrc, type TestimonyVideo } from './video';

export interface Testimony {
  id: string;
  slug: string;
  title: string;
  /** Whose story it is. Blank when they asked to stay anonymous. */
  person?: string;
  date: string;
  /** Rich text HTML from the CMS. Sample content uses plain <p> tags. */
  body: string;
  /** Null when there is no video, or when the pasted link was unusable. */
  video: TestimonyVideo | null;
  /** Fully-resolved image URL (banner preset, 1200w) for the detail page. */
  banner: string | null;
  /** The same image at the card preset (800w) — listing thumbnails use this. */
  bannerCard: string | null;
  bannerAlt?: string;
  /** Editorial state — only 'published' reaches the live site. */
  status?: AnnouncementStatus;
}

/** A populated `videos` upload doc. No size presets, so `url` is the file. */
interface RawVideoFile extends RawMedia {
  mimeType?: string | null;
}

interface RawTestimonyVideo {
  url?: string | null;
  file?: RawVideoFile | string | null;
  poster?: RawMedia | string | null;
}

interface RawTestimony {
  id: string | number;
  slug: string;
  title: string;
  person?: string | null;
  date: string;
  bodyHtml?: string | null;
  video?: RawTestimonyVideo | null;
  banner?: RawMedia | string | null;
  status?: AnnouncementStatus;
}

/**
 * Normalises the CMS video group into a renderable shape.
 *
 * The CMS asks the editor for a link, not a category — so working out whether
 * that link is YouTube or Facebook happens here. An uploaded file is the
 * fallback when neither applies.
 *
 * Returns null whenever nothing can be shown: no link and no file, or a link
 * the parsers did not recognise. A broken link degrades to "no video" rather
 * than an empty player, and the written story still carries the page.
 */
function mapVideo(raw: RawTestimonyVideo | null | undefined, title: string): TestimonyVideo | null {
  const url = typeof raw?.url === 'string' ? raw.url.trim() : '';
  const hasFile = Boolean(raw?.file);
  if (!raw || (!url && !hasFile)) return null;

  // The player renders full-width on the detail page, so the poster wants the
  // banner preset (1200w), not the card one.
  const poster = mediaUrl(raw.poster, 'banner');

  /*
    Something was entered but nothing usable came out of it. The page degrades
    to "no video", which is right, but silence would leave an editor staring
    at a saved link that never appears. This lands in the build log.
  */
  const dropped = (reason: string): null => {
    console.warn(`[testimonies] "${title}": ${reason}; rendering without a video`);
    return null;
  };

  if (url) {
    const youtubeId = youtubeIdFromUrl(url);
    if (youtubeId) {
      // YouTube serves its own thumbnail, so poster staying null is fine.
      return { kind: 'youtube', youtubeId, poster, title };
    }
    const embedSrc = facebookEmbedSrc(url);
    if (embedSrc) return { kind: 'facebook', embedSrc, poster, title };
    return dropped(`"${url}" is not a YouTube or Facebook video link`);
  }

  // Self-hosted upload. `videos` defines no image presets, so mediaUrl falls
  // through to the original file URL — which is what a <video> needs anyway.
  const fileUrl = mediaUrl(raw.file, 'card');
  if (!fileUrl) return dropped('the uploaded video file is missing');
  const mimeType =
    raw.file && typeof raw.file === 'object' ? (raw.file.mimeType ?? undefined) : undefined;
  return { kind: 'file', fileUrl, mimeType, poster, title };
}

const mapTestimony = (raw: RawTestimony): Testimony => ({
  id: String(raw.id),
  slug: raw.slug,
  title: raw.title,
  person: raw.person ?? undefined,
  date: raw.date,
  body: raw.bodyHtml ?? '',
  video: mapVideo(raw.video, raw.title),
  banner: mediaUrl(raw.banner, 'banner'),
  bannerCard: mediaUrl(raw.banner, 'card'),
  bannerAlt: mediaAlt(raw.banner),
  status: raw.status,
});

/**
 * Published testimonies, newest first.
 *
 * `limit` exists because the listing and the route generation want different
 * things. Testimonies are evergreen and get shared on Facebook, so a page
 * that stops being built is a link that starts 404ing — `getStaticPaths` must
 * therefore ask for everything, not just the page-one slice.
 */
export async function getTestimonies({ limit = 24 }: { limit?: number } = {}): Promise<
  Testimony[]
> {
  const { sampleTestimonies } = await import('./sample-content');
  const data = await cmsFetch<RawTestimony[]>(
    `/api/life-testimonies?where[status][equals]=published&sort=-date&limit=${limit}&depth=1`,
  );
  if (data === null) return sampleTestimonies;
  return data.map(mapTestimony);
}

/**
 * Every published testimony, for building detail routes. The ceiling is a
 * runaway guard, not a product limit — raise it long before the church has
 * 500 stories.
 */
export const getAllTestimonies = (): Promise<Testimony[]> => getTestimonies({ limit: 500 });

/**
 * Fetch a single testimony by slug.
 *
 * `preview: true` drops the `status = published` filter so unpublished drafts
 * resolve — this backs the on-demand preview route reached from the CMS
 * "Preview" button. Preview reads live from the CMS only: there is no sample
 * fallback, so a missing slug or unreachable CMS returns null.
 *
 * Reading drafts requires an authenticated request, i.e. CMS_TOKEN must be set.
 */
export async function getTestimonyBySlug(
  slug: string,
  { preview = false }: { preview?: boolean } = {},
): Promise<Testimony | null> {
  const encoded = encodeURIComponent(slug);
  const statusFilter = preview ? '' : '&where[status][equals]=published';
  const data = await cmsFetch<RawTestimony[]>(
    `/api/life-testimonies?where[slug][equals]=${encoded}${statusFilter}&limit=1&depth=1`,
  );
  if (!data || data.length === 0) return null;
  return mapTestimony(data[0]);
}
