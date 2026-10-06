"use client";

import { useState } from "react";
import { Block } from "@/components/Nest";
import { buttonClass } from "./Button";

export type MapProps = { address: string; label: string };

export function MapCard({ address, label }: MapProps) {
  const [open, setOpen] = useState(false);
  const query = encodeURIComponent((address ?? "").trim());

  return (
    <Block>
      <div className="tone-light rounded-card border border-cream-200 bg-cream p-6">
        {label ? <h2 className="font-display text-title font-semibold">{label}</h2> : null}
        {query ? (
          <>
            <p className="mt-1 text-body whitespace-pre-line text-ink-700">{address}</p>
            <div className="mt-4 flex flex-wrap gap-3">
              <a
                href={`https://www.google.com/maps/dir/?api=1&destination=${query}`}
                target="_blank"
                rel="noopener"
                className={buttonClass("primary")}
              >
                Get directions
              </a>
              {!open ? (
                <button type="button" onClick={() => setOpen(true)} className={buttonClass("secondary")}>
                  Show map
                </button>
              ) : null}
            </div>
            {open ? (
              <div className="mt-4 aspect-video overflow-hidden rounded-media">
                <iframe
                  src={`https://www.google.com/maps?q=${query}&output=embed`}
                  title="Map"
                  loading="lazy"
                  className="h-full w-full border-0"
                />
              </div>
            ) : null}
          </>
        ) : (
          <p className="mt-1 text-small text-ink-500">Address missing.</p>
        )}
      </div>
    </Block>
  );
}
