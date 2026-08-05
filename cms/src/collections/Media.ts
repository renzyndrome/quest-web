/*
  Media — uploads with sized webp derivatives.

  Replaces Directus' on-the-fly asset transforms (?width=…&format=webp) with
  named presets generated at upload time. `banner` and `card` mirror the two
  sizes the site actually requests, so the Astro side just picks a preset URL.

  Alt text is required — every image on the site needs it (content rules).
*/
import type { CollectionConfig } from 'payload';
import { isAuthenticated } from '../access/roles';

export const Media: CollectionConfig = {
  slug: 'media',
  access: {
    // Public read so <img> tags resolve without a token.
    read: () => true,
    create: isAuthenticated,
    update: isAuthenticated,
    delete: isAuthenticated,
  },
  upload: {
    staticDir: process.env.MEDIA_DIR || 'media',
    mimeTypes: ['image/*'],
    imageSizes: [
      {
        name: 'banner',
        width: 1200,
        formatOptions: { format: 'webp', options: { quality: 80 } },
      },
      {
        name: 'card',
        width: 800,
        formatOptions: { format: 'webp', options: { quality: 80 } },
      },
    ],
  },
  fields: [
    {
      name: 'alt',
      type: 'text',
      required: true,
      admin: { description: 'Describe the photo for screen readers.' },
    },
  ],
};
