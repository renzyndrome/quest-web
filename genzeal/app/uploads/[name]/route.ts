import { readFile } from "node:fs/promises";
import path from "node:path";
import { uploadDir } from "@/lib/storage";

const NAME = /^[a-z0-9-]+\.webp$/;

function notFound() {
  return new Response("Not found.", { status: 404 });
}

export async function GET(_request: Request, { params }: { params: Promise<{ name: string }> }) {
  const { name } = await params;
  if (!NAME.test(name)) return notFound();

  const dir = uploadDir();
  let file: Buffer;
  try {
    file = await readFile(path.join(/*turbopackIgnore: true*/ dir, name));
  } catch {
    return notFound();
  }

  return new Response(new Uint8Array(file), {
    headers: {
      "Content-Type": "image/webp",
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
