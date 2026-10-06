import type { ReactNode } from "react";
import { Block } from "@/components/Nest";
import { RichText } from "@/components/RichText";

export type TestimonialProps = { quote: ReactNode; name: string; role: string; photo: string; alt: string };

export function Testimonial({ quote, name, role, photo, alt }: TestimonialProps) {
  if (!quote) return null;
  return (
    <Block width="copy" center>
      <figure>
        <blockquote>
          <RichText value={quote} className="rich-text-lg" />
        </blockquote>
        {name || role || photo ? (
          <figcaption className="mt-5 flex items-center gap-3">
            {photo ? (
              <img src={photo} alt={alt} loading="lazy" className="size-14 shrink-0 rounded-full object-cover" />
            ) : null}
            <span className="flex flex-col">
              {name ? <span className="font-semibold">{name}</span> : null}
              {role ? <span className="text-small text-fg-soft">{role}</span> : null}
            </span>
          </figcaption>
        ) : null}
      </figure>
    </Block>
  );
}
