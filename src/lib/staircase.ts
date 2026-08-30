/**
 * Transformed up/down staircase for adaptive threshold estimation. Pure — no DOM.
 *
 * Default is 3-down / 1-up, which converges on the ~79.4% correct point of the
 * psychometric function. Step size shrinks after the first few reversals so the
 * track settles near threshold.
 */
export interface StaircaseConfig {
  /** Starting stimulus level (e.g. log10 contrast, or contrast itself). */
  start: number;
  /** Consecutive correct answers required to make the stimulus harder. */
  down: number;
  /** Wrong answers required to make it easier. */
  up: number;
  /** Step size before `shrinkAfterReversals` reversals. */
  stepStart: number;
  /** Step size after `shrinkAfterReversals` reversals. */
  stepFinal: number;
  shrinkAfterReversals: number;
  /** Clamp for the stimulus level. */
  min: number;
  max: number;
  /** Stop after this many reversals (0 = never, caller controls trial count). */
  maxReversals: number;
  /** Reversals to ignore when averaging for the threshold estimate. */
  burnInReversals: number;
}

export const DEFAULT_STAIRCASE: StaircaseConfig = {
  start: -0.3, // log10(0.5) ≈ -0.3 -> 50% contrast
  down: 3,
  up: 1,
  stepStart: 0.2,
  stepFinal: 0.05,
  shrinkAfterReversals: 2,
  min: -2.5, // log10 contrast floor ≈ 0.3%
  max: 0, // log10(1) = full contrast
  maxReversals: 10,
  burnInReversals: 2,
};

export interface StaircaseTrial {
  level: number;
  correct: boolean;
  reversal: boolean;
}

export class Staircase {
  readonly config: StaircaseConfig;
  level: number;
  private lastDir: 0 | 1 | -1 = 0;
  private runCorrect = 0;
  private runWrong = 0;
  readonly trials: StaircaseTrial[] = [];
  readonly reversalLevels: number[] = [];

  constructor(config: StaircaseConfig = DEFAULT_STAIRCASE) {
    this.config = config;
    this.level = config.start;
  }

  get reversals(): number {
    return this.reversalLevels.length;
  }

  get finished(): boolean {
    return (
      this.config.maxReversals > 0 && this.reversals >= this.config.maxReversals
    );
  }

  private step(): number {
    return this.reversals >= this.config.shrinkAfterReversals
      ? this.config.stepFinal
      : this.config.stepStart;
  }

  /** Record a response and advance. Returns the trial that was just recorded. */
  answer(correct: boolean): StaircaseTrial {
    if (correct) {
      this.runCorrect += 1;
      this.runWrong = 0;
    } else {
      this.runWrong += 1;
      this.runCorrect = 0;
    }

    let dir: 0 | 1 | -1 = 0;
    if (this.runCorrect >= this.config.down) {
      dir = -1; // harder = lower level
      this.runCorrect = 0;
    } else if (this.runWrong >= this.config.up) {
      dir = 1; // easier = higher level
      this.runWrong = 0;
    }

    const reversal =
      dir !== 0 && this.lastDir !== 0 && dir !== this.lastDir;

    const trial: StaircaseTrial = { level: this.level, correct, reversal };
    this.trials.push(trial);

    if (reversal) this.reversalLevels.push(this.level);

    if (dir !== 0) {
      const next = this.level + dir * this.step();
      this.level = Math.min(this.config.max, Math.max(this.config.min, next));
      this.lastDir = dir;
    }

    return trial;
  }

  /**
   * Threshold estimate: mean of reversal levels after the burn-in. If the run
   * ended (e.g. on a trial cap) before producing at least two usable reversals,
   * fall back to the mean level of the last few trials so a short session still
   * yields a number instead of nothing.
   */
  threshold(): number | null {
    const used = this.reversalLevels.slice(this.config.burnInReversals);
    const mean = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / xs.length;
    if (used.length >= 2) return mean(used);
    if (this.trials.length === 0) return null;
    const tail = this.trials.slice(-6).map((tr) => tr.level);
    return mean(tail);
  }
}
