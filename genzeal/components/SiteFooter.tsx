export function SiteFooter() {
  return (
    <footer className="border-t border-cream-200 bg-cream">
      <div className="mx-auto flex max-w-content flex-col gap-2 px-gutter py-8 text-small text-ink-700 sm:flex-row sm:items-center sm:justify-between">
        <p>GenZeal is the youth gathering of Quest Laguna Church.</p>
        <a
          href="https://questlaguna.org/services"
          className="inline-flex min-h-11 items-center font-semibold text-ink transition-colors duration-200 hover:text-brand"
        >
          questlaguna.org/services
        </a>
      </div>
    </footer>
  );
}
