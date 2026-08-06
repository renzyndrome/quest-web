/*
  Carousel slides — the banner carousel on the home page.

  Ordering uses `order` rather than `sort` to avoid colliding with Payload's
  own ?sort= query parameter semantics.
*/
import type { CollectionConfig } from 'payload';
import { isAdmin, isAuthenticated, readPublishedOrAuthenticated } from '../access/roles';
import { statusField } from '../fields/statusField';
import { deployWebhook } from '../hooks/deployWebhook';

export const CarouselSlides: CollectionConfig = {
  slug: 'carousel-slides',
  admin: {
    group: 'Content',
    useAsTitle: 'title',
    defaultColumns: ['title', 'theme', 'order', 'status'],
  },
  access: {
    read: readPublishedOrAuthenticated,
    create: isAuthenticated,
    update: isAuthenticated,
    delete: isAdmin,
  },
  hooks: {
    afterChange: [deployWebhook],
  },
  fields: [
    { name: 'title', type: 'text', required: true },
    { name: 'subtitle', type: 'text' },
    { name: 'chip', type: 'text', admin: { description: 'Small label pill, e.g. "This Sunday".' } },
    {
      name: 'theme',
      type: 'select',
      required: true,
      defaultValue: 'red',
      options: ['red', 'dark', 'cream', 'deep'],
    },
    { name: 'image', type: 'upload', relationTo: 'media' },
    { name: 'href', type: 'text', admin: { description: 'Where the slide links to.' } },
    {
      name: 'order',
      type: 'number',
      defaultValue: 0,
      admin: { position: 'sidebar', description: 'Lower numbers show first.' },
    },
    statusField,
  ],
};
