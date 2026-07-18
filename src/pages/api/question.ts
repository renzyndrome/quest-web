import type { APIRoute } from 'astro';
import { rateLimited } from '../../lib/prayer';
import {
  validateQuestion,
  readQuestionEmailConfig,
  sendQuestionEmail,
  type QuestionInput,
} from '../../lib/question';

// On-demand endpoint (the reason the node adapter exists). Never prerendered.
export const prerender = false;

// Questions are tiny (name + contact + <=5000-char question). Cap the body
// BEFORE parsing so a giant payload can't buffer into memory ahead of the rate
// limiter (parse-first DoS). Bounds memory regardless of Content-Length.
const MAX_BODY_BYTES = 16 * 1024;

function json(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

/** Reads the body up to `max` bytes; returns null if it exceeds the cap. */
async function readBodyCapped(request: Request, max: number): Promise<string | null> {
  const declared = request.headers.get('content-length');
  if (declared && Number(declared) > max) return null;
  if (!request.body) return '';

  const reader = request.body.getReader();
  const decoder = new TextDecoder();
  let text = '';
  let total = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    if (!value) continue;
    total += value.byteLength;
    if (total > max) {
      await reader.cancel();
      return null;
    }
    text += decoder.decode(value, { stream: true });
  }
  text += decoder.decode();
  return text;
}

export const POST: APIRoute = async ({ request, clientAddress }) => {
  const raw = await readBodyCapped(request, MAX_BODY_BYTES);
  if (raw === null) {
    return json({ ok: false, error: 'Request too large.' }, 413);
  }

  let input: QuestionInput;
  try {
    input = JSON.parse(raw) as QuestionInput;
  } catch {
    return json({ ok: false, error: 'Invalid request.' }, 400);
  }

  const result = validateQuestion(input);

  // Honeypot tripped: look successful to the bot, send nothing.
  if (result.spam) return json({ ok: true }, 200);
  if (!result.ok || !result.clean) {
    return json({ ok: false, error: result.error ?? 'Invalid request.' }, 400);
  }

  const ip = clientAddress || 'unknown';
  if (rateLimited(ip, Date.now())) {
    return json({ ok: false, error: 'Please wait a few minutes before sending again.' }, 429);
  }

  const config = readQuestionEmailConfig();
  // Not configured → tell the client to fall back to the Messenger handoff.
  if (!config) return json({ ok: false, error: 'not_configured' }, 503);

  try {
    const sent = await sendQuestionEmail(config, result.clean);
    if (!sent.ok) return json({ ok: false, error: 'send_failed' }, 502);
    return json({ ok: true }, 200);
  } catch {
    return json({ ok: false, error: 'send_failed' }, 502);
  }
};

// Anything other than POST.
export const ALL: APIRoute = () => json({ ok: false, error: 'Method not allowed.' }, 405);
