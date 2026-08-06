/*
  Events — marketing-owned event content rendered at /events and /events/[slug].

  Registration is a plain URL pasted by marketing (Google Form, FB event, …).
  Never model registrations or attendees here — that boundary belongs to the
  membership app (see .claude/rules/content.md).
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

export const Events: CollectionConfig = {
  slug: 'events',
  admin: {
    group: 'Content',
    useAsTitle: 'name',
    defaultColumns: ['name', 'date', 'venue', 'status'],
  },
  access: {
    read: readPublishedOrAuthenticated,
    create: isAuthenticated,
    update: isAuthenticated,
    delete: isAdmin,
  },
  hooks: {
    afterRead: [addHtmlFields(['description'])],
    afterChange: [deployWebhook, notifyApprover],
  },
  fields: [
    { name: 'name', type: 'text', required: true },
    {
      name: 'slug',
      type: 'text',
      required: true,
      unique: true,
      index: true,
      admin: { description: 'URL-safe, lowercase, hyphenated. Used at /events/<slug>.' },
    },
    { name: 'date', type: 'date', required: true, index: true },
    {
      name: 'time',
      type: 'text',
      admin: { description: '24-hour, e.g. 15:00. Rendered as 3:00 PM.' },
    },
    { name: 'venue', type: 'text' },
    {
      name: 'description',
      type: 'richText',
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
    { name: 'banner', type: 'upload', relationTo: 'media' },
    {
      name: 'bannerAlt',
      type: 'text',
      validate: (value: unknown, options: any) =>
        options?.siblingData?.banner && !value
          ? 'Alt text is required when a banner image is set.'
          : true,
    },
    {
      name: 'registrationUrl',
      type: 'text',
      admin: { description: 'Paste the Google Form / Facebook event link.' },
    },
    {
      name: 'registrationOpen',
      type: 'checkbox',
      defaultValue: false,
      admin: { position: 'sidebar' },
    },
    statusField,
  ],
};
