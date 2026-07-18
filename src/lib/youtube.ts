import type { SermonEntry } from './sample-content';

export const YT_CHANNEL_ID = 'UCqyGbGmIG_CmocMrAnrufsA';
/** Channel uploads playlist — always the latest videos, updates automatically. */
export const YT_UPLOADS_PLAYLIST = 'UUqyGbGmIG_CmocMrAnrufsA';
export const YT_CHANNEL_URL = `https://www.youtube.com/channel/${YT_CHANNEL_ID}`;
export const YT_LIVE_URL = `https://www.youtube.com/channel/${YT_CHANNEL_ID}/live`;

/*
  Build-time sermon archive from per-service YouTube playlists.
  Editors keep the archive current just by adding each recording to the
  right playlist in YouTube Studio. Falls back to sample sermons when the
  API key or playlist IDs are unset, so builds never depend on the API.
  The key is used at build only (server context) — never shipped to the client.
*/
const SERVICE_PLAYLISTS: Record<SermonEntry['service'], string | undefined> = {
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

async function fetchPlaylist(
  service: SermonEntry['service'],
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

export async function getSermons(): Promise<SermonEntry[]> {
  const { sampleSermons } = await import('./sample-content');
  const apiKey = import.meta.env.YOUTUBE_API_KEY;
  const services = Object.entries(SERVICE_PLAYLISTS).filter(([, id]) => id) as Array<
    [SermonEntry['service'], string]
  >;
  if (!apiKey || services.length === 0) return sampleSermons;

  const results = await Promise.all(
    services.map(([service, id]) => fetchPlaylist(service, id, apiKey)),
  );
  const all = results.flat().sort((a, b) => b.date.localeCompare(a.date));
  return all.length > 0 ? all : sampleSermons;
}
