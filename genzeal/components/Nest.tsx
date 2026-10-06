"use client";

import { createContext, useContext, type ReactNode } from "react";

/*
  Blocks dropped straight on the page bring their own container (width,
  gutter, vertical rhythm). Blocks inside a Section or Columns slot sit in the
  parent's container instead, so this flag tells them which case they are in.
*/
const Nested = createContext(false);

export function NestProvider({ children }: { children: ReactNode }) {
  return <Nested.Provider value>{children}</Nested.Provider>;
}

export function useNested(): boolean {
  return useContext(Nested);
}

type BlockProps = {
  children: ReactNode;
  /** "copy" keeps reading text to 640px; "content" allows the full 1080px. */
  width?: "copy" | "content";
  center?: boolean;
  className?: string;
};

export function Block({ children, width = "content", center = false, className = "" }: BlockProps) {
  const nested = useNested();
  const max = width === "copy" ? "max-w-copy" : "max-w-content";
  if (nested) {
    const narrow = width === "copy" ? `max-w-copy ${center ? "mx-auto" : ""}` : "";
    return <div className={`${narrow} ${className}`}>{children}</div>;
  }
  return <div className={`mx-auto ${max} px-gutter py-8 ${className}`}>{children}</div>;
}

/** Grid classes per column count, mobile first. Literal strings so Tailwind finds them. */
export const GRID_COLUMNS = {
  "2": "grid-cols-1 sm:grid-cols-2",
  "3": "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
  "4": "grid-cols-2 md:grid-cols-4",
} as const;
