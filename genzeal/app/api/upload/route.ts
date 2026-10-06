import { randomBytes } from "node:crypto";
import { NextResponse } from "next/server";
import sharp from "sharp";
import { storeImage } from "@/lib/storage";

const MAX_BYTES = 10 * 1024 * 1024;

export async function POST(request: Request) {
  let file: FormDataEntryValue | null;
  try {
    file = (await request.formData()).get("file");
  } catch {
    return NextResponse.json({ error: "Upload missing. Attach an image file." }, { status: 400 });
  }

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Upload missing. Attach an image file." }, { status: 400 });
  }
  if (!file.type.startsWith("image/")) {
    return NextResponse.json({ error: "File type not supported. Use an image." }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: "File too large. Limit 10 MB." }, { status: 400 });
  }

  let output: Buffer;
  try {
    output = await sharp(Buffer.from(await file.arrayBuffer()))
      .rotate()
      .resize({ width: 1600, withoutEnlargement: true })
      .webp({ quality: 80 })
      .toBuffer();
  } catch (error) {
    console.error("[api/upload] image processing failed", error);
    return NextResponse.json({ error: "Image not readable. Use a JPG, PNG or WebP." }, { status: 400 });
  }

  const name = `${Date.now().toString(36)}-${randomBytes(6).toString("hex")}.webp`;
  let src: string;
  try {
    src = await storeImage(name, output);
  } catch (error) {
    console.error("[api/upload] storage failed", error);
    return NextResponse.json({ error: "Upload failed. Try again." }, { status: 500 });
  }

  return NextResponse.json({ src });
}
