import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { DEFAULT_GABOR, type GaborParams, toRad } from "../lib/gabor";
import { Staircase, type StaircaseConfig, DEFAULT_STAIRCASE } from "../lib/staircase";
import { GaborView } from "../render/GaborView";
import { useT } from "../i18n";
import { ResultPanel } from "../result/ResultPanel";
import { buildContrastResult } from "../result/contrastResult";

type Phase = "intro" | "iti" | "fixation" | "stimulus" | "response" | "done";
type Side = "left" | "right";

const FIXATION_MS = 450;
const STIMULUS_MS = 200;
const ITI_MS = 300;
/** Safety cap so a session always ends even if the staircase never settles. */
const MAX_TRIALS = 30;

/**
 * Short prototype run: end after 6 reversals, threshold = mean of the last 4.
 * Starts easy (~50% contrast) and steps down fast so it reaches the hard zone —
 * and starts reversing — within ~15 trials. If the cap is hit first, the
 * staircase falls back to the mean of the last few trial levels.
 */
const TASK_STAIRCASE: StaircaseConfig = {
  ...DEFAULT_STAIRCASE,
  start: -0.3,
  stepStart: 0.25,
  stepFinal: 0.08,
  shrinkAfterReversals: 2,
  maxReversals: 6,
  burnInReversals: 2,
};

interface Props {
  onExit: () => void;
}

/** Patch geometry scales with the slot size so the Gaussian never clips. */
function patchSize(): number {
  const w = typeof window !== "undefined" ? window.innerWidth : 360;
  return Math.round(Math.min(Math.max(w * 0.36, 132), 220));
}

/**
 * Two-alternative forced-choice contrast detection. A faint Gabor appears briefly
 * in the left or right marker ring; the player taps the side they think held it.
 * A 3-down-1-up staircase tracks the contrast threshold.
 *
 * Both rings always paint a canvas (contrast 0 when inactive) and the patch layer
 * is absolutely positioned, so a trial never shifts layout or flashes the ring —
 * only the grating itself, scaled by contrast, is a cue.
 */
export function ContrastDetection({ onExit }: Props) {
  const t = useT();
  const staircaseRef = useRef(new Staircase(TASK_STAIRCASE));
  const [phase, setPhase] = useState<Phase>("intro");
  const [trialN, setTrialN] = useState(0);
  const [target, setTarget] = useState<Side>("left");
  const [contrast, setContrast] = useState(0);
  const [orientationDeg, setOrientationDeg] = useState(45);
  const [lastCorrect, setLastCorrect] = useState<boolean | null>(null);
  const timers = useRef<number[]>([]);
  const [size] = useState(patchSize);

  const clearTimers = useCallback(() => {
    timers.current.forEach(window.clearTimeout);
    timers.current = [];
  }, []);
  const after = useCallback((ms: number, fn: () => void) => {
    timers.current.push(window.setTimeout(fn, ms));
  }, []);

  useEffect(() => clearTimers, [clearTimers]);

  const base: Omit<GaborParams, "contrast"> = useMemo(
    () => ({
      ...DEFAULT_GABOR,
      theta: toRad(orientationDeg),
      wavelength: Math.round(size / 9),
      sigma: Math.round(size / 6),
      aspect: 1,
      phase: 0,
    }),
    [orientationDeg, size],
  );

  const shown = phase === "stimulus";
  const leftParams: GaborParams = {
    ...base,
    contrast: shown && target === "left" ? contrast : 0,
  };
  const rightParams: GaborParams = {
    ...base,
    contrast: shown && target === "right" ? contrast : 0,
  };

  const startTrial = useCallback(() => {
    const sc = staircaseRef.current;
    setContrast(Math.pow(10, sc.level));
    setOrientationDeg(Math.random() < 0.5 ? 45 : 135);
    setTarget(Math.random() < 0.5 ? "left" : "right");
    setPhase("fixation");
    after(FIXATION_MS, () => {
      setPhase("stimulus");
      after(STIMULUS_MS, () => setPhase("response"));
    });
  }, [after]);

  const begin = useCallback(() => {
    clearTimers();
    staircaseRef.current = new Staircase(TASK_STAIRCASE);
    setTrialN(0);
    setLastCorrect(null);
    startTrial();
  }, [clearTimers, startTrial]);

  const answer = useCallback(
    (choice: Side | "unsure") => {
      if (phase !== "response") return;
      const sc = staircaseRef.current;
      // "Not sure" = a forced guess, which is exactly what 2AFC already assumes,
      // so it keeps the staircase valid rather than biasing it.
      const resolved: Side =
        choice === "unsure"
          ? Math.random() < 0.5
            ? "left"
            : "right"
          : choice;
      const correct = resolved === target;
      sc.answer(correct);
      setLastCorrect(correct);
      const n = trialN + 1;
      setTrialN(n);
      setPhase("iti");
      if (sc.finished || n >= MAX_TRIALS) {
        after(ITI_MS, () => setPhase("done"));
      } else {
        after(ITI_MS, startTrial);
      }
    },
    [phase, target, trialN, after, startTrial],
  );

  const sc = staircaseRef.current;

  if (phase === "intro") {
    return (
      <div className="screen">
        <h2>{t("contrast.heading")}</h2>
        <p className="muted">{t("contrast.intro")}</p>
        <p className="muted">{t("contrast.tip")}</p>
        <button className="primary" onClick={begin}>
          {t("contrast.start")}
        </button>
        <button onClick={onExit}>{t("common.back")}</button>
      </div>
    );
  }

  if (phase === "done") {
    const threshold = sc.threshold();
    const pct = threshold != null ? Math.pow(10, threshold) * 100 : null;
    const sensitivity = pct != null ? Math.round(100 / pct) : null;
    const view = buildContrastResult(t, { thresholdPct: pct, sensitivity });
    return (
      <div className="screen scroll">
        <h2>{t("contrast.done")}</h2>
        <p className="muted">{t("contrast.trialsDone", { trials: trialN })}</p>
        <ResultPanel view={view} />
        <div className="screen-actions">
          <button className="primary" onClick={begin}>
            {t("contrast.runAgain")}
          </button>
          <button onClick={onExit}>{t("common.back")}</button>
        </div>
      </div>
    );
  }

  const armed = phase === "response";
  const ringStyle = { width: size, height: size } as const;

  return (
    <div className="stage">
      <div className="hud">
        <span>{t("contrast.hudTrial", { n: trialN + 1, max: MAX_TRIALS })}</span>
        <span>
          {t("contrast.hudReversals", {
            n: sc.reversals,
            max: sc.config.maxReversals,
          })}
        </span>
        {lastCorrect != null && phase === "iti" && (
          <span>{lastCorrect ? "✓" : "✕"}</span>
        )}
      </div>

      <div className="slot slot-left" style={ringStyle}>
        <GaborView params={leftParams} size={size} />
      </div>
      <div className="slot slot-right" style={ringStyle}>
        <GaborView params={rightParams} size={size} />
      </div>

      {phase === "fixation" && <span className="fixation">+</span>}

      <button
        className="tapzone tapzone-left"
        disabled={!armed}
        onPointerDown={() => answer("left")}
        aria-label={t("contrast.leftSquare")}
      />
      <button
        className="tapzone tapzone-right"
        disabled={!armed}
        onPointerDown={() => answer("right")}
        aria-label={t("contrast.rightSquare")}
      />

      <button
        className="unsure-btn"
        disabled={!armed}
        onPointerDown={() => answer("unsure")}
      >
        {t("contrast.notSure")}
      </button>
    </div>
  );
}
