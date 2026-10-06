import type { Metadata } from "next";
import { getPage } from "@/lib/pages";
import { Client } from "./[...puckPath]/client";
import { pageMetadata } from "./metadata";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  return pageMetadata(await getPage("/"));
}

export default async function HomePage() {
  const data = await getPage("/");
  if (!data) {
    return (
      <section className="mx-auto max-w-content px-gutter py-section">
        <h1 className="font-display text-display-lg font-semibold">GenZeal</h1>
        <p className="mt-4 text-body-lg text-ink-500">Page not published yet.</p>
      </section>
    );
  }
  return <Client data={data} />;
}
