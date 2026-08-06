/*
  The one rich-text editor used by announcement bodies and event descriptions.

  Passing a `features` array REPLACES Payload's defaults — including the two
  toolbar features. Omitting them is what left editors with no formatting
  buttons at all, reachable only through keyboard shortcuts or the `/` menu.
  So the toolbars are listed explicitly here alongside the marks.

  The feature set stays deliberately small (paragraph, bold, italic, link,
  lists) per .claude/rules/content.md: editors control words, not design.
  Headings and colours are omitted on purpose — the site's `.rich-text` styles
  only cover these tags, so anything else would render unstyled.
*/
import {
  lexicalEditor,
  FixedToolbarFeature,
  InlineToolbarFeature,
  ParagraphFeature,
  BoldFeature,
  ItalicFeature,
  LinkFeature,
  UnorderedListFeature,
  OrderedListFeature,
} from '@payloadcms/richtext-lexical';

export const limitedEditor = lexicalEditor({
  features: () => [
    // Persistent button bar above the field, plus the floating bar that
    // appears on selection. Without these the field looks like a plain
    // textarea.
    FixedToolbarFeature(),
    InlineToolbarFeature(),

    ParagraphFeature(),
    BoldFeature(),
    ItalicFeature(),
    LinkFeature(),
    UnorderedListFeature(),
    OrderedListFeature(),
  ],
});
