import { describe, it, expect } from "vitest";
import {
  DEFAULT_NBACK,
  generateNBackSequence,
  scoreNBack,
  type NBackSequence,
} from "./nback";

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

describe("generateNBackSequence", () => {
  it("has the configured length and leaves the first n unmarked", () => {
    const seq = generateNBackSequence(DEFAULT_NBACK, mulberry32(1));
    expect(seq.angles).toHaveLength(DEFAULT_NBACK.length);
    expect(seq.isTarget.slice(0, DEFAULT_NBACK.n).every((x) => !x)).toBe(true);
  });

  it("marks a step as a target exactly when it repeats the n-back angle", () => {
    for (let seed = 1; seed <= 40; seed++) {
      const seq = generateNBackSequence(DEFAULT_NBACK, mulberry32(seed));
      for (let i = seq.n; i < seq.angles.length; i++) {
        const matches = seq.angles[i] === seq.angles[i - seq.n];
        expect(seq.isTarget[i]).toBe(matches);
      }
    }
  });

  it("produces at least a few targets and some non-targets", () => {
    for (let seed = 1; seed <= 20; seed++) {
      const seq = generateNBackSequence(DEFAULT_NBACK, mulberry32(seed));
      const targets = seq.isTarget.filter(Boolean).length;
      expect(targets).toBeGreaterThanOrEqual(2);
      expect(targets).toBeLessThan(DEFAULT_NBACK.length - DEFAULT_NBACK.n);
    }
  });

  it("is deterministic for a given seed", () => {
    const a = generateNBackSequence(DEFAULT_NBACK, mulberry32(7));
    const b = generateNBackSequence(DEFAULT_NBACK, mulberry32(7));
    expect(a.angles).toEqual(b.angles);
    expect(a.isTarget).toEqual(b.isTarget);
  });
});

describe("scoreNBack", () => {
  const seq: NBackSequence = {
    n: 2,
    angles: [0, 1, 0, 1, 2, 2],
    //        -  -  T  T  F  F   (scored from index 2)
    isTarget: [false, false, true, true, false, false],
  };

  it("counts hits, misses, false alarms and correct rejections", () => {
    const responded = [false, false, true, false, true, false];
    const s = scoreNBack(responded, seq);
    expect(s).toMatchObject({
      scored: 4,
      targets: 2,
      hits: 1,
      misses: 1,
      falseAlarms: 1,
      correctRejections: 1,
    });
    expect(s.accuracy).toBeCloseTo(0.5);
  });

  it("ignores presses on the first n steps", () => {
    const responded = [true, true, false, false, false, false];
    const s = scoreNBack(responded, seq);
    expect(s.falseAlarms).toBe(0);
    expect(s.scored).toBe(4);
  });

  it("a perfect run scores accuracy 1", () => {
    const responded = [false, false, true, true, false, false];
    const s = scoreNBack(responded, seq);
    expect(s.accuracy).toBe(1);
    expect(s.longestStreak).toBe(4);
  });

  it("reports the longest run of correct steps, not the final one", () => {
    // 8 scored steps: correct, correct, correct, WRONG, correct, correct, WRONG, correct
    const streakSeq: NBackSequence = {
      n: 2,
      angles: [0, 0, 1, 1, 1, 1, 1, 1, 1, 1],
      isTarget: [false, false, false, true, true, true, true, true, true, true],
    };
    const responded = [
      false,
      false,
      false,
      true,
      true,
      false,
      true,
      true,
      false,
      true,
    ];
    expect(scoreNBack(responded, streakSeq).longestStreak).toBe(3);
  });
});
