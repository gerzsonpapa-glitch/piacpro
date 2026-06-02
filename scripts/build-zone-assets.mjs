/**
 * PiacPro zóna háttérképek — CSAK zones-source/{id}.png forrásokból.
 * Futtatás: node scripts/build-zone-assets.mjs
 */
import fs from 'fs';
import path from 'path';
import sharp from 'sharp';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const OUT = path.join(ROOT, 'public', 'zones');
const SOURCE_DIR = path.join(ROOT, 'zones-source');

const ALL_ZONES = [
  'hub', 'marketplace', 'auction', 'jobs', 'community', 'business',
  'donations', 'producers', 'admin', 'messages', 'piac-ai',
];

const LOOP_ZONES = new Set(['hub', 'marketplace', 'auction', 'community', 'piac-ai']);

function findSource(name) {
  for (const ext of ['.png', '.jpg', '.jpeg', '.webp']) {
    const p = path.join(SOURCE_DIR, `${name}${ext}`);
    if (fs.existsSync(p)) return p;
  }
  return null;
}

async function writeStatic(name, src) {
  const pipeline = sharp(src).resize(1920, null, { fit: 'inside' });
  await pipeline.clone().jpeg({ quality: 88, mozjpeg: true }).toFile(path.join(OUT, `${name}.jpg`));
  await pipeline.clone().webp({ quality: 85 }).toFile(path.join(OUT, `${name}.webp`));
}

async function writeLoop(name, src) {
  const base = sharp(src).resize(1280, null, { fit: 'inside' });
  const frames = 8;
  const bufs = [];
  for (let i = 0; i < frames; i++) {
    const t = (i / frames) * Math.PI * 2;
    const buf = await base
      .clone()
      .modulate({
        brightness: 1 + Math.sin(t) * 0.05,
        saturation: 1 + Math.sin(t + 0.8) * 0.04,
      })
      .webp({ quality: 72 })
      .toBuffer();
    bufs.push(buf);
  }
  await sharp(bufs, { animated: true, loop: 0, delay: Array(frames).fill(140) })
    .webp({ quality: 72, effort: 4 })
    .toFile(path.join(OUT, `${name}-loop.webp`));
}

async function main() {
  await fs.promises.mkdir(OUT, { recursive: true });
  await fs.promises.mkdir(SOURCE_DIR, { recursive: true });

  let ok = 0;
  for (const name of ALL_ZONES) {
    const src = findSource(name);
    if (!src) {
      console.warn(`⚠ Hiányzik: zones-source/${name}.png`);
      continue;
    }
    console.log(`→ ${name}`);
    await writeStatic(name, src);
    console.log(`  ✓ ${name}.jpg / .webp`);
    if (LOOP_ZONES.has(name)) {
      await writeLoop(name, src);
      console.log(`  ✓ ${name}-loop.webp`);
    }
    ok++;
  }
  if (ok < ALL_ZONES.length) {
    console.error(`\nCsak ${ok}/${ALL_ZONES.length} zóna kész. Töltsd fel a hiányzó PNG-ket a zones-source/ mappába.`);
    process.exit(ok === 0 ? 1 : 0);
  }
  console.log(`\n✅ Mind a ${ok} zóna feldolgozva → public/zones/`);
}

main().catch((e) => { console.error(e); process.exit(1); });
