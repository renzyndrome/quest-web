/*
  Idempotent bootstrap for the editorial approval workflow (see cms/WORKFLOW.md).

  Creates, and is safe to re-run to reconcile:
    - a "Content Editor" role + policy that can set status draft/in_review but
      NEVER published (payload validation blocks it),
    - a "Content Approver" role + policy that can publish directly (no such
      validation) — the same power the built-in Administrator already has, so
      an admin who creates an item at status=published goes straight to live,
    - a Flow that emails the approver when an item enters in_review   (needs APPROVER_EMAIL),
    - a Flow that calls the Dokploy deploy hook when an item is published (needs DOKPLOY_DEPLOY_URL).

  The status field values (draft/in_review/published) are a manual one-time
  step in the admin — see cms/WORKFLOW.md §1.

  Run:
    DIRECTUS_URL=... DIRECTUS_ADMIN_TOKEN=... \
    APPROVER_EMAIL=... DOKPLOY_DEPLOY_URL=... \
    npm run cms:setup

  Requires a STATIC ADMIN token (Directus user settings → Token). Never commit it.
*/
import {
  createDirectus,
  rest,
  staticToken,
  readRoles,
  createRole,
  readRole,
  updateRole,
  createPolicy,
  readPermissions,
  createPermission,
  updatePermission,
  readFlows,
  createFlow,
  createOperation,
  updateFlow,
} from '@directus/sdk';

// ── Config ────────────────────────────────────────────────────────────────
const COLLECTIONS = ['announcements', 'events'];
const EDITOR_VALIDATION = { status: { _in: ['draft', 'in_review'] } };

const URL = requiredEnv('DIRECTUS_URL');
const ADMIN_TOKEN = requiredEnv('DIRECTUS_ADMIN_TOKEN');
const APPROVER_EMAIL = process.env.APPROVER_EMAIL ?? '';
const DEPLOY_URL = process.env.DOKPLOY_DEPLOY_URL ?? '';
const SITE_URL = process.env.SITE_URL ?? 'https://questlaguna.org';

function requiredEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    console.error(`✗ Missing required env ${name}. See the header of this file.`);
    process.exit(1);
  }
  return value;
}

const client = createDirectus(URL).with(staticToken(ADMIN_TOKEN)).with(rest());
const log = (msg: string) => console.log(msg);

// ── Roles ───────────────────────────────────────────────────────────────
async function ensureRole(name: string, icon: string): Promise<string> {
  const existing = await client.request(readRoles({ filter: { name: { _eq: name } }, limit: 1 }));
  if (existing.length > 0) {
    log(`· role "${name}" exists`);
    return existing[0].id;
  }
  const role = await client.request(createRole({ name, icon }));
  log(`✓ created role "${name}"`);
  return role.id;
}

// ── Policies (looked up via the role's access links) ──────────────────────
// The SDK has no list-policies reader, so we find a policy by reading the
// role's linked policies. New policies are linked to the role in the same step.
async function ensurePolicyForRole(
  roleId: string,
  policyName: string,
  opts: { adminAccess: boolean },
): Promise<string> {
  const role: any = await client.request(
    readRole(roleId, { fields: ['id', 'policies.policy.id', 'policies.policy.name'] as any }),
  );
  const linked = (role.policies ?? []).find((p: any) => p.policy?.name === policyName);
  if (linked) {
    log(`· policy "${policyName}" linked to role`);
    return linked.policy.id;
  }

  const policy: any = await client.request(
    createPolicy({
      name: policyName,
      icon: 'policy',
      app_access: true,
      admin_access: opts.adminAccess,
      enforce_tfa: false,
    }),
  );
  // Attach the policy to the role via the directus_access junction (nested o2m
  // create — the SDK exposes no direct createAccess).
  await client.request(
    updateRole(roleId, {
      policies: { create: [{ policy: policy.id }], update: [], delete: [] } as any,
    }),
  );
  log(`✓ created policy "${policyName}" and linked it to the role`);
  return policy.id;
}

// ── Permissions ───────────────────────────────────────────────────────────
async function ensurePermission(
  policyId: string,
  collection: string,
  action: 'create' | 'read' | 'update' | 'delete',
  validation: Record<string, unknown> | null,
): Promise<void> {
  const existing = await client.request(
    readPermissions({
      filter: { policy: { _eq: policyId }, collection: { _eq: collection }, action: { _eq: action } },
      limit: 1,
    }),
  );
  const payload = {
    policy: policyId,
    collection,
    action,
    permissions: {}, // row filter: all items
    validation, // payload validation: the publish guard for editors
    fields: ['*'],
    presets: null,
  };
  if (existing.length > 0) {
    await client.request(updatePermission(existing[0].id, payload as any));
    log(`  · ${collection}.${action} permission reconciled`);
    return;
  }
  await client.request(createPermission(payload as any));
  log(`  ✓ ${collection}.${action} permission created`);
}

// ── Flows (created whole, skipped if a flow of the same name exists) ──────
async function flowExists(name: string): Promise<boolean> {
  const found = await client.request(readFlows({ filter: { name: { _eq: name } }, limit: 1 }));
  return found.length > 0;
}

async function ensureNotifyFlow(): Promise<void> {
  const name = 'Notify approver on submit';
  if (!APPROVER_EMAIL) {
    log(`⚠ skipping "${name}" — set APPROVER_EMAIL to enable it`);
    return;
  }
  if (await flowExists(name)) {
    log(`· flow "${name}" exists`);
    return;
  }
  const flow: any = await client.request(
    createFlow({
      name,
      icon: 'rate_review',
      color: '#E8B11F',
      status: 'active',
      trigger: 'event',
      accountability: 'all',
      options: {
        type: 'action',
        scope: ['items.create', 'items.update'],
        collections: COLLECTIONS,
      },
    }),
  );
  // Email operation (runs when the condition resolves).
  const mail: any = await client.request(
    createOperation({
      flow: flow.id,
      key: 'email_approver',
      type: 'mail',
      name: 'Email approver',
      position_x: 37,
      position_y: 1,
      options: {
        to: [APPROVER_EMAIL],
        type: 'markdown',
        subject: 'Content submitted for approval: {{$trigger.payload.title}}{{$trigger.payload.name}}',
        body: `An item was submitted for review.\n\nPreview: ${SITE_URL}/news/preview/{{$trigger.payload.slug}}?token=YOUR_PREVIEW_SECRET\n\nApprove in Directus by setting status to **published**.`,
      },
    }),
  );
  // Condition: only continue when the new status is in_review.
  const condition: any = await client.request(
    createOperation({
      flow: flow.id,
      key: 'is_in_review',
      type: 'condition',
      name: 'Only in_review',
      position_x: 19,
      position_y: 1,
      options: { filter: { $trigger: { payload: { status: { _eq: 'in_review' } } } } },
      resolve: mail.id,
    }),
  );
  await client.request(updateFlow(flow.id, { operation: condition.id }));
  log(`✓ created flow "${name}"`);
}

async function ensureDeployFlow(): Promise<void> {
  const name = 'Deploy on publish';
  if (!DEPLOY_URL) {
    log(`⚠ skipping "${name}" — set DOKPLOY_DEPLOY_URL to enable it`);
    return;
  }
  if (await flowExists(name)) {
    log(`· flow "${name}" exists`);
    return;
  }
  const flow: any = await client.request(
    createFlow({
      name,
      icon: 'rocket_launch',
      color: '#D81E2F',
      status: 'active',
      trigger: 'event',
      accountability: 'all',
      options: {
        type: 'action',
        scope: ['items.create', 'items.update'],
        collections: COLLECTIONS,
      },
    }),
  );
  const request: any = await client.request(
    createOperation({
      flow: flow.id,
      key: 'call_deploy_hook',
      type: 'request',
      name: 'Call Dokploy deploy hook',
      position_x: 37,
      position_y: 1,
      options: { url: DEPLOY_URL, method: 'POST' },
    }),
  );
  // Fires for create OR update whose new status is published — so an admin who
  // creates an item already at status=published deploys straight to live.
  const condition: any = await client.request(
    createOperation({
      flow: flow.id,
      key: 'is_published',
      type: 'condition',
      name: 'Only published',
      position_x: 19,
      position_y: 1,
      options: { filter: { $trigger: { payload: { status: { _eq: 'published' } } } } },
      resolve: request.id,
    }),
  );
  await client.request(updateFlow(flow.id, { operation: condition.id }));
  log(`✓ created flow "${name}"`);
}

// ── Main ──────────────────────────────────────────────────────────────────
async function main(): Promise<void> {
  log(`\nBootstrapping approval workflow on ${URL}\n`);

  // Editor: writes, cannot publish.
  const editorRole = await ensureRole('Content Editor', 'edit_note');
  const editorPolicy = await ensurePolicyForRole(editorRole, 'Content Editor Policy', {
    adminAccess: false,
  });
  for (const collection of COLLECTIONS) {
    await ensurePermission(editorPolicy, collection, 'create', EDITOR_VALIDATION);
    await ensurePermission(editorPolicy, collection, 'read', null);
    await ensurePermission(editorPolicy, collection, 'update', EDITOR_VALIDATION);
  }
  await ensurePermission(editorPolicy, 'directus_files', 'read', null);
  await ensurePermission(editorPolicy, 'directus_files', 'create', null); // upload banners

  // Approver: publishes directly (no status validation).
  const approverRole = await ensureRole('Content Approver', 'verified');
  const approverPolicy = await ensurePolicyForRole(approverRole, 'Content Approver Policy', {
    adminAccess: false,
  });
  for (const collection of COLLECTIONS) {
    await ensurePermission(approverPolicy, collection, 'create', null);
    await ensurePermission(approverPolicy, collection, 'read', null);
    await ensurePermission(approverPolicy, collection, 'update', null);
    await ensurePermission(approverPolicy, collection, 'delete', null);
  }
  await ensurePermission(approverPolicy, 'directus_files', 'read', null);
  await ensurePermission(approverPolicy, 'directus_files', 'create', null);

  await ensureNotifyFlow();
  await ensureDeployFlow();

  log(`\nDone. Assign users to "Content Editor" or "Content Approver" in Directus.\n`);
}

main().catch((error) => {
  console.error('\n✗ Setup failed:', error?.message ?? error);
  process.exit(1);
});
