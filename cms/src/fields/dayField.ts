/*
  A date field that asks for a day and nothing else.

  Payload's `date` type defaults to a day AND time picker. None of our dates
  carry a time: an announcement has a publish day, an event keeps its clock
  time in a separate `time` field, and a testimony is dated to the day. The
  extra picker therefore asked editors a question with no right answer, and on
  events it sat next to the real time field looking like a second one.

  `displayFormat` also drops the ISO look. "6 Sep 2026" is what a church
  volunteer reads without translating.
*/
import type { Field } from 'payload';

interface DayFieldOptions {
  /** Shown under the field. Say what the date means, not what a date is. */
  description?: string;
  /** Prefill with today. Right for news, wrong for events, which are future. */
  defaultToToday?: boolean;
  /** Events filter and sort on this column. */
  index?: boolean;
}

export const dayField = (
  name: string,
  { description, defaultToToday = false, index = false }: DayFieldOptions = {},
): Field => ({
  name,
  type: 'date',
  required: true,
  index,
  ...(defaultToToday ? { defaultValue: () => new Date().toISOString() } : {}),
  admin: {
    date: { pickerAppearance: 'dayOnly', displayFormat: 'd MMM yyyy' },
    ...(description ? { description } : {}),
  },
});
