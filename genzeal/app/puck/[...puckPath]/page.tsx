import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { EMPTY_PAGE, getPage, isValidPagePath, toPagePath } from "@/lib/pages";
import { Client } from "./client";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ puckPath?: string[] }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { puckPath } = await params;
  return { title: `Edit · ${toPagePath(puckPath)}`, robots: { index: false, follow: false } };
}

export default async function EditorPage({ params }: Params) {
  const { puckPath } = await params;
  const path = toPagePath(puckPath);
  if (!isValidPagePath(path)) notFound();
  const data = await getPage(path);
  return <Client path={path} data={data ?? EMPTY_PAGE} />;
}
