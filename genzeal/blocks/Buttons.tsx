import { Block } from "@/components/Nest";
import { ButtonLink, type ButtonStyle } from "./Button";

export type ButtonsProps = {
  items: { label: string; href: string; style: ButtonStyle }[];
  align: "left" | "center";
};

export function Buttons({ items, align }: ButtonsProps) {
  const buttons = (items ?? []).filter((item) => item.label);
  if (buttons.length === 0) return null;
  return (
    <Block>
      <div className={`flex flex-wrap gap-3 ${align === "left" ? "justify-start" : "justify-center"}`}>
        {buttons.map((item, index) => (
          <ButtonLink key={index} label={item.label} href={item.href} style={item.style} />
        ))}
      </div>
    </Block>
  );
}
