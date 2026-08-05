/*
  Publish → deploy. Replaces the Directus "Deploy on publish" Flow.

  Content bakes into static pages at build time, so anything that changes a
  published item must trigger a site rebuild. Fires when the resulting doc is
  published — on create (an admin publishing directly) and on update (approval,
  or an edit to already-live content).

  No-ops when DOKPLOY_DEPLOY_URL is unset, which keeps local dev and the e2e
  run silent.
*/
import type { CollectionAfterChangeHook } from 'payload';

export const deployWebhook: CollectionAfterChangeHook = async ({ doc, previousDoc, req }) => {
  const url = process.env.DOKPLOY_DEPLOY_URL;
  if (!url || doc?.status !== 'published') return doc;

  // Skip no-op saves that neither published nor changed a published doc.
  const wasPublished = previousDoc?.status === 'published';
  const changed = !previousDoc || previousDoc.updatedAt !== doc.updatedAt;
  if (wasPublished && !changed) return doc;

  try {
    await fetch(url, { method: 'POST' });
    req.payload.logger.info(`[deploy] triggered rebuild for ${doc?.slug ?? doc?.id}`);
  } catch (error) {
    // Never fail the editor's save because the deploy hook is unreachable.
    req.payload.logger.error(`[deploy] webhook failed: ${(error as Error).message}`);
  }
  return doc;
};
