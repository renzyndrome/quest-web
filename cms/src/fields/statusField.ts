/*
  The editorial status field — the heart of the approval workflow.

  draft      → being written
  in_review  → submitted by an editor, awaiting approval
  published  → live at the next site rebuild

  The `validate` guard is what makes "editors submit, admins publish"
  enforceable: it rejects any attempt by a non-admin to set `published`, on
  create as well as update. Admins are unrestricted, so an admin creating an
  item already at `published` goes straight to live.
*/
import type { Field } from 'payload';

export const statusField: Field = {
  name: 'status',
  type: 'select',
  required: true,
  defaultValue: 'draft',
  index: true,
  options: [
    { label: 'Draft', value: 'draft' },
    { label: 'In review', value: 'in_review' },
    { label: 'Published', value: 'published' },
  ],
  admin: {
    position: 'sidebar',
    description: 'Editors may submit for review. Only admins can publish.',
  },
  validate: (value: unknown, options: any) => {
    const user = options?.req?.user;
    if (value === 'published' && user && user.role !== 'admin') {
      return 'Only admins can publish. Choose "In review" to submit this for approval.';
    }
    return true;
  },
};
