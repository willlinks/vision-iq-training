import { describe, it, expect } from "vitest";
import { generateMatrixPuzzle, difficultyForIndex } from "./matrix";

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

const k = (p: { theta: number; wavelength: number; contrast: number }) =>
  [
    Math.round(p.theta * 100),
    Math.round(p.wavelength * 2),
    Math.round(p.contrast * 100),
  ].join("|");

describe("generateMatrixPuzzle", () => {
  it("returns a 9-cell grid and 6 options", () => {
    const p = generateMatrixPuzzle(0, mulberry32(1));
    expect(p.grid).toHaveLength(9);
    expect(p.options).toHaveLength(6);
  });

  it("the answer option matches the blank (bottom-right) cell", () => {
    for (let seed = 1; seed <= 40; seed++) {
      const p = generateMatrixPuzzle(seed % 8, mulberry32(seed));
      expect(p.answerIndex).toBeGreaterThanOrEqual(0);
      expect(k(p.options[p.answerIndex]!)).toBe(k(p.grid[8]!));
    }
  });

  it("all six options are visually distinct", () => {
    for (let seed = 1; seed <= 40; seed++) {
      const p = generateMatrixPuzzle(seed % 8, mulberry32(seed));
      const keys = new Set(p.options.map(k));
      expect(keys.size).toBe(6);
    }
  });

  it("the grid actually varies (a rule was applied)", () => {
    for (let seed = 1; seed <= 20; seed++) {
      const p = generateMatrixPuzzle(seed % 8, mulberry32(seed));
      expect(k(p.grid[0]!)).not.toBe(k(p.grid[8]!));
    }
  });

  it("is deterministic for a given seed and index", () => {
    const a = generateMatrixPuzzle(4, mulberry32(99));
    const b = generateMatrixPuzzle(4, mulberry32(99));
    expect(a.options.map(k)).toEqual(b.options.map(k));
    expect(a.answerIndex).toBe(b.answerIndex);
  });

  it("keeps every parameter within renderable limits", () => {
    for (let seed = 1; seed <= 30; seed++) {
      const p = generateMatrixPuzzle(7, mulberry32(seed));
      for (const cell of [...p.grid, ...p.options]) {
        expect(cell.contrast).toBeGreaterThanOrEqual(0.3);
        expect(cell.contrast).toBeLessThanOrEqual(1);
        expect(cell.wavelength).toBeGreaterThanOrEqual(12);
        expect(cell.wavelength).toBeLessThanOrEqual(34);
      }
    }
  });
});

describe("difficultyForIndex", () => {
  it("ramps rules and subtlety with the puzzle number", () => {
    expect(difficultyForIndex(0).rules).toBe(1);
    expect(difficultyForIndex(4).rules).toBe(2);
    expect(difficultyForIndex(0).subtleDistractors).toBe(false);
    expect(difficultyForIndex(7).subtleDistractors).toBe(true);
  });
});
