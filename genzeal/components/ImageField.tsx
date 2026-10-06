"use client";

import { useState, type ChangeEvent } from "react";
import { FieldLabel, type CustomFieldRender } from "@puckeditor/core";

type ImageFieldProps = Parameters<CustomFieldRender<string>>[0];

const UPLOAD_FAILED = "Upload failed. Use a JPG, PNG or WebP under 10 MB.";

export function ImageField({ field, id, value, onChange, readOnly }: ImageFieldProps) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function handleFile(event: ChangeEvent<HTMLInputElement>) {
    const input = event.currentTarget;
    const file = input.files?.[0];
    if (!file) return;
    setBusy(true);
    setError("");
    try {
      const body = new FormData();
      body.append("file", file);
      const response = await fetch("/api/upload", { method: "POST", body });
      const json = (await response.json().catch(() => null)) as { src?: string } | null;
      if (!response.ok || !json?.src) throw new Error(`Upload failed with status ${response.status}`);
      onChange(json.src);
    } catch (uploadError) {
      console.error(uploadError);
      setError(UPLOAD_FAILED);
    } finally {
      setBusy(false);
      input.value = "";
    }
  }

  return (
    <FieldLabel label={field.label ?? "Photo"} el="div" readOnly={readOnly}>
      <div className="flex flex-col gap-2">
        {value ? <img src={value} alt="" className="h-auto w-full rounded-media border border-cream-200" /> : null}
        <input
          id={id}
          type="file"
          accept="image/*"
          disabled={busy || readOnly}
          onChange={handleFile}
          className="text-small"
        />
        {busy ? <p className="text-small text-ink-500">Uploading…</p> : null}
        {error ? (
          <p role="alert" className="text-small text-brand">
            {error}
          </p>
        ) : null}
        {value && !busy && !readOnly ? (
          <button
            type="button"
            onClick={() => onChange("")}
            className="self-start text-small font-semibold text-ink-700 underline transition-colors duration-200 hover:text-brand"
          >
            Remove
          </button>
        ) : null}
      </div>
    </FieldLabel>
  );
}
