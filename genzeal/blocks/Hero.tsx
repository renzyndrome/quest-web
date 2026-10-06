export type HeroProps = { title: string; subtitle: string; image: string; alt: string };

export function Hero({ title, subtitle, image, alt }: HeroProps) {
  return (
    <section className={`relative flex min-h-[60svh] items-end overflow-hidden ${image ? "" : "bg-maroon-deep"}`}>
      {image ? (
        <>
          <img src={image} alt={alt} fetchPriority="high" className="absolute inset-0 h-full w-full object-cover" />
          <div aria-hidden="true" className="absolute inset-0 bg-linear-to-t from-ink/80 via-maroon-deep/50 to-maroon-deep/20" />
        </>
      ) : null}
      <div className="relative mx-auto w-full max-w-content px-gutter py-section">
        {title ? <h1 className="max-w-copy font-display text-display-lg font-semibold text-white">{title}</h1> : null}
        {subtitle ? <p className="mt-4 max-w-copy text-body-lg text-white/85">{subtitle}</p> : null}
      </div>
    </section>
  );
}
