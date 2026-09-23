/*
  The URL slug, derived automatically from the item's title.

  Editors are church volunteers, not web people. Asking them to invent a
  "URL-safe, lowercase, hyphenated" string is asking them to think about
  something they have no reason to care about — and getting it wrong breaks a
  public address. So the field fills itself in and stays out of the form.

  Two rules make that safe:

  1. It is generated ONCE, on create. Renaming an item later keeps the
     original address, because the old one is already public: on Facebook, in
     the approval email, in someone's messages. Silently changing it would
     404 every one of those links.
  2. It is de-duplicated against the collection, so two items sharing a title
     ("Water Baptism" every quarter) cannot collide. Without this an editor
     would hit a unique-constraint error naming a field they cannot even see.

  Admins can still see and edit it — they are the ones who would ever need to
  fix an address — but for everyone else it does not exist. The placeholder
  states where the value comes from, so the empty box does not read as a
  required question.
*/
import type { Field } from 'payload';

import { slugify } from './slugify';

export { slugify };

/**
 * @param sourceFields the field to build the slug from — `title` on most
 *   collections, `name` on events. Pass several to express a preference
 *   order: life testimonies read `person` first and fall back to `title`,
 *   because an anonymous testimony has no person to name.
 */
export const slugField = (sourceFields: string | string[]): Field => {
  const sources = Array.isArray(sourceFields) ? sourceFields : [sourceFields];
  const primary = sources[0];

  return {
    name: 'slug',
    type: 'text',
    unique: true,
    index: true,
    admin: {
      position: 'sidebar',
      placeholder: `Set from the ${primary}`,
      description:
        `Optional. Filled in from the ${primary}, and editable. Changing it after the item is live breaks any link already shared.`,
      // Editors never see this. Admins do, because they are who would need to
      // repair an address.
      condition: (_data, _siblingData, { user }) => user?.role === 'admin',
      components: {
        // Mirrors the source field as it is typed, so the box is never a
        // blank question. The hook below stays the source of truth.
        Field: {
          path: '/fields/SlugInput#SlugInput',
          clientProps: { sources },
        },
      },
    },
    hooks: {
      beforeValidate: [
        async ({ collection, data, originalDoc, req, value }) => {
          // Already has an address — keep it. This is what makes a rename safe.
          const existing = typeof originalDoc?.slug === 'string' ? originalDoc.slug : '';
          if (existing) return existing;

          // An admin typed one by hand; respect it, just tidy the formatting.
          let source: unknown = typeof value === 'string' && value.trim() ? value : undefined;
          if (source === undefined) {
            // First source field that actually holds text wins.
            for (const field of sources) {
              const candidate = data?.[field];
              if (typeof candidate === 'string' && candidate.trim()) {
                source = candidate;
                break;
              }
            }
          }
          /*
            `item` catches the degenerate case where the title survives slugify
            as nothing at all — "???", or a title written entirely in a script
            with no ASCII form. Deduplication below turns those into item,
            item-2, item-3, so the field is never left empty and the page always
            has an address.
          */
          const base = (typeof source === 'string' ? slugify(source) : '') || 'item';
          if (!collection) return value;

          /*
            Walk base, base-2, base-3… until one is free. Bounded so a broken
            query can never spin: past 50 collisions something else is wrong,
            and letting the unique index reject it is the safer failure.
          */
          let candidate = base;
          for (let suffix = 2; suffix <= 50; suffix++) {
            const taken = await req.payload.find({
              collection: collection.slug as never,
              where: { slug: { equals: candidate } },
              limit: 1,
              depth: 0,
              overrideAccess: true,
            });
            if (taken.totalDocs === 0) break;
            candidate = `${base}-${suffix}`;
          }
          return candidate;
        },
      ],
    },
  };
};
