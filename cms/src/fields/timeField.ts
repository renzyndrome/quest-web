/*
  The event start time.

  Stored as 24-hour "HH:MM", because that is what the site's formatEventTime()
  in src/lib/events.ts parses. That storage format is NOT what a church
  volunteer thinks in: the old help text asked them to convert 5 PM to 17:00
  by hand, which is a conversion the machine can do and the person can get
  wrong.

  So the field now accepts what people actually type — "5pm", "5:00 PM",
  "17:00" — and normalises it before it is saved. The stored value and the
  site contract are unchanged.
*/
import type { Field } from 'payload';

/** "5pm" | "5:00 PM" | "17:00" → "17:00". Returns null when unparseable. */
export function normaliseTime(input: string): string | null {
  const match = input.trim().toLowerCase().match(/^(\d{1,2})(?::(\d{2}))?\s*(am|pm)?$/);
  if (!match) return null;

  let hours = Number(match[1]);
  const minutes = Number(match[2] ?? '0');
  const meridiem = match[3];

  if (minutes > 59) return null;

  if (meridiem) {
    // 12 AM is midnight, 12 PM is noon — the two the naive formula gets wrong.
    if (hours < 1 || hours > 12) return null;
    if (meridiem === 'am') hours = hours === 12 ? 0 : hours;
    else hours = hours === 12 ? 12 : hours + 12;
  } else if (hours > 23) {
    return null;
  }

  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
}

export const timeField: Field = {
  name: 'time',
  type: 'text',
  label: 'Start time',
  admin: {
    placeholder: '5:00 PM',
    description: 'Type it any way: 5pm, 5:00 PM, or 17:00. Leave blank if there is no set time.',
  },
  hooks: {
    beforeValidate: [
      ({ value }) => {
        if (typeof value !== 'string' || value.trim() === '') return undefined;
        // Leave an unparseable value alone so validate below can name it.
        return normaliseTime(value) ?? value;
      },
    ],
  },
  validate: (value: unknown) => {
    if (typeof value !== 'string' || value.trim() === '') return true;
    if (normaliseTime(value) === null) {
      return 'That is not a time. Try 5:00 PM, 5pm or 17:00.';
    }
    return true;
  },
};
