import Link from "next/link";

export function SiteHeader() {
  return (
    <header className="border-b border-cream-200 bg-white">
      <div className="mx-auto flex min-h-16 max-w-content items-center justify-between gap-4 px-gutter">
        <Link
          href="/"
          className="inline-flex min-h-11 items-center font-display text-title font-semibold text-ink transition-colors duration-200 hover:text-brand"
        >
          GenZeal
        </Link>
        <a
          href="https://questlaguna.org"
          className="inline-flex min-h-11 items-center text-small font-semibold text-ink-700 transition-colors duration-200 hover:text-brand"
        >
          Quest Laguna
        </a>
      </div>
    </header>
  );
}
