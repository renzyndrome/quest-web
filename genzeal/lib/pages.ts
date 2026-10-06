import type { Data } from "@puckeditor/core";
import { ensureSchema, getPool } from "./db";

export const EMPTY_PAGE: Data = { content: [], root: { props: { title: "" } } };

const PAGE_PATH = /^\/(?:[a-z0-9-]+(?:\/[a-z0-9-]+)*)?$/;

/** `[]` and `["home"]` are the home page; anything else joins into "/a/b". */
export function toPagePath(parts: string[] | undefined): string {
  if (!parts || parts.length === 0) return "/";
  if (parts.length === 1 && parts[0] === "home") return "/";
  return "/" + parts.join("/");
}

// Addresses already taken by the app itself: a page saved there could never be viewed.
const RESERVED_FIRST = new Set(["api", "puck", "uploads", "home", "edit"]);

export function isValidPagePath(path: unknown): path is string {
  if (typeof path !== "string" || !PAGE_PATH.test(path)) return false;
  if (path === "/") return true;
  const parts = path.slice(1).split("/");
  return !RESERVED_FIRST.has(parts[0]) && parts[parts.length - 1] !== "edit";
}

export function isPageData(data: unknown): data is Data {
  if (typeof data !== "object" || data === null || Array.isArray(data)) return false;
  const candidate = data as { content?: unknown; root?: unknown };
  return (
    Array.isArray(candidate.content) &&
    typeof candidate.root === "object" &&
    candidate.root !== null &&
    !Array.isArray(candidate.root)
  );
}

// Single-process cache, shared across route bundles via globalThis.
const store = globalThis as typeof globalThis & { __genzealPages?: Map<string, Data | null> };
const cache = (store.__genzealPages ??= new Map<string, Data | null>());

export async function getPage(path: string): Promise<Data | null> {
  if (cache.has(path)) return cache.get(path) ?? null;
  await ensureSchema();
  const result = await getPool().query<{ data: Data }>("SELECT data FROM pages WHERE path = $1", [path]);
  const data = result.rows[0]?.data ?? null;
  cache.set(path, data);
  return data;
}

export async function savePage(path: string, data: Data): Promise<void> {
  if (!isValidPagePath(path)) throw new Error(`Invalid page path: ${path}`);
  if (!isPageData(data)) throw new Error("Invalid page data");
  await ensureSchema();
  await getPool().query(
    `INSERT INTO pages (path, data, updated_at) VALUES ($1, $2::jsonb, now())
     ON CONFLICT (path) DO UPDATE SET data = EXCLUDED.data, updated_at = now()`,
    [path, JSON.stringify(data)],
  );
  cache.set(path, data);
}

export async function listPages(): Promise<{ path: string; updatedAt: Date }[]> {
  await ensureSchema();
  const result = await getPool().query<{ path: string; updated_at: Date }>(
    "SELECT path, updated_at FROM pages ORDER BY path",
  );
  return result.rows.map((row) => ({ path: row.path, updatedAt: row.updated_at }));
}
