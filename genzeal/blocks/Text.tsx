import type { ReactNode } from "react";
import { useNested } from "@/components/Nest";
import { RichText } from "@/components/RichText";

/** `body` is rich text; pages saved before that hold a plain string, upgraded on load (lib/richtext.ts). */
export type TextProps = { heading: string; body: ReactNode; tone: "white" | "cream"; align?: "left" | "center" };

export function Text({ heading, body, tone, align = "left" }: TextProps) {
  const nested = useNested();
  const center = align === "center";
  const inner = (
    <div className={`max-w-copy ${center ? "mx-auto text-center" : ""}`}>
      {heading ? <h2 className="font-display text-display-md font-semibold">{heading}</h2> : null}
      <RichText value={body} className={heading ? "mt-5" : ""} />
    </div>
  );

  // Inside a Section the section owns the background and spacing.
  if (nested) return inner;

  return (
    <section className={`tone-light py-section ${tone === "cream" ? "bg-cream" : "bg-white"}`}>
      <div className="mx-auto max-w-copy px-gutter">{inner}</div>
    </section>
  );
}
