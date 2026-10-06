import type { ReactNode } from "react";
import { looksLikeHtml, plainToHtml } from "@/lib/richtext";

/**
 * Renders a richtext prop inside .rich-text. Puck hands blocks a React node
 * (the canvas editor, or its rendered HTML on the public page); a raw string
 * only arrives if a block is rendered outside Puck.
 */
export function RichText({ value, className = "" }: { value: ReactNode; className?: string }) {
  if (value === null || value === undefined || value === "" || value === false) return null;
  const classes = `rich-text ${className}`;
  if (typeof value === "string") {
    const html = looksLikeHtml(value) ? value : plainToHtml(value);
    return <div className={classes} dangerouslySetInnerHTML={{ __html: html }} />;
  }
  return <div className={classes}>{value}</div>;
}
