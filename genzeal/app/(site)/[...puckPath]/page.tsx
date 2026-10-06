import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getPage, isValidPagePath, toPagePath } from "@/lib/pages";
import { pageMetadata } from "../metadata";
import { Client } from "./client";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ puckPath?: string[] }> };

async function loadPage(params: Params["params"]) {
  const { puckPath } = await params;
  const path = toPagePath(puckPath);
  if (path === "/" || !isValidPagePath(path)) return null;
  return getPage(path);
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  return pageMetadata(await loadPage(params));
}

export default async function Page({ params }: Params) {
  const data = await loadPage(params);
  if (!data) notFound();
  return <Client data={data} />;
}
