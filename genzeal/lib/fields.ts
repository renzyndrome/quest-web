import type { RichtextField } from "@puckeditor/core";

type RichTextOptions = NonNullable<RichtextField["options"]>;

/** Links may be site-relative, #anchors, bare domains, or http(s)/mailto/tel. Any other scheme is refused. */
function isAllowedLink(url: string | null | undefined): boolean {
  const value = (url ?? "").replace(/[\s\x00-\x1f]/g, "");
  const scheme = value.match(/^([a-z][a-z0-9+.-]*):/i);
  return !scheme || ["http", "https", "mailto", "tel"].includes(scheme[1].toLowerCase());
}

/*
  Document formatting only, the same rule as the main site's CMS: no colour,
  font or size, no underline (reads as a link), no code. Every tag this can
  emit has a rule in the .rich-text block of app/globals.css.

  Editors are trusted church staff behind the editor password, so the HTML is
  not run through a sanitiser; Tiptap's schema already drops unknown tags and
  the link check below refuses javascript: and other schemes.
*/
export const RICH_TEXT_OPTIONS: RichTextOptions = {
  bold: {},
  italic: {},
  strike: {},
  underline: false,
  code: false,
  codeBlock: false,
  heading: { levels: [2, 3] },
  bulletList: {},
  orderedList: {},
  blockquote: {},
  horizontalRule: {},
  textAlign: { alignments: ["left", "center", "right"] },
  link: {
    openOnClick: false,
    // Internal links and #anchors stay in the same tab.
    HTMLAttributes: { target: null, rel: null },
    isAllowedUri: (url) => isAllowedLink(url),
  },
};

/** The one rich text field used by every block, edited in place on the canvas. */
export function richText(label: string, opts: Partial<Omit<RichtextField, "type">> = {}): RichtextField {
  return { type: "richtext", label, contentEditable: true, options: RICH_TEXT_OPTIONS, ...opts };
}
