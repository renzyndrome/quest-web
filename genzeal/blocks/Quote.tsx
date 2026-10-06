import type { ReactNode } from "react";
import { Block } from "@/components/Nest";
import { RichText } from "@/components/RichText";

export type QuoteProps = { quote: ReactNode; source: string; style: "plain" | "scripture" };

export function Quote({ quote, source, style }: QuoteProps) {
  if (!quote) return null;
  const scripture = style === "scripture";
  return (
    <Block width="copy" center>
      <blockquote className={scripture ? "border-l-4 border-gold-deep pl-5" : ""}>
        <RichText value={quote} className="rich-text-lg" />
        {source ? (
          <footer className={`mt-3 text-small ${scripture ? "font-display font-semibold text-fg-muted" : "text-fg-soft"}`}>
            {source}
          </footer>
        ) : null}
      </blockquote>
    </Block>
  );
}
