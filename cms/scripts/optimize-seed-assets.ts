/*
  One-off: turn the church admin's raw asset drop into committable seed images.

  The originals are 6000px PNGs totalling ~284 MB — far too large to commit or
  serve. This downscales them to 1800px webp (Payload then derives its own
  `banner` 1200w / `card` 800w presets from these on upload).

  Usage, pointing at the unzipped drop:

    cd cms
    RAW_DIR="../public/images/WEBSITE 2026" npx payload run scripts/optimize-seed-assets.ts

  Output lands in cms/seed/assets/ and IS committed, so `seed:initial` works on
  a fresh clone without the original zip.
*/
import { mkdirSync, existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const dirname = path.dirname(fileURLToPath(import.meta.url));
const RAW_DIR = process.env.RAW_DIR
  ? path.resolve(process.cwd(), process.env.RAW_DIR)
  : path.resolve(dirname, '../../public/images/WEBSITE 2026');
const OUT_DIR = path.resolve(dirname, '../seed/assets');

const MAX_WIDTH = 1800;
const QUALITY = 82;

/** raw filename (relative to RAW_DIR) → committed seed filename */
const MAP: ReadonlyArray<readonly [string, string]> = [
  ['Quest Laguna logo.png', 'quest-laguna-logo.webp'],
  ['nextlevel logo.png', 'nextlevel-logo.webp'],
  ['nexlevel cover photo.png', 'nextlevel-cover.webp'],
  ['isang dekada 1.png', 'isang-dekada-1.webp'],
  ['isang dekada 2.png', 'isang-dekada-2.webp'],
  ['Worship.png', 'worship.webp'],
  ['Community.png', 'community.webp'],
  ['Growth.png', 'growth.webp'],
  ['prayingg.png', 'praying.webp'],
  ['landscape baptism..png', 'baptism.webp'],
  ['Quest Retreat.png', 'quest-retreat.webp'],
  ['August 8 (1).png', 'pre-quest-retreat.webp'],
  ['Discipleship 101 .png', 'discipleship-101.webp'],
  ['Gcash BDO QR .png', 'giving-qr.webp'],
  ['Ministries/8.png', 'ministry-admin.webp'],
  ['Ministries/9.png', 'ministry-genzeal.webp'],
  ['Ministries/10.png', 'ministry-media.webp'],
  ['Ministries/11.png', 'ministry-dance.webp'],
  ['Ministries/12.png', 'ministry-bts.webp'],
  ['Ministries/13.png', 'ministry-kids.webp'],
  ['Ministries/14.png', 'ministry-ushering.webp'],
  ['Ministries/15.png', 'ministry-praise-worship.webp'],
  ['Ministries/16.png', 'ministry-pastoral.webp'],
];

async function main(): Promise<void> {
  if (!existsSync(RAW_DIR)) {
    console.error(`Raw asset dir not found: ${RAW_DIR}\nSet RAW_DIR to the unzipped drop.`);
    process.exit(1);
  }
  mkdirSync(OUT_DIR, { recursive: true });

  let total = 0;
  for (const [from, to] of MAP) {
    const src = path.join(RAW_DIR, from);
    if (!existsSync(src)) {
      console.warn(`skip (missing): ${from}`);
      continue;
    }
    const dest = path.join(OUT_DIR, to);
    const info = await sharp(src)
      .resize({ width: MAX_WIDTH, withoutEnlargement: true })
      .webp({ quality: QUALITY })
      .toFile(dest);
    total += info.size;
    console.log(`${to.padEnd(30)} ${(info.size / 1024).toFixed(0).padStart(5)} KB  ${info.width}x${info.height}`);
  }
  console.log(`\n${MAP.length} images, ${(total / 1024 / 1024).toFixed(1)} MB total`);
}

try {
  await main();
} catch (error) {
  console.error('optimize failed:', error);
  process.exit(1);
}
