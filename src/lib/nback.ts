/**
 * N-back working-memory task, rendered with Gabor patches. A stream of patches
 * appears one at a time; the only thing that varies is orientation, drawn from a
 * small fixed pool of angles. The player flags a patch whose angle matches the
 * one `n` steps earlier.
 *
 * Pure — no DOM. An RNG is injected so sequences are reproducible in tests.
 */
import { toRad } from "./gabor";

/** Orientation pool, in radians. Six evenly spaced angles across 180°. */
export const NBACK_ANGLES: number[] = [0, 30, 60, 90, 120, 150].map(toRad);

export interface NBackSequence {
  n: number;
  /** Orientation (radians) shown at each step. */
  angles: number[];
  /** Whether step i repeats the angle from step i-n. First n are always false. */
  isTarget: boolean[];
}

export interface NBackConfig {
  n: number;
  /** Total patches, including the first n that cannot be targets. */
  length: number;
  /** Fraction of scored steps (i >= n) that should be targets. */
  targetRate: number;
}

export const DEFAULT_NBACK: NBackConfig = {
  n: 2,
  length: 22,
  targetRate: 0.32,
};

function pickAngle(rng: () => number, exclude?: number): number {
  const pool =
    exclude === undefined
      ? NBACK_ANGLES
      : NBACK_ANGLES.filter((a) => a !== exclude);
  return pool[Math.floor(rng() * pool.length)]!;
}

export function generateNBackSequence(
  config: NBackConfig,
  rng: () => number,
): NBackSequence {
  const { n, length, targetRate } = config;
  const angles: number[] = [];
  const isTarget: boolean[] = [];

  for (let i = 0; i < length; i++) {
    const back = i >= n ? angles[i - n]! : undefined;
    const makeTarget = back !== undefined && rng() < targetRate;
    if (makeTarget) {
      angles.push(back!);
      isTarget.push(true);
    } else {
      // Exclude the n-back angle so a "non-target" is never an accidental match.
      angles.push(pickAngle(rng, back));
      isTarget.push(false);
    }
  }

  return { n, angles, isTarget };
}

export interface NBackScore {
  scored: number;
  targets: number;
  hits: number;
  misses: number;
  falseAlarms: number;
  correctRejections: number;
  /** (hits + correct rejections) / scored. */
  accuracy: number;
}

/**
 * Score a run. `responded[i]` is whether the player flagged step i as a match.
 * The first n steps are not scored.
 */
export function scoreNBack(
  responded: boolean[],
  seq: NBackSequence,
): NBackScore {
  let hits = 0;
  let misses = 0;
  let falseAlarms = 0;
  let correctRejections = 0;

  for (let i = seq.n; i < seq.angles.length; i++) {
    const said = responded[i] ?? false;
    if (seq.isTarget[i]) {
      if (said) hits++;
      else misses++;
    } else {
      if (said) falseAlarms++;
      else correctRejections++;
    }
  }

  const scored = hits + misses + falseAlarms + correctRejections;
  return {
    scored,
    targets: hits + misses,
    hits,
    misses,
    falseAlarms,
    correctRejections,
    accuracy: scored === 0 ? 0 : (hits + correctRejections) / scored,
  };
}
