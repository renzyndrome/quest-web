/*
  Announcements — the news/blog collection rendered at /news and /news/[slug].

  Field names are camelCase to match the site's domain type directly. `body` is
  Lexical; `bodyHtml` is added on read (see fields/richTextHtml.ts) so Astro
  keeps receiving an HTML string.
*/
import type { CollectionConfig } from 'payload';
import {
  lexicalEditor,
  BoldFeature,
  ItalicFeature,
  LinkFeature,
  ParagraphFeature,
  UnorderedListFeature,
  OrderedListFeature,
} from '@payloadcms/richtext-lexical';
import { isAdmin, isAuthenticated, readPublishedOrAuthenticated } from '../access/roles';
import { statusField } from '../fields/statusField';
import { addHtmlFields } from '../fields/richTextHtml';
import { deployWebhook } from '../hooks/deployWebhook';
import { notifyApprover } from '../hooks/notifyApprover';

export const Announcements: CollectionConfig = {
  slug: 'announcements',
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'date', 'category', 'status'],
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
    {
      name: 'slug',
      type: 'text',
      required: true,
      unique: true,
      index: true,
      admin: { description: 'URL-safe, lowercase, hyphenated. Used at /news/<slug>.' },
    },
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
      // Limited toolbar, matching the trust assumption in .claude/rules/content.md.
      editor: lexicalEditor({
        features: () => [
          ParagraphFeature(),
          BoldFeature(),
          ItalicFeature(),
          LinkFeature(),
          UnorderedListFeature(),
          OrderedListFeature(),
        ],
      }),
    },
    {
      name: 'pinned',
      type: 'checkbox',
      defaultValue: false,
      admin: { position: 'sidebar', description: 'Show first on the news page.' },
    },
    { name: 'banner', type: 'upload', relationTo: 'media' },
    {
      name: 'bannerAlt',
      type: 'text',
      admin: { description: 'Required when a banner is set.' },
      validate: (value: unknown, options: any) =>
        options?.siblingData?.banner && !value
          ? 'Alt text is required when a banner image is set.'
          : true,
    },
    statusField,
  ],
};
