/*
  Draft-preview auth. The preview route (src/pages/news/preview/[slug].astro)
  is the only way to view an unpublished announcement, so it is gated by a
  shared secret set as a RUNTIME env var (not baked into the build).

  Preview is disabled entirely when PREVIEW_SECRET is unset.
*/
import { createHash, timingSafeEqual } from 'node:crypto';

/** The configured preview secret, or null when preview is disabled. */
export function readPreviewSecret(): string | null {
  const secret = process.env.PREVIEW_SECRET;
  return secret && secret.length > 0 ? secret : null;
}

/**
 * Constant-time token check. Both sides are SHA-256 hashed first so
 * timingSafeEqual always compares equal-length (32-byte) buffers and the
 * comparison leaks neither length nor content of the secret.
 */
export function tokenMatches(provided: string, secret: string): boolean {
  const a = createHash('sha256').update(provided).digest();
  const b = createHash('sha256').update(secret).digest();
  return timingSafeEqual(a, b);
}

/**
 * Human-readable marker for the preview banner, so the approving admin can see
 * at a glance whether an item is still a draft or has been submitted for
 * approval. Anything that is not 'in_review' is treated as a plain draft.
 */
export function previewStatusLabel(status?: string): string {
  return status === 'in_review'
    ? 'In review — awaiting approval'
    : 'Draft — not published';
}
