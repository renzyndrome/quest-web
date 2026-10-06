export type SpacerProps = { size: "small" | "medium" | "large" };

const SIZES: Record<SpacerProps["size"], string> = { small: "h-6", medium: "h-12", large: "h-24" };

export function Spacer({ size }: SpacerProps) {
  return <div aria-hidden="true" className={SIZES[size] ?? SIZES.medium} />;
}
