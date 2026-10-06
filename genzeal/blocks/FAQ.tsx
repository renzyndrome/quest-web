import type { ReactNode } from "react";
import { Block } from "@/components/Nest";
import { RichText } from "@/components/RichText";

export type FAQProps = { items: { question: string; answer: ReactNode }[] };

export function FAQ({ items }: FAQProps) {
  const rows = (items ?? []).filter((item) => item.question);
  if (rows.length === 0) return null;
  return (
    <Block width="copy" center>
      <div className="divide-y divide-line border-y border-line">
        {rows.map((item, index) => (
          <details key={index} className="group">
            <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-4 py-3 font-semibold [&::-webkit-details-marker]:hidden">
              {item.question}
              <span aria-hidden="true" className="text-title text-brand transition-transform duration-200 group-open:rotate-45">
                +
              </span>
            </summary>
            <RichText value={item.answer} className="pb-4" />
          </details>
        ))}
      </div>
    </Block>
  );
}
