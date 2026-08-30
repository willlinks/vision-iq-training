import { describe, it, expect } from "vitest";
import { DEFAULT_GABOR, gaborValue, cyclesPerPixel, toRad } from "./gabor";

describe("gaborValue", () => {
  it("peaks at the centre for zero phase", () => {
    expect(gaborValue(DEFAULT_GABOR, 0, 0)).toBeCloseTo(1, 6);
  });

  it("decays to ~0 far outside the envelope", () => {
    const far = gaborValue(DEFAULT_GABOR, 200, 200);
    expect(Math.abs(far)).toBeLessThan(1e-6);
  });

  it("scales linearly with contrast", () => {
    const half = { ...DEFAULT_GABOR, contrast: 0.5 };
    expect(gaborValue(half, 3, 0)).toBeCloseTo(
      0.5 * gaborValue(DEFAULT_GABOR, 3, 0),
      6,
    );
  });

  it("is periodic along the grating axis with period = wavelength", () => {
    const p = { ...DEFAULT_GABOR, sigma: 1e6 }; // flat envelope
    const a = gaborValue(p, 5, 0);
    const b = gaborValue(p, 5 + p.wavelength, 0);
    expect(a).toBeCloseTo(b, 6);
  });

  it("rotating 90 deg swaps the sensitive axis", () => {
    const flat = { ...DEFAULT_GABOR, sigma: 1e6 };
    const rot = { ...flat, theta: toRad(90) };
    // Original varies along x; rotated should vary along y instead.
    expect(gaborValue(rot, 0, 5)).toBeCloseTo(gaborValue(flat, 5, 0), 6);
  });
});

describe("cyclesPerPixel", () => {
  it("is the reciprocal of wavelength", () => {
    expect(cyclesPerPixel({ ...DEFAULT_GABOR, wavelength: 20 })).toBeCloseTo(
      0.05,
      6,
    );
  });
});
