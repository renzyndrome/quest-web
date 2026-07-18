/*
  Prayer request handling — validation + email delivery to the prayer team.

  Privacy (see .claude/rules/content.md): request contents are emailed to the
  prayer team only and never stored or logged. Confidential requests carry a
  marker so the team routes them to the prayer team alone.

  Secrets are read from process.env at RUNTIME (node adapter), never via
  import.meta.env, so they are not baked into the build artifact.
*/

export interface PrayerInput {
  name?: string;
  location?: string;
  request?: string;
  confidential?: boolean;
  /** Honeypot — must be empty. Bots fill it. */
  website?: string;
}

export interface ValidationResult {
  ok: boolean;
  error?: string;
  /** Honeypot tripped — treat as success to the client, but send nothing. */
  spam?: boolean;
  clean?: {
    name: string;
    location: string;
    request: string;
    confidential: boolean;
  };
}

const MAX_NAME = 120;
const MAX_LOCATION = 120;
const MAX_REQUEST = 5000;
const MIN_REQUEST = 2;

// Shared by the question form (src/lib/question.ts) — same boundary hygiene.
export const asString = (value: unknown): string => (typeof value === 'string' ? value : '');
// Collapse control chars + runs of whitespace to a single space. Used for
// single-line fields (name, location) that flow into the email subject/meta;
// the multi-line request body is preserved as-is.
export const collapse = (value: string): string =>
  value
    .replace(/[\x00-\x1f\x7f]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

// Accepts unknown — the body is untrusted external input (validate at the
// boundary). Non-object input is treated as empty and fails the request check.
export function validatePrayer(raw: unknown): ValidationResult {
  const input = (typeof raw === 'object' && raw !== null ? raw : {}) as PrayerInput;

  if (asString(input.website).trim() !== '') {
    return { ok: false, spam: true };
  }

  const request = asString(input.request).trim();
  if (request.length < MIN_REQUEST) {
    return { ok: false, error: 'Please write your prayer request.' };
  }
  if (request.length > MAX_REQUEST) {
    return { ok: false, error: 'That request is too long. Please shorten it.' };
  }

  const name = collapse(asString(input.name)).slice(0, MAX_NAME);
  const location = collapse(asString(input.location)).slice(0, MAX_LOCATION);

  return {
    ok: true,
    clean: {
      name,
      location,
      request,
      confidential: Boolean(input.confidential),
    },
  };
}

export interface EmailConfig {
  apiKey: string;
  to: string;
  from: string;
}

/** Reads email config from runtime env, or null if not configured. */
export function readEmailConfig(): EmailConfig | null {
  const apiKey = process.env.RESEND_API_KEY;
  const to = process.env.PRAYER_TEAM_EMAIL;
  const from = process.env.PRAYER_FROM_EMAIL;
  if (!apiKey || !to || !from) return null;
  return { apiKey, to, from };
}

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/** Sends the prayer request via Resend's REST API (no SDK dependency). */
export async function sendPrayerEmail(
  config: EmailConfig,
  data: NonNullable<ValidationResult['clean']>,
): Promise<{ ok: boolean }> {
  const confidentialTag = data.confidential ? '[Confidential] ' : '';
  const subject = `${confidentialTag}Prayer request${data.name ? ` from ${data.name}` : ''}`;

  const rows = [
    ['Name', data.name || '(not given)'],
    ['Location', data.location || '(not given)'],
    ['Confidential', data.confidential ? 'Yes — prayer team only' : 'No'],
  ];
  const html = `
    <h2 style="font-family:sans-serif">Prayer request</h2>
    <table style="font-family:sans-serif;font-size:14px">
      ${rows.map(([k, v]) => `<tr><td style="padding:4px 12px 4px 0;color:#666">${k}</td><td>${escapeHtml(v)}</td></tr>`).join('')}
    </table>
    <p style="font-family:sans-serif;white-space:pre-wrap;margin-top:16px">${escapeHtml(data.request)}</p>
  `;

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${config.apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ from: config.from, to: [config.to], subject, html }),
  });

  return { ok: res.ok };
}

/*
  Best-effort in-memory rate limit. Per-process (resets on redeploy) and
  per-instance, which is fine for a single-node church site. No IPs or
  contents are persisted.
*/
const HITS = new Map<string, number[]>();
const WINDOW_MS = 10 * 60 * 1000;
const MAX_HITS = 5;

export function rateLimited(key: string, now: number): boolean {
  // Opportunistic eviction: when the map grows large, drop keys whose whole
  // window has expired, so a stream of distinct keys can't leak memory.
  // Size-gated so the O(n) sweep stays off the hot path.
  if (HITS.size > 10000) {
    for (const [k, times] of HITS) {
      if (times.every((t) => now - t >= WINDOW_MS)) HITS.delete(k);
    }
  }
  const recent = (HITS.get(key) ?? []).filter((t) => now - t < WINDOW_MS);
  recent.push(now);
  HITS.set(key, recent);
  return recent.length > MAX_HITS;
}
