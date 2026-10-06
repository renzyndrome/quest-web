/*
  Where uploaded photos live. Same switch as the CMS (cms/src/lib/storage.ts):

    R2_BUCKET unset → written to UPLOAD_DIR (a Docker volume), served by
                      app/uploads/[name]/route.ts. Local development.
    R2_BUCKET set   → put in Cloudflare R2 and served straight from
                      R2_PUBLIC_URL, never through this container.

  The bucket is shared with the CMS, which namespaces by collection
  (media/…, videos/…), so every object here sits under genzeal/.
*/
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";

const PREFIX = "genzeal";

/** True once the bucket is configured. Everything else stays on disk. */
export const usingR2 = Boolean(process.env.R2_BUCKET);

type R2Config = { bucket: string; accountId: string; accessKeyId: string; secretAccessKey: string; publicUrl: string };

/** Reads the R2 env at first use (never at import or build), naming any missing var. */
function r2Config(): R2Config {
  const env = {
    R2_BUCKET: process.env.R2_BUCKET ?? "",
    R2_ACCOUNT_ID: process.env.R2_ACCOUNT_ID ?? "",
    R2_ACCESS_KEY_ID: process.env.R2_ACCESS_KEY_ID ?? "",
    R2_SECRET_ACCESS_KEY: process.env.R2_SECRET_ACCESS_KEY ?? "",
    R2_PUBLIC_URL: (process.env.R2_PUBLIC_URL ?? "").replace(/\/+$/, ""),
  };
  const missing = Object.entries(env)
    .filter(([, value]) => !value)
    .map(([name]) => name);
  if (missing.length > 0) {
    throw new Error(`R2_BUCKET is set but ${missing.join(", ")} ${missing.length === 1 ? "is" : "are"} not.`);
  }
  return {
    bucket: env.R2_BUCKET,
    accountId: env.R2_ACCOUNT_ID,
    accessKeyId: env.R2_ACCESS_KEY_ID,
    secretAccessKey: env.R2_SECRET_ACCESS_KEY,
    publicUrl: env.R2_PUBLIC_URL,
  };
}

let client: S3Client | undefined;

function r2Client(config: R2Config): S3Client {
  client ??= new S3Client({
    // R2 is single-region behind the scenes and expects the literal "auto".
    region: "auto",
    endpoint: `https://${config.accountId}.r2.cloudflarestorage.com`,
    forcePathStyle: true,
    credentials: { accessKeyId: config.accessKeyId, secretAccessKey: config.secretAccessKey },
  });
  return client;
}

export function uploadDir(): string {
  return process.env.UPLOAD_DIR ?? path.join(process.cwd(), "uploads");
}

/** Stores one processed WebP and returns the public src for <img>. */
export async function storeImage(name: string, body: Buffer): Promise<string> {
  if (usingR2) {
    const config = r2Config();
    await r2Client(config).send(
      new PutObjectCommand({
        Bucket: config.bucket,
        Key: `${PREFIX}/${name}`,
        Body: body,
        ContentType: "image/webp",
        CacheControl: "public, max-age=31536000, immutable",
      }),
    );
    return `${config.publicUrl}/${PREFIX}/${name}`;
  }

  const dir = uploadDir();
  await mkdir(dir, { recursive: true });
  await writeFile(path.join(/*turbopackIgnore: true*/ dir, name), body);
  return `/uploads/${name}`;
}
