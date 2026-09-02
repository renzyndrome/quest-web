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
  fix an address — but for everyone else it does not exist.
*/
import type { Field } from 'payload';

/** "Isang dekada ng katapatan!" → "isang-dekada-ng-katapatan" */
export function slugify(input: string): string {
  return input
    .normalize('NFKD')
    // Strip diacritics so "Biñan" becomes "binan", not "bian".
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80)
    .replace(/-+$/g, '');
}

/**
 * @param sourceField the field to build the slug from — `title` on most
 *   collections, `name` on events.
 */
export const slugField = (sourceField: string): Field => ({
  name: 'slug',
  type: 'text',
  unique: true,
  index: true,
  admin: {
    position: 'sidebar',
    description:
      'The page address, set from the title when the item is created. Changing it breaks any link already shared.',
    // Editors never see this. Admins do, because they are who would need to
    // repair an address.
    condition: (_data, _siblingData, { user }) => user?.role === 'admin',
  },
  hooks: {
    beforeValidate: [
      async ({ collection, data, originalDoc, req, value }) => {
        // Already has an address — keep it. This is what makes a rename safe.
        const existing = typeof originalDoc?.slug === 'string' ? originalDoc.slug : '';
        if (existing) return existing;

        // An admin typed one by hand; respect it, just tidy the formatting.
        const source = typeof value === 'string' && value.trim() ? value : data?.[sourceField];
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
});
