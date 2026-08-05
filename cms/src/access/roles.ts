/*
  Access rules — the code replacement for the Directus roles/policies that used
  to be provisioned by cms/scripts/setup-workflow.ts.

  Two roles live on the Users collection: 'editor' and 'admin'.
*/
import type { Access, FieldAccess } from 'payload';

export const isAdmin: Access = ({ req: { user } }) => user?.role === 'admin';

export const isAdminField: FieldAccess = ({ req: { user } }) => user?.role === 'admin';

export const isAuthenticated: Access = ({ req: { user } }) => Boolean(user);

/**
 * Public reads see published items only; any authenticated request (including
 * the site's read-only API key) sees everything, which is what the draft
 * preview route depends on.
 */
export const readPublishedOrAuthenticated: Access = ({ req: { user } }) => {
  if (user) return true;
  return { status: { equals: 'published' } };
};
