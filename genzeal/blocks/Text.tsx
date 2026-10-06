export type TextProps = { heading: string; body: string; tone: "white" | "cream" };

export function Text({ heading, body, tone }: TextProps) {
  const paragraphs = (body ?? "")
    .split(/\n\s*\n/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);

  return (
    <section className={`py-section ${tone === "cream" ? "bg-cream" : "bg-white"}`}>
      <div className="mx-auto max-w-copy px-gutter">
        {heading ? <h2 className="font-display text-display-md font-semibold">{heading}</h2> : null}
        <div className={`space-y-4 ${heading ? "mt-5" : ""}`}>
          {paragraphs.map((paragraph, index) => (
            <p key={index} className="text-body whitespace-pre-line text-ink-700">
              {paragraph}
            </p>
          ))}
        </div>
      </div>
    </section>
  );
}
