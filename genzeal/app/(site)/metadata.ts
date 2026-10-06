import type { Data } from "@puckeditor/core";
import type { Metadata } from "next";

/** Page title and description from the Puck root fields, falling back to "GenZeal". */
export function pageMetadata(data: Data | null): Metadata {
  const props = (data?.root?.props ?? {}) as { title?: unknown; description?: unknown };
  const title = typeof props.title === "string" && props.title.trim() ? props.title.trim() : "GenZeal";
  const description =
    typeof props.description === "string" && props.description.trim() ? props.description.trim() : undefined;
  return { title, description };
}
