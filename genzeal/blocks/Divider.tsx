import { Block } from "@/components/Nest";

export type DividerProps = { style: "line" | "short" };

export function Divider({ style }: DividerProps) {
  return (
    <Block>
      {style === "short" ? (
        <div aria-hidden="true" className="mx-auto h-1 w-12 rounded-btn bg-brand" />
      ) : (
        <hr className="border-line" />
      )}
    </Block>
  );
}
