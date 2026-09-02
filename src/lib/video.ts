/*
  Turns the CMS video fields into something a component can render.

  Editors paste a link straight from the address bar, so this accepts every
  shape YouTube and Facebook hand out rather than demanding a canonical one.
  Anything unrecognised resolves to null and the page simply shows no video —
  a bad link must never break the build or leave a dead player on the page.

  Nothing here touches the network. Parsing happens at build time; the actual
  players load only when a visitor taps play (see VideoEmbed.astro).
*/

export type VideoKind = 'youtube' | 'facebook' | 'file';

export interface TestimonyVideo {
  kind: VideoKind;
  /** Still image shown before playback. Null falls back to a brand gradient. */
  poster: string | null;
  /** Accessible label for the play button and the eventual player. */
  title: string;
  /** youtube — the 11-character video id. */
  youtubeId?: string;
  /** facebook — the plugin iframe src, swapped in on tap. */
  embedSrc?: string;
  /** file — direct URL to a self-hosted MP4/WebM. */
  fileUrl?: string;
  /** file — mime type, so <source type> lets the browser skip what it can't play. */
  mimeType?: string;
}

/** YouTube ids are exactly 11 URL-safe characters. */
const YOUTUBE_ID = /^[A-Za-z0-9_-]{11}$/;

/** /embed/ID, /live/ID, /shorts/ID, /v/ID — the path-style permalinks. */
const YOUTUBE_PATH = /^\/(?:embed|live|shorts|v)\/([A-Za-z0-9_-]{11})/;

/** Mirrors FACEBOOK_HOST in cms/src/collections/LifeTestimonies.ts. */
const FACEBOOK_HOST = /^(www\.|web\.|m\.|fb\.)?(facebook\.com|fb\.watch)$/i;

/**
 * Extracts the video id from any YouTube link shape: watch?v=, youtu.be/,
 * /embed/, /live/, /shorts/. Returns null for anything else.
 */
export function youtubeIdFromUrl(url: string): string | null {
  let parsed: URL;
  try {
    parsed = new URL(url.trim());
  } catch {
    return null;
  }

  const host = parsed.hostname.replace(/^(?:www|m)\./i, '').toLowerCase();

  if (host === 'youtu.be') {
    const id = parsed.pathname.slice(1).split('/')[0];
    return YOUTUBE_ID.test(id) ? id : null;
  }

  if (host === 'youtube.com' || host === 'youtube-nocookie.com') {
    const query = parsed.searchParams.get('v');
    if (query && YOUTUBE_ID.test(query)) return query;
    const path = parsed.pathname.match(YOUTUBE_PATH);
    if (path) return path[1];
  }

  return null;
}

/**
 * Builds the Facebook video plugin URL for a post/video permalink.
 *
 * Facebook has no id we can address directly the way YouTube does — the
 * plugin takes the whole original URL as its `href`. Returns null unless the
 * link really is a Facebook one, so a mistyped source never renders an iframe
 * pointed at an arbitrary host.
 */
export function facebookEmbedSrc(url: string): string | null {
  let parsed: URL;
  try {
    parsed = new URL(url.trim());
  } catch {
    return null;
  }

  /*
    Deliberately the same pattern as the CMS validator in
    cms/src/collections/LifeTestimonies.ts. The two must agree: a host the CMS
    saves happily but this rejects is a link that vanishes from the page with
    no error anywhere. Matching whole hosts rather than stripping a prefix is
    what keeps `fb.watch` working — stripping `fb.` would leave `watch`.
  */
  if (!FACEBOOK_HOST.test(parsed.hostname)) return null;

  const href = encodeURIComponent(parsed.toString());
  return `https://www.facebook.com/plugins/video.php?href=${href}&show_text=false`;
}

/**
 * Still image for a video in a listing, where a full facade would be too
 * heavy. YouTube publishes one per video; Facebook and uploads only have one
 * if an editor supplied it. Null means the card falls back to its banner.
 */
export function videoThumbnail(video: TestimonyVideo): string | null {
  if (video.kind === 'youtube' && video.youtubeId) {
    return `https://i.ytimg.com/vi/${video.youtubeId}/hqdefault.jpg`;
  }
  return video.poster;
}
