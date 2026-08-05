/*
  Submit → notify. Replaces the Directus "Notify approver on submit" Flow.

  Emails the approver the moment an item enters in_review so a submission
  never sits unnoticed. Uses the Resend REST API directly (no SDK dependency),
  matching the pattern already used by the site's prayer/question endpoints.

  No-ops unless RESEND_API_KEY + APPROVER_EMAIL + APPROVER_FROM_EMAIL are set.
*/
import type { CollectionAfterChangeHook } from 'payload';

export const notifyApprover: CollectionAfterChangeHook = async ({ doc, previousDoc, req }) => {
  const apiKey = process.env.RESEND_API_KEY;
  const to = process.env.APPROVER_EMAIL;
  const from = process.env.APPROVER_FROM_EMAIL;

  const entered = doc?.status === 'in_review' && previousDoc?.status !== 'in_review';
  if (!entered || !apiKey || !to || !from) return doc;

  const title = doc?.title ?? doc?.name ?? doc?.slug ?? 'Untitled';
  const siteUrl = process.env.SITE_URL ?? 'https://questlaguna.org';
  const previewPath = doc?.slug ? `${siteUrl}/news/preview/${doc.slug}?token=<PREVIEW_SECRET>` : '';

  try {
    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from,
        to: [to],
        subject: `Submitted for approval: ${title}`,
        html: `
          <p><strong>${title}</strong> was submitted for approval.</p>
          ${previewPath ? `<p>Preview: <a href="${previewPath}">${previewPath}</a></p>` : ''}
          <p>To approve, open it in the CMS and set status to <strong>Published</strong>.</p>
        `,
      }),
    });
    req.payload.logger.info(`[notify] approval requested for ${doc?.slug ?? doc?.id}`);
  } catch (error) {
    // Never fail the editor's submit because email is down.
    req.payload.logger.error(`[notify] email failed: ${(error as Error).message}`);
  }
  return doc;
};
