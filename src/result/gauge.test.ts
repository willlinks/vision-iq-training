import { describe, it, expect } from "vitest";
import { buildScale } from "./gauge";

const fmt = (n: number) => String(Math.round(n));

describe("buildScale", () => {
  it("places the marker proportionally (higher-is-better)", () => {
    expect(
      buildScale({ value: 75, min: 0, max: 100, format: fmt }).position,
    ).toBeCloseTo(0.75, 5);
  });

  it("flips the track when lower-is-better", () => {
    const lo = buildScale({
      value: 10,
      min: 0,
      max: 100,
      higherIsBetter: false,
      format: fmt,
    });
    const hi = buildScale({
      value: 90,
      min: 0,
      max: 100,
      higherIsBetter: false,
      format: fmt,
    });
    expect(lo.position).toBeGreaterThan(hi.position);
  });

  it("labels the axis ends in reading order (worst → best)", () => {
    const s = buildScale({
      value: 5,
      min: 1,
      max: 9,
      higherIsBetter: false,
      format: fmt,
    });
    expect(s.minLabel).toBe("9");
    expect(s.maxLabel).toBe("1");
  });

  it("clamps out-of-domain values", () => {
    expect(
      buildScale({ value: 999, min: 0, max: 100, format: fmt }).position,
    ).toBe(1);
    expect(
      buildScale({ value: -5, min: 0, max: 100, format: fmt }).position,
    ).toBe(0);
  });

  it("returns the typical range as an ordered 0..1 span with a label", () => {
    const s = buildScale({
      value: 50,
      min: 0,
      max: 100,
      typicalRange: [30, 60],
      format: fmt,
    });
    expect(s.typical).toBeDefined();
    expect(s.typical!.from).toBeCloseTo(0.3, 5);
    expect(s.typical!.to).toBeCloseTo(0.6, 5);
    expect(s.typical!.label).toBe("30–60");
  });

  it("keeps the log-scaled marker inside the track", () => {
    const s = buildScale({
      value: 20,
      min: 5,
      max: 250,
      log: true,
      format: fmt,
    });
    expect(s.position).toBeGreaterThan(0);
    expect(s.position).toBeLessThan(1);
  });
});
