import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { GaborParams } from "../lib/gabor";
import {
  DEFAULT_NBACK,
  generateNBackSequence,
  scoreNBack,
  type NBackScore,
  type NBackSequence,
} from "../lib/nback";
import { GaborView } from "../render/GaborView";
import { useT } from "../i18n";
import { ResultPanel } from "../result/ResultPanel";
import { buildNBackResult } from "../result/nbackResult";

/* ---------- timing (ms) ---------- */
const WINDOW_MS = 3000; // time allowed to answer a scored patch
const WATCH_MS = 1400; // how long a warm-up patch (no 2-back yet) holds
const FEEDBACK_MS = 500; // hit / miss flash before the next patch

/* ---------- combo popup ---------- */
const COMBO_MIN = 3; // shortest streak that pops a "×N"
const COMBO_MS = 950; // popup lifetime — keep in sync with @keyframes nback-combo

type Phase = "intro" | "run" | "done";
/** What the on-screen patch is doing right now. */
type StepMode = "watch" | "await" | "feedback";
type Flash = "hit" | "miss" | null;

interface Props {
  onExit: () => void;
}

/** Patch size scales with viewport width, clamped so it always fits. */
function patchSize(): number {
  const w = typeof window !== "undefined" ? window.innerWidth : 360;
  return Math.round(Math.min(Math.max(w * 0.62, 200), 300));
}

function patchParams(theta: number, size: number): GaborParams {
  return {
    theta,
    wavelength: size / 6,
    phase: 0,
    sigma: size / 5,
    aspect: 1,
    contrast: 0.9,
  };
}

/** Font size for the "×N" popup — grows with the streak, capped. */
function comboFontRem(n: number): number {
  return Math.min(2.4 + (n - COMBO_MIN) * 0.5, 6);
}

/**
 * 2-back working memory, one Gabor patch at a time — only the orientation varies.
 * For each scored patch the player answers Yes / No against a countdown ("same
 * tilt as two patches back?"); the timer running out counts as wrong. The first
 * two patches are warm-up. A green / red flash and a rising "×N" combo reward a
 * correct run.
 *
 * The run is a loop over `step`, and every transition is a timer:
 *
 *   enter step i ─┬─ i ≥ length ............................ score → "done"
 *                 ├─ warm-up  → mode "watch"  ──WATCH_MS───► step i+1
 *                 └─ scored   → mode "await"  ──┬─ Yes / No tap ──┐
 *                                               └─ WINDOW_MS timeout ─► resolve()
 *   resolve() ── record answer, update combo ── mode "feedback" ──FEEDBACK_MS──► step i+1
 *
 * Two effects run the machine: one reacts to entering a step, one advances out of
 * "feedback". Each owns its own timeout and cleans it up, so changing `step`
 * (or unmounting) cancels whatever was pending.
 */
export function NBack({ onExit }: Props) {
  const t = useT();

  const [phase, setPhase] = useState<Phase>("intro");
  const [seq, setSeq] = useState<NBackSequence | null>(null);
  const [step, setStep] = useState(-1);
  const [mode, setMode] = useState<StepMode>("await");
  const [flash, setFlash] = useState<Flash>(null);
  const [remainingMs, setRemainingMs] = useState(WINDOW_MS);
  const [combo, setCombo] = useState<{ n: number; id: number } | null>(null);
  const [score, setScore] = useState<NBackScore | null>(null);
  const [size] = useState(patchSize);

  // Answers live in a ref, not state: render never reads them, and a tap must not
  // restart the step timers. true = "yes", false = "no", null = timed out.
  const answersRef = useRef<(boolean | null)[]>([]);
  const resolvedRef = useRef(false); // current step already resolved? (tap vs. timeout)
  const streakRef = useRef(0); // consecutive correct scored steps
  const comboIdRef = useRef(0); // bump so a repeated "×N" still retriggers the animation

  const total = DEFAULT_NBACK.length - DEFAULT_NBACK.n;

  /** Record an answer for the current step and move to the feedback flash. */
  const resolve = useCallback(
    (answer: boolean | null) => {
      if (!seq || resolvedRef.current) return;
      if (step < seq.n || step >= seq.angles.length) return;
      resolvedRef.current = true;
      answersRef.current[step] = answer;

      const correct =
        answer !== null && (seq.isTarget[step] ? answer : !answer);
      if (correct) {
        streakRef.current += 1;
        if (streakRef.current >= COMBO_MIN) {
          setCombo({ n: streakRef.current, id: comboIdRef.current++ });
        }
      } else {
        streakRef.current = 0;
      }
      setFlash(correct ? "hit" : "miss");
      setMode("feedback");
    },
    [seq, step],
  );

  const next = useCallback(() => setStep((s) => s + 1), []);

  // Entering a step: end the run, or set the mode for this patch (warm-up vs.
  // scored). The per-mode timing lives in the effects below.
  useEffect(() => {
    if (phase !== "run" || !seq) return;
    if (step >= seq.angles.length) {
      setScore(scoreNBack(answersRef.current, seq));
      setPhase("done");
      return;
    }
    resolvedRef.current = false;
    setFlash(null);
    if (step < seq.n) {
      setMode("watch");
    } else {
      setRemainingMs(WINDOW_MS);
      setMode("await");
    }
  }, [phase, seq, step]);

  // Warm-up patch: hold it, then move on.
  useEffect(() => {
    if (phase !== "run" || mode !== "watch") return;
    const id = window.setTimeout(next, WATCH_MS);
    return () => window.clearTimeout(id);
  }, [phase, mode, next]);

  // Scored patch: tick the countdown down and time out as a wrong answer.
  useEffect(() => {
    if (phase !== "run" || mode !== "await") return;
    const started = performance.now();
    const tick = window.setInterval(() => {
      setRemainingMs(Math.max(0, WINDOW_MS - (performance.now() - started)));
    }, 100);
    const deadline = window.setTimeout(() => resolve(null), WINDOW_MS);
    return () => {
      window.clearInterval(tick);
      window.clearTimeout(deadline);
    };
  }, [phase, mode, resolve]);

  // Feedback flash, then the next patch.
  useEffect(() => {
    if (phase !== "run" || mode !== "feedback") return;
    const id = window.setTimeout(next, FEEDBACK_MS);
    return () => window.clearTimeout(id);
  }, [phase, mode, next]);

  // Retire the combo popup once its animation has played.
  useEffect(() => {
    if (!combo) return;
    const id = window.setTimeout(() => setCombo(null), COMBO_MS);
    return () => window.clearTimeout(id);
  }, [combo]);

  const begin = useCallback(() => {
    const s = generateNBackSequence(DEFAULT_NBACK, Math.random);
    answersRef.current = new Array(s.angles.length).fill(null);
    resolvedRef.current = false;
    streakRef.current = 0;
    setSeq(s);
    setScore(null);
    setFlash(null);
    setCombo(null);
    setMode("watch");
    setStep(0);
    setPhase("run");
  }, []);

  const view = useMemo(
    () => (score ? buildNBackResult(t, score) : null),
    [t, score],
  );

  const patch = useMemo(() => {
    if (!seq || mode === "feedback") return null;
    if (step < 0 || step >= seq.angles.length) return null;
    return patchParams(seq.angles[step]!, size);
  }, [seq, mode, step, size]);

  if (phase === "intro") {
    return (
      <div className="screen">
        <h2>{t("nback.heading")}</h2>
        <p className="muted">{t("nback.intro")}</p>
        <button className="primary" onClick={begin}>
          {t("common.start")}
        </button>
        <button onClick={onExit}>{t("common.back")}</button>
      </div>
    );
  }

  if (phase === "done" && view) {
    return (
      <div className="screen scroll">
        <h2>{t("common.done")}</h2>
        <ResultPanel view={view} />
        <div className="screen-actions">
          <button className="primary" onClick={begin}>
            {t("common.runAgain")}
          </button>
          <button onClick={onExit}>{t("common.back")}</button>
        </div>
      </div>
    );
  }

  if (!seq) return null;

  const answering = mode === "await";
  const progress = Math.min(Math.max(step - seq.n + 1, 0), total);
  const seconds = Math.max(1, Math.ceil(remainingMs / 1000));

  return (
    <div className="screen nback-screen">
      <div className="muted nback-hud">
        <span>{t("nback.count", { n: progress, max: total })}</span>
      </div>

      <p className="nback-prompt">
        {mode === "watch" ? t("nback.watch") : t("nback.prompt")}
      </p>

      <div className="nback-stage">
        <div
          className={`nback-patch${flash ? ` ${flash}` : ""}`}
          style={{ width: size, height: size }}
        >
          {patch && <GaborView params={patch} size={size} />}
          {answering && (
            <div className="nback-timer" aria-hidden="true">
              <svg viewBox="0 0 36 36" className="nback-timer-ring">
                <circle
                  className="nback-timer-track"
                  cx="18"
                  cy="18"
                  r="16"
                  pathLength={100}
                />
                <circle
                  className="nback-timer-arc"
                  cx="18"
                  cy="18"
                  r="16"
                  pathLength={100}
                  style={{
                    strokeDashoffset: 100 * (1 - remainingMs / WINDOW_MS),
                  }}
                />
              </svg>
              <span className="nback-timer-num">{seconds}</span>
            </div>
          )}
        </div>
        {combo && (
          <div
            key={combo.id}
            className="nback-combo"
            aria-hidden="true"
            style={{ fontSize: `${comboFontRem(combo.n)}rem` }}
          >
            {t("nback.combo", { n: combo.n })}
          </div>
        )}
      </div>

      <div className="nback-choice">
        <button
          className="nback-no"
          onPointerDown={() => resolve(false)}
          disabled={!answering}
        >
          {t("common.no")}
        </button>
        <button
          className="primary nback-yes"
          onPointerDown={() => resolve(true)}
          disabled={!answering}
        >
          {t("common.yes")}
        </button>
      </div>
      <button onClick={onExit}>{t("common.back")}</button>
    </div>
  );
}
