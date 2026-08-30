// Rasterises public/icon.svg into the PNG icons the PWA manifest and iOS need.
// Run after editing the SVG:  node scripts/gen-icons.mjs
import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const root = fileURLToPath(new URL("../public/", import.meta.url));
const svg = await readFile(root + "icon.svg");

const targets = [
  { file: "pwa-192.png", size: 192 },
  { file: "pwa-512.png", size: 512 },
  { file: "apple-touch-icon.png", size: 180, bg: "#101014" },
  // Maskable: same art but padded into the safe zone.
  { file: "pwa-maskable-512.png", size: 512, pad: 0.1, bg: "#101014" },
];

for (const { file, size, pad = 0, bg } of targets) {
  const inner = Math.round(size * (1 - pad * 2));
  let img = sharp(svg, { density: 384 }).resize(inner, inner, {
    fit: "contain",
    background: bg ?? { r: 0, g: 0, b: 0, alpha: 0 },
  });
  if (pad > 0) {
    const p = Math.round((size - inner) / 2);
    img = img.extend({
      top: p,
      bottom: p,
      left: p,
      right: p,
      background: bg ?? "#101014",
    });
  }
  await writeFile(root + file, await img.png().toBuffer());
  console.log("wrote", file, `${size}x${size}`);
}
