/**
 * Gabor matrix reasoning: a 3x3 grid of Gabor patches where 1-2 parameters
 * change by a fixed step along the rows and/or columns. The bottom-right cell
 * is blank; the player picks it from six options.
 *
 * Pure — no DOM. An RNG is injected so puzzles are reproducible in tests.
 * Params are authored for a 96 px reference cell (see scaleGabor at render time).
 */
import { DEFAULT_GABOR, type GaborParams, toRad } from "./gabor";

export type MatrixDim = "theta" | "wavelength" | "contrast";
export type Axis = "row" | "col";

export interface MatrixPuzzle {
  /** 9 cells, row-major. Index 8 (bottom-right) is the answer. */
  grid: GaborParams[];
  /** 6 options, shuffled. */
  options: GaborParams[];
  /** Index into `options` of the correct cell. */
  answerIndex: number;
}

const REF_CELL = 96;

const BASE: GaborParams = {
  ...DEFAULT_GABOR,
  sigma: REF_CELL / 3.2,
  aspect: 1,
  phase: 0,
  contrast: 0.95,
  wavelength: 26,
};

const LIMITS: Record<MatrixDim, [number, number]> = {
  theta: [0, Math.PI], // orientation is π-periodic
  wavelength: [12, 34],
  contrast: [0.3, 1],
};

/** Per-step deltas, scaled by the puzzle's `stepScale`. */
const STEP: Record<MatrixDim, number> = {
  theta: toRad(35),
  wavelength: -5,
  contrast: -0.2,
};

interface Rule {
  dim: MatrixDim;
  axis: Axis;
  step: number;
}

function clamp(dim: MatrixDim, v: number): number {
  const [lo, hi] = LIMITS[dim];
  if (dim === "theta") return ((v % Math.PI) + Math.PI) % Math.PI;
  return Math.min(hi, Math.max(lo, v));
}

function cellParams(base: GaborParams, rules: Rule[], r: number, c: number) {
  const p = { ...base };
  for (const rule of rules) {
    const times = rule.axis === "col" ? c : r;
    p[rule.dim] = clamp(rule.dim, base[rule.dim] + rule.step * times);
  }
  return p;
}

function key(p: GaborParams): string {
  return [
    Math.round(p.theta * 100),
    Math.round(p.wavelength * 2),
    Math.round(p.contrast * 100),
  ].join("|");
}

interface Difficulty {
  rules: number;
  stepScale: number;
  /** Keep only the hardest (over/undershoot) distractors above this level. */
  subtleDistractors: boolean;
}

export function difficultyForIndex(i: number): Difficulty {
  if (i <= 1) return { rules: 1, stepScale: 1, subtleDistractors: false };
  if (i <= 3) return { rules: 1, stepScale: 0.7, subtleDistractors: false };
  if (i <= 5) return { rules: 2, stepScale: 1, subtleDistractors: false };
  return { rules: 2, stepScale: 0.75, subtleDistractors: true };
}

function pick<T>(rng: () => number, xs: T[]): T {
  return xs[Math.floor(rng() * xs.length)]!;
}

function shuffle<T>(rng: () => number, xs: T[]): T[] {
  const a = [...xs];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j]!, a[i]!];
  }
  return a;
}

export function generateMatrixPuzzle(
  index: number,
  rng: () => number,
): MatrixPuzzle {
  const diff = difficultyForIndex(index);
  const dims: MatrixDim[] = ["theta", "wavelength", "contrast"];

  // A randomised but visible base.
  const base: GaborParams = {
    ...BASE,
    theta: toRad(pick(rng, [0, 20, 45])),
    wavelength: pick(rng, [24, 26, 28]),
  };

  // Assign one dim per axis (row first, then col if 2 rules).
  const shuffledDims = shuffle(rng, dims);
  const axes: Axis[] = rng() < 0.5 ? ["row", "col"] : ["col", "row"];
  const rules: Rule[] = [];
  for (let k = 0; k < diff.rules; k++) {
    const dim = shuffledDims[k]!;
    rules.push({ dim, axis: axes[k]!, step: STEP[dim] * diff.stepScale });
  }

  const grid: GaborParams[] = [];
  for (let r = 0; r < 3; r++)
    for (let c = 0; c < 3; c++) grid.push(cellParams(base, rules, r, c));

  const answer = grid[8]!;
  const rowRule = rules.find((x) => x.axis === "row");
  const colRule = rules.find((x) => x.axis === "col");

  const candidates: GaborParams[] = [answer];
  const add = (p: GaborParams) => candidates.push(p);

  // Over/undershoot one dim by a step.
  for (const rule of rules) {
    add({
      ...answer,
      [rule.dim]: clamp(rule.dim, answer[rule.dim] + rule.step),
    });
    add({
      ...answer,
      [rule.dim]: clamp(rule.dim, answer[rule.dim] - rule.step),
    });
  }

  if (!diff.subtleDistractors) {
    // "Applied only one axis" — real grid cells, a classic Raven distractor.
    if (rowRule) add(grid[2]!); // bottom-left: row rule only
    if (colRule) add(grid[6]!); // top-right: col rule only
    add(grid[4]!); // centre cell
  }

  // Dedupe, keeping the answer first.
  const seen = new Set<string>();
  const distinct: GaborParams[] = [];
  for (const p of candidates) {
    const k = key(p);
    if (seen.has(k)) continue;
    seen.add(k);
    distinct.push(p);
  }

  // Pad with random single-dim perturbations if we came up short.
  let guard = 0;
  while (distinct.length < 6 && guard++ < 50) {
    const dim = pick(rng, dims);
    const p = {
      ...answer,
      [dim]: clamp(dim, answer[dim] + STEP[dim] * (rng() < 0.5 ? 1.5 : -1.5)),
    };
    const k = key(p);
    if (!seen.has(k)) {
      seen.add(k);
      distinct.push(p);
    }
  }

  const options = shuffle(rng, distinct.slice(0, 6));
  const answerIndex = options.findIndex((p) => key(p) === key(answer));

  return { grid, options, answerIndex };
}

export { REF_CELL };
