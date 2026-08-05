/*
  Lexical → HTML on the server.

  Payload stores rich text as Lexical JSON, but the Astro site renders HTML
  strings with `set:html` at build time and runs excerpt() over them. Rather
  than pull Lexical (and its React tree) into the Astro build, we convert here
  and expose a sibling `<field>Html` string on every read. The REST API
  therefore serves HTML and the Astro side is unchanged.

  `disableContainer` strips Lexical's wrapper <div> — the site already wraps
  bodies in its own `.rich-text` container.
*/
import { convertLexicalToHTML } from '@payloadcms/richtext-lexical/html';
import type { CollectionAfterReadHook } from 'payload';

/**
 * Collection afterRead hook that adds `<source>Html` for each named rich-text
 * field. Conversion failures degrade to an empty string rather than breaking
 * the whole read (a malformed body must never take the site build down).
 */
export const addHtmlFields =
  (fields: readonly string[]): CollectionAfterReadHook =>
  ({ doc }) => {
    for (const field of fields) {
      const value = doc?.[field];
      if (!value) continue;
      try {
        doc[`${field}Html`] = convertLexicalToHTML({ data: value, disableContainer: true });
      } catch {
        doc[`${field}Html`] = '';
      }
    }
    return doc;
  };
