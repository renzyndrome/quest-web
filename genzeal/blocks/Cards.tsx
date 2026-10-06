import type { ReactNode } from "react";
import { Block, GRID_COLUMNS } from "@/components/Nest";
import { RichText } from "@/components/RichText";
import { safeHref } from "@/lib/href";

export type CardItem = { image: string; alt: string; title: string; text: ReactNode; href: string; linkLabel: string };
export type CardsProps = { items: CardItem[]; columns: "2" | "3" };

export function Cards({ items, columns }: CardsProps) {
  const cards = items ?? [];
  if (cards.length === 0) return null;
  return (
    <Block>
      <div className={`grid gap-5 ${GRID_COLUMNS[columns] ?? GRID_COLUMNS["3"]}`}>
        {cards.map((item, index) => {
          const href = safeHref(item.href);
          return (
            <article
              key={index}
              className="tone-light flex flex-col overflow-hidden rounded-card border border-cream-200 bg-white transition-colors duration-200 hover:border-brand"
            >
              {item.image ? (
                <img src={item.image} alt={item.alt} loading="lazy" className="aspect-[4/3] w-full object-cover" />
              ) : null}
              <div className="flex flex-1 flex-col gap-2 p-5">
                {item.title ? <h3 className="font-display text-title font-semibold">{item.title}</h3> : null}
                <RichText value={item.text} />
                {href ? (
                  <a
                    href={href}
                    className="mt-auto inline-flex min-h-11 items-center self-start font-semibold text-brand transition-colors duration-200 hover:text-brand-press"
                  >
                    {item.linkLabel || "Details"}
                  </a>
                ) : null}
              </div>
            </article>
          );
        })}
      </div>
    </Block>
  );
}
