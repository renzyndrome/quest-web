"use client";

import { useState, type FormEvent } from "react";

export function NewPageForm() {
  const [value, setValue] = useState("");

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const slug = value
      .toLowerCase()
      .replace(/[^a-z0-9\-/]/g, "")
      .replace(/\/{2,}/g, "/")
      .replace(/^\/+|\/+$/g, "");
    if (!slug) return;
    window.location.assign(`/${slug}/edit`);
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3 sm:flex-row sm:items-end">
      <label className="flex flex-1 flex-col gap-1">
        <span className="text-small font-semibold">Page address</span>
        <input
          type="text"
          value={value}
          onChange={(event) => setValue(event.target.value)}
          placeholder="camp-2026"
          className="min-h-11 rounded-btn border border-cream-200 bg-white px-4 text-body outline-none transition-colors duration-200 focus:border-ink"
        />
      </label>
      <button
        type="submit"
        className="inline-flex min-h-11 items-center justify-center rounded-btn bg-brand px-6 font-display font-semibold text-white transition-colors duration-200 hover:bg-brand-press"
      >
        Open editor
      </button>
    </form>
  );
}
