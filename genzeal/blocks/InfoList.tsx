export type InfoListProps = { heading: string; items: { label: string; value: string }[] };

export function InfoList({ heading, items }: InfoListProps) {
  const rows = (items ?? []).filter((item) => item.label || item.value);
  return (
    <section className="px-gutter py-8">
      <div className="mx-auto max-w-copy rounded-card border border-cream-200 bg-cream p-6">
        {heading ? <h2 className="font-display text-title font-semibold">{heading}</h2> : null}
        {rows.length > 0 ? (
          <dl className={`divide-y divide-cream-200 ${heading ? "mt-4" : ""}`}>
            {rows.map((item, index) => (
              <div key={index} className="grid gap-1 py-3 sm:grid-cols-[10rem_1fr] sm:gap-4">
                <dt className="font-semibold">{item.label}</dt>
                <dd className="text-ink-700">{item.value}</dd>
              </div>
            ))}
          </dl>
        ) : null}
      </div>
    </section>
  );
}
