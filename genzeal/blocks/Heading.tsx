import { Block } from "@/components/Nest";

export type HeadingProps = { text: string; level: "h2" | "h3"; align: "left" | "center" };

export function Heading({ text, level, align }: HeadingProps) {
  if (!text) return null;
  const Tag = level === "h3" ? "h3" : "h2";
  const center = align === "center";
  return (
    <Block width="copy" center={center}>
      <Tag
        className={`font-display font-semibold ${level === "h3" ? "text-title" : "text-display-md"} ${center ? "text-center" : ""}`}
      >
        {text}
      </Tag>
    </Block>
  );
}
