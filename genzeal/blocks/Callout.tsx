import type { ReactNode } from "react";
import { Block } from "@/components/Nest";
import { RichText } from "@/components/RichText";

export type CalloutProps = { heading: string; body: ReactNode; tone: "info" | "important" };

export function Callout({ heading, body, tone }: CalloutProps) {
  const important = tone === "important";
  return (
    <Block width="copy" center>
      <div
        className={`tone-light rounded-card p-6 ${important ? "border-l-4 border-brand bg-red-tint" : "border border-cream-200 bg-cream"}`}
      >
        {heading ? <h2 className="font-display text-title font-semibold">{heading}</h2> : null}
        <RichText value={body} className={heading ? "mt-2" : ""} />
      </div>
    </Block>
  );
}
