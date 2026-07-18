/*
  General question handling — validation + email delivery to the church admin
  inbox. Separate from prayer (src/lib/prayer.ts) because questions are NOT
  prayer requests: they go to the admin/office inbox, not the prayer team, and
  carry no confidential-request semantics.

  Reuses the prayer module's boundary helpers (asString, collapse, escapeHtml)
  and its in-memory rate limiter so both public forms share one IP budget.

  Secrets are read from process.env at RUNTIME (node adapter), never via
  import.meta.env, so they are not baked into the build artifact.
*/

import { asString, collapse, escapeHtml } from './prayer';

export interface QuestionInput {
  name?: string;
  contact?: string;
  topic?: string;
  question?: string;
  /** Honeypot — must be empty. Bots fill it. */
  website?: string;
}

// Fixed topic list (structured field, not free text — see content rules).
// Kept in sync with the <select> in src/pages/connect.astro.
export const QUESTION_TOPICS = [
  'General',
  'Visiting / New here',
  'Serving & ministries',
  'Giving',
  'Membership & baptism',
] as const;

export type QuestionTopic = (typeof QUESTION_TOPICS)[number];

export interface QuestionValidation {
  ok: boolean;
  error?: string;
  /** Honeypot tripped — treat as success to the client, but send nothing. */
  spam?: boolean;
  clean?: {
    name: string;
    contact: string;
    topic: QuestionTopic;
    question: string;
  };
}

const MAX_NAME = 120;
const MAX_CONTACT = 160;
const MAX_QUESTION = 5000;
const MIN_QUESTION = 2;

function normalizeTopic(value: unknown): QuestionTopic {
  const topic = collapse(asString(value));
  return (QUESTION_TOPICS as readonly string[]).includes(topic)
    ? (topic as QuestionTopic)
    : 'General';
}

// Accepts unknown — the body is untrusted external input (validate at the
// boundary). Non-object input is treated as empty and fails the question check.
export function validateQuestion(raw: unknown): QuestionValidation {
  const input = (typeof raw === 'object' && raw !== null ? raw : {}) as QuestionInput;

  if (asString(input.website).trim() !== '') {
    return { ok: false, spam: true };
  }

  const question = asString(input.question).trim();
  if (question.length < MIN_QUESTION) {
    return { ok: false, error: 'Please write your question.' };
  }
  if (question.length > MAX_QUESTION) {
    return { ok: false, error: 'That question is too long. Please shorten it.' };
  }

  const name = collapse(asString(input.name)).slice(0, MAX_NAME);
  const contact = collapse(asString(input.contact)).slice(0, MAX_CONTACT);

  return {
    ok: true,
    clean: {
      name,
      contact,
      topic: normalizeTopic(input.topic),
      question,
    },
  };
}

export interface QuestionEmailConfig {
  apiKey: string;
  to: string;
  from: string;
}

/** Reads question-email config from runtime env, or null if not configured. */
export function readQuestionEmailConfig(): QuestionEmailConfig | null {
  const apiKey = process.env.RESEND_API_KEY;
  const to = process.env.QUESTION_TEAM_EMAIL;
  const from = process.env.QUESTION_FROM_EMAIL;
  if (!apiKey || !to || !from) return null;
  return { apiKey, to, from };
}

/** Sends the question via Resend's REST API (no SDK dependency). */
export async function sendQuestionEmail(
  config: QuestionEmailConfig,
  data: NonNullable<QuestionValidation['clean']>,
): Promise<{ ok: boolean }> {
  const subject = `[${data.topic}] Question${data.name ? ` from ${data.name}` : ''}`;

  const rows = [
    ['Name', data.name || '(not given)'],
    ['Contact', data.contact || '(not given)'],
    ['Topic', data.topic],
  ];
  const html = `
    <h2 style="font-family:sans-serif">Question from the website</h2>
    <table style="font-family:sans-serif;font-size:14px">
      ${rows.map(([k, v]) => `<tr><td style="padding:4px 12px 4px 0;color:#666">${k}</td><td>${escapeHtml(v)}</td></tr>`).join('')}
    </table>
    <p style="font-family:sans-serif;white-space:pre-wrap;margin-top:16px">${escapeHtml(data.question)}</p>
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
