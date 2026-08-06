/*
  Users — church staff who work in the CMS, plus the site's read-only API key.

  `useAPIKey` gives us the token the Astro build and the draft-preview route
  authenticate with. Since read access grants authenticated requests full
  visibility, that key can read drafts (preview needs this) while the public
  API stays limited to published items.

  Roles: 'editor' submits, 'admin' publishes. Only admins manage users, and
  only admins can change someone's role.
*/
import type { CollectionConfig } from 'payload';
import { isAdmin, isAdminField } from '../access/roles';

export const Users: CollectionConfig = {
  slug: 'users',
  auth: {
    useAPIKey: true,
  },
  admin: {
    group: 'Library',
    useAsTitle: 'email',
    defaultColumns: ['email', 'name', 'role'],
  },
  access: {
    read: isAdmin,
    create: isAdmin,
    update: isAdmin,
    delete: isAdmin,
    admin: ({ req: { user } }) => Boolean(user),
  },
  fields: [
    { name: 'name', type: 'text' },
    {
      name: 'role',
      type: 'select',
      required: true,
      defaultValue: 'editor',
      options: [
        { label: 'Content editor (submits for approval)', value: 'editor' },
        { label: 'Admin / approver (can publish)', value: 'admin' },
      ],
      access: {
        // Editors must never be able to promote themselves.
        create: isAdminField,
        update: isAdminField,
      },
    },
  ],
};
