/*
  Announcements — the news/blog collection rendered at /news and /news/[slug].

  Field names are camelCase to match the site's domain type directly. `body` is
  Lexical; `bodyHtml` is added on read (see fields/richTextHtml.ts) so Astro
  keeps receiving an HTML string.
*/
import type { CollectionConfig } from 'payload';
import { isAdmin, isAuthenticated, readPublishedOrAuthenticated } from '../access/roles';
import { statusField } from '../fields/statusField';
import { slugField } from '../fields/slugField';
import { limitedEditor } from '../fields/limitedEditor';
import { addHtmlFields } from '../fields/richTextHtml';
import { previewUrlFor } from '../lib/previewUrl';
import { deployWebhook } from '../hooks/deployWebhook';
import { notifyApprover } from '../hooks/notifyApprover';

export const Announcements: CollectionConfig = {
  slug: 'announcements',
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'date', 'category', 'status'],
    // The site calls this section "News" (/news), so label it that way in the
    // admin. The slug stays `announcements` — renaming it would break the
    // API path, the site fetchers and the committed migration.
    group: 'Content',
    description: 'Everything that appears on the site\'s News page.',
    preview: previewUrlFor('announcements'),
  },
  labels: {
    singular: 'News item',
    plural: 'News & Announcements',
  },
  access: {
    read: readPublishedOrAuthenticated,
    create: isAuthenticated,
    update: isAuthenticated,
    delete: isAdmin,
  },
  hooks: {
    afterRead: [addHtmlFields(['body'])],
    afterChange: [deployWebhook, notifyApprover],
  },
  fields: [
    { name: 'title', type: 'text', required: true },
    { name: 'date', type: 'date', required: true },
    {
      name: 'category',
      type: 'select',
      required: true,
      defaultValue: 'Announcement',
      options: ['Announcement', 'Update', 'Campaign', 'Event'],
    },
    {
      name: 'body',
      type: 'richText',
      required: true,
      editor: limitedEditor,
    },
    {
      name: 'pinned',
      type: 'checkbox',
      defaultValue: false,
      admin: { position: 'sidebar', description: 'Show first on the news page.' },
    },
    { name: 'banner', type: 'upload', relationTo: 'media' },
    slugField('title'),
    statusField,
  ],
};
