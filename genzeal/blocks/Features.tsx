import type { ReactNode } from "react";
import { Block, GRID_COLUMNS } from "@/components/Nest";
import { RichText } from "@/components/RichText";

export type FeaturesProps = { items: { title: string; text: ReactNode }[]; columns: "2" | "3" };

export function Features({ items, columns }: FeaturesProps) {
  const tiles = items ?? [];
  if (tiles.length === 0) return null;
  return (
    <Block>
      <div className={`grid gap-5 ${GRID_COLUMNS[columns] ?? GRID_COLUMNS["3"]}`}>
        {tiles.map((item, index) => (
          <div key={index} className="tone-light rounded-card bg-cream p-6">
            <span aria-hidden="true" className="block h-1 w-10 rounded-btn bg-brand" />
            {item.title ? <h3 className="mt-4 font-display text-title font-semibold">{item.title}</h3> : null}
            <RichText value={item.text} className="mt-2" />
          </div>
        ))}
      </div>
    </Block>
  );
}
