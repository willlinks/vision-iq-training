/**
 * Gabor patch math. Pure — no DOM. Safe to extract to packages/shared later.
 *
 *   G(x,y) = exp(-(x'^2 + g^2 * y'^2) / (2 * s^2)) * cos(2*pi * x'/l + p)
 *   x' =  x*cos(theta) + y*sin(theta)
 *   y' = -x*sin(theta) + y*cos(theta)
 *
 * theta = orientation (rad), l = wavelength (px/cycle), p = phase (rad),
 * s = Gaussian SD (px), g = aspect ratio of the Gaussian envelope.
 */
export interface GaborParams {
  /** Orientation in radians. 0 = vertical stripes. */
  theta: number;
  /** Wavelength in pixels per cycle. */
  wavelength: number;
  /** Phase offset in radians. */
  phase: number;
  /** Gaussian envelope standard deviation, in pixels. */
  sigma: number;
  /** Aspect ratio (spatial aspect) of the envelope. 1 = circular. */
  aspect: number;
  /** Michelson contrast, 0..1. Scales the grating amplitude. */
  contrast: number;
}

export const DEFAULT_GABOR: GaborParams = {
  theta: 0,
  wavelength: 24,
  phase: 0,
  sigma: 24,
  aspect: 1,
  contrast: 1,
};

/**
 * Signed grating value at pixel offset (x, y) from the patch centre, in [-1, 1]
 * before contrast scaling. Multiply by contrast, then map around mid-grey.
 */
export function gaborValue(params: GaborParams, x: number, y: number): number {
  const { theta, wavelength, phase, sigma, aspect, contrast } = params;
  const cos = Math.cos(theta);
  const sin = Math.sin(theta);
  const xr = x * cos + y * sin;
  const yr = -x * sin + y * cos;
  const envelope = Math.exp(
    -(xr * xr + aspect * aspect * yr * yr) / (2 * sigma * sigma),
  );
  const grating = Math.cos((2 * Math.PI * xr) / wavelength + phase);
  return contrast * envelope * grating;
}

/** Spatial frequency in cycles per pixel. */
export function cyclesPerPixel(params: GaborParams): number {
  return 1 / params.wavelength;
}

/** Degrees ↔ radians helpers, since task configs think in degrees. */
export const toRad = (deg: number): number => (deg * Math.PI) / 180;
export const toDeg = (rad: number): number => (rad * 180) / Math.PI;
