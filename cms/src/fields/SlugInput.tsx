'use client';
/*
  The slug box in the sidebar, filled in as the title is typed.

  The server hook in slugField.ts is still what guarantees a slug exists and
  is unique — this only removes the moment where an admin stares at an empty
  box and assumes it is a question being asked of them. It mirrors the source
  field live, and stops the moment the box is typed in by hand.

  Two rules it must not break:
    1. An item that already exists keeps its address. The old URL is public
       already, so `id` being set means: never touch this.
    2. A slug typed by hand wins. Clearing the box back to empty resumes the
       mirroring, which is the only way back from a typo.
*/
import React, { useEffect, useRef } from 'react';
import { TextField, useDocumentInfo, useField, useFormFields } from '@payloadcms/ui';

import { slugify } from './slugify';

type SlugInputProps = React.ComponentProps<typeof TextField> & {
  /** Field names to derive from, in preference order (see slugField). */
  readonly sources?: readonly string[];
};

export function SlugInput({ sources = ['title'], ...props }: SlugInputProps) {
  const { id } = useDocumentInfo();
  const { setValue, value } = useField<string>({ path: props.path });

  /*
    Returns a STRING, not an array. useFormFields re-runs on every keystroke
    anywhere in the form, and a fresh array each time would change identity
    on every one of them and re-fire the effect below.
  */
  const derived = useFormFields(([fields]) => {
    for (const name of sources) {
      const candidate = fields?.[name]?.value;
      if (typeof candidate === 'string' && candidate.trim()) return slugify(candidate);
    }
    return '';
  });

  const typedByHand = useRef(false);
  const lastMirrored = useRef('');

  // Declared first so it reads the value as it was BEFORE this pass mirrors.
  useEffect(() => {
    if (value !== lastMirrored.current) {
      // Cleared back to empty is a request to go back to automatic.
      typedByHand.current = Boolean(value);
    }
  }, [value]);

  useEffect(() => {
    if (id) return;
    if (typedByHand.current) return;
    if (derived === lastMirrored.current) return;
    lastMirrored.current = derived;
    setValue(derived);
  }, [derived, id, setValue]);

  return <TextField {...props} />;
}
