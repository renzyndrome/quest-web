const ID = /^[A-Za-z0-9_-]{11}$/;

/** Extracts the 11-character video id from the common YouTube link shapes. */
export function youtubeId(url: string): string | null {
  if (!url) return null;
  let parsed: URL;
  try {
    parsed = new URL(url.trim());
  } catch {
    return null;
  }
  const host = parsed.hostname.replace(/^(www\.|m\.)/, "");
  let candidate: string | null = null;

  if (host === "youtu.be") {
    candidate = parsed.pathname.split("/")[1] ?? null;
  } else if (host === "youtube.com" || host === "youtube-nocookie.com" || host === "music.youtube.com") {
    if (parsed.pathname === "/watch") {
      candidate = parsed.searchParams.get("v");
    } else {
      const match = parsed.pathname.match(/^\/(?:shorts|embed|live)\/([^/?#]+)/);
      candidate = match?.[1] ?? null;
    }
  }

  return candidate && ID.test(candidate) ? candidate : null;
}
