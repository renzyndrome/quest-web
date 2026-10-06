import type { ReactNode } from "react";
import { NestProvider } from "@/components/Nest";

export type SectionProps = {
  background: "white" | "cream" | "dark" | "brand-tint";
  width: "content" | "narrow";
  spacing: "normal" | "compact";
  anchor?: string;
};

/** "#Schedule 2026" → "schedule-2026", so buttons can link to #schedule-2026. */
export function toAnchor(value: string | undefined): string {
  return (value ?? "")
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-{2,}/g, "-")
    .replace(/^-|-$/g, "");
}

const BACKGROUNDS: Record<SectionProps["background"], string> = {
  white: "tone-light bg-white",
  cream: "tone-light bg-cream",
  dark: "tone-dark bg-maroon-deep",
  "brand-tint": "tone-light bg-red-tint",
};

export function Section({ background, width, spacing, anchor, children }: SectionProps & { children: ReactNode }) {
  return (
    <section
      id={toAnchor(anchor) || undefined}
      className={`${BACKGROUNDS[background] ?? BACKGROUNDS.white} ${spacing === "compact" ? "py-section-sm" : "py-section"} px-gutter scroll-mt-4`}
    >
      <div className={`mx-auto ${width === "narrow" ? "max-w-copy" : "max-w-content"}`}>
        <NestProvider>{children}</NestProvider>
      </div>
    </section>
  );
}
