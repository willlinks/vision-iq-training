import { type GaborParams, gaborValue } from "../lib/gabor";

/**
 * Renders a GaborParams to an offscreen canvas and caches it. DOM-dependent, so
 * it lives here rather than in src/lib. Draw the result with ctx.drawImage and
 * transform the *canvas 2D context* for position — never re-render per frame.
 *
 * Mid-grey background (128) so the patch sits on the same grey the page uses.
 * Contrast is applied in gaborValue; on-screen contrast is uncalibrated.
 */
const cache = new Map<string, HTMLCanvasElement>();

function key(params: GaborParams, size: number): string {
  const r = (n: number) => Math.round(n * 1000) / 1000;
  return [
    size,
    r(params.theta),
    r(params.wavelength),
    r(params.phase),
    r(params.sigma),
    r(params.aspect),
    r(params.contrast),
  ].join("|");
}

export function renderGaborSprite(
  params: GaborParams,
  size: number,
): HTMLCanvasElement {
  const k = key(params, size);
  const hit = cache.get(k);
  if (hit) return hit;

  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("2D canvas context unavailable");

  const img = ctx.createImageData(size, size);
  const data = img.data;
  const half = size / 2;

  for (let py = 0; py < size; py++) {
    for (let px = 0; px < size; px++) {
      const v = gaborValue(params, px - half, py - half); // [-1, 1]
      const lum = Math.round(128 + v * 127);
      const i = (py * size + px) * 4;
      data[i] = lum;
      data[i + 1] = lum;
      data[i + 2] = lum;
      data[i + 3] = 255;
    }
  }

  ctx.putImageData(img, 0, 0);
  cache.set(k, canvas);
  return canvas;
}

export function clearGaborCache(): void {
  cache.clear();
}
