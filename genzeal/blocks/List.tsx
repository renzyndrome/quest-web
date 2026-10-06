import { Block } from "@/components/Nest";

export type ListProps = { items: { text: string }[]; style: "bullets" | "numbers" };

export function List({ items, style }: ListProps) {
  const rows = (items ?? []).filter((item) => item.text);
  if (rows.length === 0) return null;
  const Tag = style === "numbers" ? "ol" : "ul";
  return (
    <Block width={rows.length > 6 ? "content" : "copy"} center>
      <Tag
        className={`${style === "numbers" ? "list-decimal" : "list-disc"} pl-6 text-body text-fg-muted marker:text-brand ${rows.length > 6 ? "md:columns-2 md:gap-10" : ""}`}
      >
        {rows.map((item, index) => (
          <li key={index} className="mb-2 break-inside-avoid">
            {item.text}
          </li>
        ))}
      </Tag>
    </Block>
  );
}
