/*
  Events — marketing-owned event content rendered at /events and /events/[slug].

  Registration is a plain URL pasted by marketing (Google Form, FB event, …).
  Never model registrations or attendees here — that boundary belongs to the
  membership app (see .claude/rules/content.md).
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

export const Events: CollectionConfig = {
  slug: 'events',
  admin: {
    group: 'Content',
    useAsTitle: 'name',
    defaultColumns: ['name', 'date', 'venue', 'status'],
    preview: previewUrlFor('events'),
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
      editor: limitedEditor,
    },
    { name: 'banner', type: 'upload', relationTo: 'media' },
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
    slugField('name'),
    statusField,
  ],
};
