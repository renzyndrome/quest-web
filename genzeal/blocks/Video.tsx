"use client";

import { useState } from "react";
import { youtubeId } from "@/lib/youtube";

export type VideoProps = { url: string; title: string };

export function Video({ url, title }: VideoProps) {
  const [playing, setPlaying] = useState(false);
  const id = youtubeId(url);

  return (
    <section className="mx-auto max-w-content px-gutter py-8">
      {!id ? (
        <p className="text-small text-ink-500">Video link not recognised.</p>
      ) : (
        <div className="relative aspect-video overflow-hidden rounded-media bg-ink">
          {playing ? (
            <iframe
              src={`https://www.youtube-nocookie.com/embed/${id}?autoplay=1`}
              title={title || "Video"}
              allow="autoplay; encrypted-media; picture-in-picture"
              allowFullScreen
              className="absolute inset-0 h-full w-full border-0"
            />
          ) : (
            <>
              <img
                src={`https://i.ytimg.com/vi/${id}/hqdefault.jpg`}
                alt={title}
                loading="lazy"
                className="absolute inset-0 h-full w-full object-cover"
              />
              <button
                type="button"
                aria-label="Play video"
                onClick={() => setPlaying(true)}
                className="group absolute inset-0 flex items-center justify-center"
              >
                <span className="flex size-16 min-h-11 min-w-11 items-center justify-center rounded-btn bg-brand text-white shadow-lg transition-colors duration-200 group-hover:bg-brand-press">
                  <svg aria-hidden="true" viewBox="0 0 24 24" className="ml-1 size-7 fill-current">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                </span>
              </button>
            </>
          )}
        </div>
      )}
      {title ? <p className="mt-3 text-small text-ink-500">{title}</p> : null}
    </section>
  );
}
