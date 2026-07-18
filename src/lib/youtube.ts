import type { SermonEntry, ServiceSlug } from './sample-content';

export const YT_CHANNEL_ID = 'UCqyGbGmIG_CmocMrAnrufsA';
/** Channel uploads playlist — always the latest videos, updates automatically. */
export const YT_UPLOADS_PLAYLIST = 'UUqyGbGmIG_CmocMrAnrufsA';
export const YT_CHANNEL_URL = `https://www.youtube.com/channel/${YT_CHANNEL_ID}`;
export const YT_LIVE_URL = `https://www.youtube.com/channel/${YT_CHANNEL_ID}/live`;
const CHANNEL_FEED_URL = `https://www.youtube.com/feeds/videos.xml?channel_id=${YT_CHANNEL_ID}`;

/** Sermons + whether they carry per-service categories (drives the filter tabs). */
export interface SermonArchive {
  entries: SermonEntry[];
  categorized: boolean;
}

const byDateDesc = (a: SermonEntry, b: SermonEntry): number => b.date.localeCompare(a.date);

/*
  Build-time sermon archive. Preference order:
   1. Per-service YouTube playlists via the Data API (categorized → filter tabs)
   2. Keyless channel RSS feed (real recent uploads, uncategorized)
   3. Sample sermons (offline builds)
  All at build only (server context) — no key is shipped to the client.
*/
const SERVICE_PLAYLISTS: Record<ServiceSlug, string | undefined> = {
  family: import.meta.env.YOUTUBE_PLAYLIST_FAMILY,
  youngpro: import.meta.env.YOUTUBE_PLAYLIST_YOUNGPRO,
  youth: import.meta.env.YOUTUBE_PLAYLIST_YOUTH,
  dawn: import.meta.env.YOUTUBE_PLAYLIST_DAWN,
};

interface PlaylistItem {
  snippet?: {
    title?: string;
    publishedAt?: string;
    resourceId?: { videoId?: string };
  };
}

interface VideoItem {
  id?: string;
  snippet?: { title?: string; publishedAt?: string };
  /** Present only for streams; actualStartTime marks a real (completed/ongoing) broadcast. */
  liveStreamingDetails?: { actualStartTime?: string };
}

async function fetchPlaylist(
  service: ServiceSlug,
  playlistId: string,
  apiKey: string,
): Promise<SermonEntry[]> {
  try {
    const url = new URL('https://www.googleapis.com/youtube/v3/playlistItems');
    url.searchParams.set('part', 'snippet');
    url.searchParams.set('maxResults', '6');
    url.searchParams.set('playlistId', playlistId);
    url.searchParams.set('key', apiKey);

    const res = await fetch(url);
    if (!res.ok) {
      console.warn(`[youtube] playlist ${service} responded ${res.status}; skipping`);
      return [];
    }
    const data = (await res.json()) as { items?: PlaylistItem[] };
    return (data.items ?? [])
      .filter((item) => {
        // Unavailable videos keep a videoId but get placeholder titles.
        // Match exactly so real sermons titled "Private…" aren't dropped and
        // "Deleted video" doesn't slip through as a broken embed.
        const title = item.snippet?.title;
        return (
          Boolean(item.snippet?.resourceId?.videoId) &&
          title !== 'Private video' &&
          title !== 'Deleted video'
        );
      })
      .map((item) => ({
        service,
        title: item.snippet!.title!,
        date: (item.snippet!.publishedAt ?? '').slice(0, 10),
        videoId: item.snippet!.resourceId!.videoId!,
      }));
  } catch (error) {
    console.warn(`[youtube] playlist ${service} fetch failed; skipping`, error);
    return [];
  }
}

/** Decode the XML entities YouTube uses in feed titles (e.g. &#39; &amp;). */
function decodeXmlEntities(value: string): string {
  return value
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&(?:apos|#39);/g, "'")
    .replace(/&#(\d+);/g, (_, dec) => String.fromCodePoint(Number(dec)))
    .replace(/&#x([0-9a-f]+);/gi, (_, hex) => String.fromCodePoint(parseInt(hex, 16)))
    .replace(/&amp;/g, '&'); // last, so &amp;#39; isn't decoded twice
}

/*
  Keyless fallback: the channel's public RSS feed (latest ~15 uploads) with
  real titles + publish dates. Not categorized by service and includes all
  uploads (the feed can't distinguish live broadcasts). Lightweight regex
  parse — the feed shape is stable and this runs at build over trusted input.
*/
async function fetchChannelFeed(): Promise<SermonEntry[]> {
  try {
    const res = await fetch(CHANNEL_FEED_URL);
    if (!res.ok) {
      console.warn(`[youtube] channel feed responded ${res.status}`);
      return [];
    }
    const xml = await res.text();
    const entries: SermonEntry[] = [];
    for (const block of xml.split('<entry>').slice(1)) {
      const videoId = block.match(/<yt:videoId>([^<]+)<\/yt:videoId>/)?.[1];
      const rawTitle = block.match(/<title>([\s\S]*?)<\/title>/)?.[1];
      const published = block.match(/<published>([^<]+)<\/published>/)?.[1];
      if (!videoId || !rawTitle) continue;
      entries.push({
        service: null,
        title: decodeXmlEntities(rawTitle).trim(),
        date: (published ?? '').slice(0, 10),
        videoId,
      });
    }
    return entries;
  } catch (error) {
    console.warn('[youtube] channel feed fetch failed', error);
    return [];
  }
}

/*
  Live-only path (API key, no per-service playlists): pull recent uploads,
  then keep only those the Videos endpoint marks as real broadcasts
  (liveStreamingDetails.actualStartTime present). Two API calls, uncategorized.
*/
async function fetchLiveBroadcasts(apiKey: string): Promise<SermonEntry[]> {
  try {
    const listUrl = new URL('https://www.googleapis.com/youtube/v3/playlistItems');
    listUrl.searchParams.set('part', 'snippet');
    listUrl.searchParams.set('maxResults', '15');
    listUrl.searchParams.set('playlistId', YT_UPLOADS_PLAYLIST);
    listUrl.searchParams.set('key', apiKey);
    const listRes = await fetch(listUrl);
    if (!listRes.ok) {
      console.warn(`[youtube] uploads list responded ${listRes.status}`);
      return [];
    }
    const listData = (await listRes.json()) as { items?: PlaylistItem[] };
    const ids = (listData.items ?? [])
      .map((item) => item.snippet?.resourceId?.videoId)
      .filter((id): id is string => Boolean(id));
    if (ids.length === 0) return [];

    const videosUrl = new URL('https://www.googleapis.com/youtube/v3/videos');
    videosUrl.searchParams.set('part', 'snippet,liveStreamingDetails');
    videosUrl.searchParams.set('id', ids.join(','));
    videosUrl.searchParams.set('key', apiKey);
    const videosRes = await fetch(videosUrl);
    if (!videosRes.ok) {
      console.warn(`[youtube] videos list responded ${videosRes.status}`);
      return [];
    }
    const videosData = (await videosRes.json()) as { items?: VideoItem[] };
    return (videosData.items ?? [])
      .filter((v) => v.liveStreamingDetails?.actualStartTime && v.id && v.snippet?.title)
      .map((v) => ({
        service: null,
        title: v.snippet!.title!,
        date: (v.liveStreamingDetails!.actualStartTime ?? v.snippet!.publishedAt ?? '').slice(0, 10),
        videoId: v.id!,
      }));
  } catch (error) {
    console.warn('[youtube] live broadcasts fetch failed', error);
    return [];
  }
}

export async function getSermons(): Promise<SermonArchive> {
  const apiKey = import.meta.env.YOUTUBE_API_KEY;
  const services = Object.entries(SERVICE_PLAYLISTS).filter(([, id]) => id) as Array<
    [ServiceSlug, string]
  >;

  if (apiKey) {
    // Playlists configured → categorized archive with service filter tabs.
    if (services.length > 0) {
      const results = await Promise.all(
        services.map(([service, id]) => fetchPlaylist(service, id, apiKey)),
      );
      const all = results.flat().sort(byDateDesc);
      if (all.length > 0) return { entries: all, categorized: true };
    }
    // Key only → real past live broadcasts (uncategorized).
    const live = await fetchLiveBroadcasts(apiKey);
    if (live.length > 0) return { entries: live.sort(byDateDesc), categorized: false };
  }

  // Keyless: real recent uploads from the channel RSS feed.
  const feed = await fetchChannelFeed();
  if (feed.length > 0) return { entries: feed.sort(byDateDesc), categorized: false };

  const { sampleSermons } = await import('./sample-content');
  return { entries: sampleSermons, categorized: true };
}
