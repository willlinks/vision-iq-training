import { describe, it, expect } from "vitest";
import { Staircase, DEFAULT_STAIRCASE, type StaircaseConfig } from "./staircase";

/** Simulated observer: logistic psychometric function in log10-contrast space. */
function respondsCorrectly(
  level: number,
  trueThreshold: number,
  rng: () => number,
): boolean {
  const slope = 6;
  const pCorrectAboveGuess = 1 / (1 + Math.exp(-slope * (level - trueThreshold)));
  const guess = 0.5; // 2AFC
  const p = guess + (1 - guess) * pCorrectAboveGuess;
  return rng() < p;
}

// Small deterministic PRNG so the test is stable.
function mulberry32(seed: number): () => number {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

describe("Staircase", () => {
  it("makes the stimulus harder after `down` correct answers", () => {
    const s = new Staircase({ ...DEFAULT_STAIRCASE, start: -0.5 });
    s.answer(true);
    s.answer(true);
    expect(s.level).toBe(-0.5);
    s.answer(true); // 3rd correct -> step down
    expect(s.level).toBeLessThan(-0.5);
  });

  it("makes the stimulus easier after one wrong answer", () => {
    const s = new Staircase({ ...DEFAULT_STAIRCASE, start: -0.5 });
    s.answer(false);
    expect(s.level).toBeGreaterThan(-0.5);
  });

  it("counts a reversal when direction flips", () => {
    const s = new Staircase({ ...DEFAULT_STAIRCASE, start: -0.5 });
    s.answer(false); // up
    s.answer(true);
    s.answer(true);
    s.answer(true); // down -> reversal
    expect(s.reversals).toBe(1);
  });

  it("clamps to the configured range", () => {
    const cfg: StaircaseConfig = { ...DEFAULT_STAIRCASE, start: 0, max: 0 };
    const s = new Staircase(cfg);
    for (let i = 0; i < 5; i++) s.answer(false); // keep pushing easier
    expect(s.level).toBeLessThanOrEqual(cfg.max);
    expect(s.level).toBeGreaterThanOrEqual(cfg.min);
  });

  it("falls back to the trial tail when there are too few reversals", () => {
    const s = new Staircase({ ...DEFAULT_STAIRCASE, start: -0.5 });
    // All correct: steps down, never reverses.
    for (let i = 0; i < 9; i++) s.answer(true);
    expect(s.reversals).toBe(0);
    const t = s.threshold();
    expect(t).not.toBeNull();
    expect(t as number).toBeLessThan(-0.5); // somewhere down the track
  });

  it("returns null only when no trials have been recorded", () => {
    expect(new Staircase().threshold()).toBeNull();
  });

  it("converges near the true threshold for a simulated observer", () => {
    const trueThreshold = -1.0; // ~10% contrast
    const estimates: number[] = [];
    for (let run = 0; run < 20; run++) {
      const rng = mulberry32(run + 1);
      const s = new Staircase({
        ...DEFAULT_STAIRCASE,
        start: -0.2,
        maxReversals: 14,
        burnInReversals: 4,
      });
      let guard = 0;
      while (!s.finished && guard++ < 500) {
        s.answer(respondsCorrectly(s.level, trueThreshold, rng));
      }
      const t = s.threshold();
      expect(t).not.toBeNull();
      estimates.push(t as number);
    }
    const mean =
      estimates.reduce((a, b) => a + b, 0) / estimates.length;
    // 3-down-1-up targets ~79% -> sits a bit above the 50%-midpoint threshold.
    expect(mean).toBeGreaterThan(trueThreshold - 0.15);
    expect(mean).toBeLessThan(trueThreshold + 0.35);
  });
});
