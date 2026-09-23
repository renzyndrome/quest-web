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
    description: 'The big sliding banners at the top of the home page.',
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
    { name: 'subtitle', type: 'text', admin: { description: 'One short line under the title.' } },
    { name: 'chip', type: 'text', admin: { description: 'Small label pill, e.g. "This Sunday".' } },
    {
      name: 'theme',
      type: 'select',
      required: true,
      defaultValue: 'red',
      label: 'Colour',
      admin: { description: 'The background colour behind the words.' },
      options: [
        { label: 'Red', value: 'red' },
        { label: 'Near black', value: 'dark' },
        { label: 'Cream', value: 'cream' },
        { label: 'Deep maroon', value: 'deep' },
      ],
    },
    {
      name: 'image',
      type: 'upload',
      relationTo: 'media',
      admin: { description: 'The full-width background photo. Wide landscape only.' },
    },
    {
      name: 'href',
      type: 'text',
      label: 'Link',
      admin: {
        placeholder: '/events/harvest-sunday',
        description: 'Where the slide goes when tapped. A page on this site, or a full https:// link.',
      },
    },
    {
      name: 'order',
      type: 'number',
      defaultValue: 0,
      admin: { position: 'sidebar', description: 'Lower numbers show first.' },
    },
    statusField,
  ],
};
