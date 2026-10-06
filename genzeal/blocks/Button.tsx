export type ButtonProps = { label: string; href: string; style: "primary" | "secondary" };

const BASE =
  "inline-flex min-h-11 items-center rounded-btn px-6 font-display font-semibold transition-colors duration-200";
const STYLES = {
  primary: "bg-brand text-white hover:bg-brand-press",
  secondary: "border border-ink text-ink hover:bg-cream",
} as const;

export function Button({ label, href, style }: ButtonProps) {
  const className = `${BASE} ${STYLES[style] ?? STYLES.primary}`;
  return (
    <div className="flex justify-center px-gutter py-6">
      {href ? (
        <a href={href} className={className}>
          {label}
        </a>
      ) : (
        <span className={className}>{label}</span>
      )}
    </div>
  );
}
