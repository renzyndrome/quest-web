import { NextResponse } from "next/server";
import { isPageData, isValidPagePath, savePage } from "@/lib/pages";

export async function POST(request: Request) {
  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "Request body is not valid JSON." }, { status: 400 });
  }

  const { path, data } = (payload ?? {}) as { path?: unknown; data?: unknown };
  if (!isValidPagePath(path)) {
    return NextResponse.json({ error: "Page address invalid." }, { status: 400 });
  }
  if (!isPageData(data)) {
    return NextResponse.json({ error: "Page data invalid." }, { status: 400 });
  }

  try {
    await savePage(path, data);
  } catch (error) {
    console.error(`[api/puck] save failed for ${path}`, error);
    return NextResponse.json({ error: "Save failed. Try again." }, { status: 500 });
  }

  return NextResponse.json({ status: "ok" });
}
