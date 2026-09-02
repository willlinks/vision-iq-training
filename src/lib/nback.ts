/**
 * N-back working-memory task, rendered with Gabor patches. A stream of patches
 * appears one at a time; the only thing that varies is orientation, drawn from a
 * small fixed pool of angles. For each patch the player answers yes/no: does its
 * angle match the one `n` steps earlier?
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
  /** Scored steps where the timer expired before the player answered. */
  noAnswer: number;
  /** (hits + correct rejections) / scored. */
  accuracy: number;
  /** Longest run of consecutive correct scored steps (hits or correct rejections). */
  longestStreak: number;
}

/**
 * Score a run. `answers[i]` is the player's yes/no for step i — `true` = "yes,
 * it matches", `false` = "no", `null`/`undefined` = ran out of time. The first n
 * steps are not scored. A timeout is always incorrect and breaks the streak.
 */
export function scoreNBack(
  answers: (boolean | null | undefined)[],
  seq: NBackSequence,
): NBackScore {
  let hits = 0;
  let misses = 0;
  let falseAlarms = 0;
  let correctRejections = 0;
  let noAnswer = 0;
  let targets = 0;
  let current = 0;
  let longestStreak = 0;

  for (let i = seq.n; i < seq.angles.length; i++) {
    const a = answers[i] ?? null;
    if (seq.isTarget[i]) targets++;

    let correct = false;
    if (a === null) {
      noAnswer++;
    } else if (seq.isTarget[i]) {
      if (a) {
        hits++;
        correct = true;
      } else {
        misses++;
      }
    } else {
      if (a) {
        falseAlarms++;
      } else {
        correctRejections++;
        correct = true;
      }
    }

    if (correct) {
      current++;
      if (current > longestStreak) longestStreak = current;
    } else {
      current = 0;
    }
  }

  const scored = hits + misses + falseAlarms + correctRejections + noAnswer;
  return {
    scored,
    targets,
    hits,
    misses,
    falseAlarms,
    correctRejections,
    noAnswer,
    accuracy: scored === 0 ? 0 : (hits + correctRejections) / scored,
    longestStreak,
  };
}
