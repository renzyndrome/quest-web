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
import { dayField } from '../fields/dayField';
import { timeField } from '../fields/timeField';
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
    description: 'Gatherings shown on the site\'s Events page. Past events drop off on their own.',
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
    dayField('date', {
      index: true,
      description: 'The day it happens. The site hides the event after this day.',
    }),
    timeField,
    {
      name: 'venue',
      type: 'text',
      admin: { placeholder: 'Moriah Hall', description: 'Where it happens.' },
    },
    {
      name: 'description',
      type: 'richText',
      editor: limitedEditor,
    },
    {
      name: 'banner',
      type: 'upload',
      relationTo: 'media',
      admin: { description: 'The event poster or photo shown on the card and the detail page.' },
    },
    {
      name: 'registrationUrl',
      type: 'text',
      label: 'Registration link',
      admin: {
        placeholder: 'https://forms.gle/...',
        description: 'Paste the Google Form or Facebook event link. Leave blank if none.',
      },
    },
    {
      name: 'registrationOpen',
      type: 'checkbox',
      defaultValue: false,
      label: 'Registration is open',
      admin: {
        position: 'sidebar',
        description: 'Shows a "Registration open" label on the card.',
        // Meaningless without somewhere to register, so it only appears once
        // a link exists. The hook below keeps the stored value honest when a
        // link is removed after the box was already ticked.
        condition: (data) => Boolean(data?.registrationUrl),
      },
      hooks: {
        beforeValidate: [
          // A partial update may not resend the link, so fall back to the
          // stored one before deciding the flag is orphaned.
          ({ data, originalDoc }) =>
            data?.registrationUrl ?? originalDoc?.registrationUrl ? undefined : false,
        ],
      },
    },
    slugField('name'),
    statusField,
  ],
};
