import { Block } from "@/components/Nest";
import { safeHref } from "@/lib/href";

export type ButtonStyle = "primary" | "secondary";

export type ButtonProps = {
  label: string;
  href: string;
  style: ButtonStyle;
  size?: "normal" | "large";
  align?: "left" | "center";
};

const STYLES: Record<ButtonStyle, string> = {
  primary: "bg-brand text-white hover:bg-brand-press",
  secondary: "border border-fg text-fg hover:bg-cream hover:text-ink",
};

export function buttonClass(style: ButtonStyle, size: "normal" | "large" = "normal"): string {
  const sizing = size === "large" ? "min-h-13 px-8 text-body-lg" : "min-h-11 px-6";
  return `inline-flex items-center justify-center rounded-btn font-display font-semibold transition-colors duration-200 ${sizing} ${STYLES[style] ?? STYLES.primary}`;
}

/** One button: a link when it has a usable href, plain text otherwise. */
export function ButtonLink({ label, href, style, size }: Omit<ButtonProps, "align">) {
  const target = safeHref(href);
  const className = buttonClass(style, size);
  return target ? (
    <a href={target} className={className}>
      {label}
    </a>
  ) : (
    <span className={className}>{label}</span>
  );
}

export function Button({ align = "center", ...props }: ButtonProps) {
  return (
    <Block>
      <div className={`flex ${align === "left" ? "justify-start" : "justify-center"}`}>
        <ButtonLink {...props} />
      </div>
    </Block>
  );
}
