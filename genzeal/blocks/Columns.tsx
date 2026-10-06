import type { ReactNode } from "react";
import { Block, NestProvider } from "@/components/Nest";

export type ColumnsLayout = "2" | "3" | "2-1" | "1-2";
export type ColumnsProps = { layout: ColumnsLayout; gap: "normal" | "tight" };

const LAYOUTS: Record<ColumnsLayout, string> = {
  "2": "md:grid-cols-2",
  "3": "md:grid-cols-3",
  "2-1": "md:grid-cols-[2fr_1fr]",
  "1-2": "md:grid-cols-[1fr_2fr]",
};

export function Columns({ layout, gap, columns }: ColumnsProps & { columns: ReactNode[] }) {
  return (
    <Block>
      <div className={`grid grid-cols-1 ${LAYOUTS[layout] ?? LAYOUTS["2"]} ${gap === "tight" ? "gap-4" : "gap-8"}`}>
        {columns.map((column, index) => (
          <div key={index} className="min-w-0">
            <NestProvider>{column}</NestProvider>
          </div>
        ))}
      </div>
    </Block>
  );
}
