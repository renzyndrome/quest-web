/*
  The one rich-text editor used by announcement bodies, event descriptions and
  life testimonies.

  Passing a `features` array REPLACES Payload's defaults — including the two
  toolbar features. Omitting them is what left editors with no formatting
  buttons at all, reachable only through keyboard shortcuts or the `/` menu.
  So the toolbars are listed explicitly here alongside the marks.

  The set is "document formatting", not design control (.claude/rules/
  content.md): structure and emphasis only. Colours, fonts, sizes, alignment
  and raw HTML stay out — those are the site's job, not the editor's.

  Every tag produced here has a matching rule in the site's `.rich-text`
  block (src/styles/global.css). Adding a feature means adding that rule
  first, or the markup ships unstyled.

    ParagraphFeature      <p>
    HeadingFeature        <h2>, <h3>   (h1 is the page title, never body copy)
    BoldFeature           <strong>
    ItalicFeature         <em>
    StrikethroughFeature  <span style="text-decoration: line-through;">
    BlockquoteFeature     <blockquote>
    HorizontalRuleFeature <hr>
    LinkFeature           <a>
    Unordered/OrderedList <ul>, <ol>, <li>
    IndentFeature         nested lists / indented paragraphs

  Underline is deliberately absent even though a document editor would
  normally have it: `.rich-text a` is underlined, so underlined body text
  would be indistinguishable from a link apart from its colour — a
  colour-only cue, and a broken promise when it turns out not to be clickable.
*/
import {
  lexicalEditor,
  FixedToolbarFeature,
  InlineToolbarFeature,
  ParagraphFeature,
  HeadingFeature,
  BoldFeature,
  ItalicFeature,
  StrikethroughFeature,
  BlockquoteFeature,
  HorizontalRuleFeature,
  IndentFeature,
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
    // h2 and h3 only. The page renders the item title as the single h1, so a
    // body h1 would break the document outline on every article.
    HeadingFeature({ enabledHeadingSizes: ['h2', 'h3'] }),

    BoldFeature(),
    ItalicFeature(),
    StrikethroughFeature(),

    BlockquoteFeature(),
    HorizontalRuleFeature(),
    IndentFeature(),

    LinkFeature(),
    UnorderedListFeature(),
    OrderedListFeature(),
  ],
});
