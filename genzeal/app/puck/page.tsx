import type { Metadata } from "next";
import { NewPageForm } from "@/components/NewPageForm";
import { listPages } from "@/lib/pages";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Pages · GenZeal",
  robots: { index: false, follow: false },
};

const LINK =
  "flex min-h-11 items-center justify-between gap-4 rounded-card border border-cream-200 bg-white px-5 py-3 transition-colors duration-200 hover:bg-cream-hover";

export default async function PageList() {
  const pages = (await listPages()).filter((page) => page.path !== "/");

  return (
    <main className="min-h-svh bg-cream">
      <div className="mx-auto max-w-copy px-gutter py-section">
        <h1 className="font-display text-display-md font-semibold">Pages</h1>
        <ul className="mt-6 flex flex-col gap-2">
          <li>
            <a href="/home/edit" className={LINK}>
              <span className="font-semibold">Home</span>
              <span className="text-small text-ink-500">/</span>
            </a>
          </li>
          {pages.map((page) => (
            <li key={page.path}>
              <a href={`${page.path}/edit`} className={LINK}>
                <span className="font-semibold">{page.path}</span>
                <span className="text-small text-ink-500">{page.updatedAt.toISOString().slice(0, 10)}</span>
              </a>
            </li>
          ))}
        </ul>
        <div className="mt-10">
          <h2 className="font-display text-title font-semibold">New page</h2>
          <div className="mt-3">
            <NewPageForm />
          </div>
        </div>
      </div>
    </main>
  );
}
