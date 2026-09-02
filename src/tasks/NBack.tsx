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

type Phase = "intro" | "run" | "done";
type Flash = "hit" | "miss" | null;
/** Within a run step: watch a warm-up patch, await an answer, show feedback. */
type StepPhase = "watch" | "await" | "feedback";

/** Seconds allowed to answer a scored patch. Will vary by stage level later. */
const WINDOW_MS = 3000;
/** How long a warm-up patch (no 2-back yet) stays up before moving on. */
const WATCH_MS = 1400;
/** Hit/miss flash after an answer before the next patch. */
const FEEDBACK_MS = 500;

/** Combo popups start once the correct-step streak reaches this. */
const COMBO_MIN = 3;
/** Popup lifetime — keep in sync with the nback-combo animation in styles.css. */
const COMBO_MS = 950;

interface Props {
  onExit: () => void;
}

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

/**
 * 2-back working memory. Gabor patches stream past one at a time, varying only
 * in orientation. For each patch the player answers Yes / No — is this tilt the
 * same as the one two patches back? — against a countdown; running out of time
 * counts as wrong. The first two patches are warm-up (no answer possible). A
 * short green/red flash and a rising combo number reward a correct run.
 */
export function NBack({ onExit }: Props) {
  const t = useT();
  const [phase, setPhase] = useState<Phase>("intro");
  const [seq, setSeq] = useState<NBackSequence | null>(null);
  const [step, setStep] = useState(-1);
  const [stepPhase, setStepPhase] = useState<StepPhase>("await");
  const [visible, setVisible] = useState(false);
  const [flash, setFlash] = useState<Flash>(null);
  const [remainingMs, setRemainingMs] = useState(WINDOW_MS);
  const [score, setScore] = useState<NBackScore | null>(null);
  const [size] = useState(patchSize);
  const [combo, setCombo] = useState<{ n: number; id: number } | null>(null);

  // Answers accumulate here, not in state: nothing in render reads them, and
  // keeping them out of state avoids restarting the step timers on every tap.
  // true = "yes", false = "no", null = ran out of time.
  const answersRef = useRef<(boolean | null)[]>([]);
  // Guards against a double resolve (button tap racing the deadline).
  const resolvedRef = useRef(false);
  // Running count of consecutive correct scored steps, and a monotonic id so a
  // repeat of the same combo number still retriggers the CSS animation.
  const streakRef = useRef(0);
  const comboIdRef = useRef(0);

  const total = DEFAULT_NBACK.length - DEFAULT_NBACK.n;

  const resolve = useCallback(
    (answer: boolean | null) => {
      if (!seq || resolvedRef.current) return;
      if (step < seq.n || step >= seq.angles.length) return;
      resolvedRef.current = true;
      answersRef.current[step] = answer;
      const ok = answer !== null && (seq.isTarget[step] ? answer : !answer);
      if (ok) {
        streakRef.current += 1;
        if (streakRef.current >= COMBO_MIN) {
          setCombo({ n: streakRef.current, id: comboIdRef.current++ });
        }
      } else {
        streakRef.current = 0;
      }
      setFlash(ok ? "hit" : "miss");
      setVisible(false);
      setStepPhase("feedback");
    },
    [seq, step],
  );

  // Drive the step forward and decide what this step is.
  useEffect(() => {
    if (phase !== "run" || !seq) return;
    if (step >= seq.angles.length) {
      setScore(scoreNBack(answersRef.current, seq));
      setPhase("done");
      return;
    }
    resolvedRef.current = false;
    setFlash(null);
    setVisible(true);
    if (step < seq.n) {
      setStepPhase("watch");
    } else {
      setRemainingMs(WINDOW_MS);
      setStepPhase("await");
    }
  }, [phase, seq, step]);

  // Warm-up patch: just hold it, then advance.
  useEffect(() => {
    if (phase !== "run" || stepPhase !== "watch") return;
    const id = window.setTimeout(() => setStep((s) => s + 1), WATCH_MS);
    return () => window.clearTimeout(id);
  }, [phase, stepPhase, step]);

  // Scored patch: run the countdown, resolve as a timeout when it hits zero.
  useEffect(() => {
    if (phase !== "run" || stepPhase !== "await") return;
    const started = performance.now();
    const tick = window.setInterval(() => {
      setRemainingMs(Math.max(0, WINDOW_MS - (performance.now() - started)));
    }, 100);
    const deadline = window.setTimeout(() => resolve(null), WINDOW_MS);
    return () => {
      window.clearInterval(tick);
      window.clearTimeout(deadline);
    };
  }, [phase, stepPhase, step, resolve]);

  // Feedback flash, then the next patch.
  useEffect(() => {
    if (phase !== "run" || stepPhase !== "feedback") return;
    const id = window.setTimeout(() => setStep((s) => s + 1), FEEDBACK_MS);
    return () => window.clearTimeout(id);
  }, [phase, stepPhase, step]);

  useEffect(() => {
    if (!flash) return;
    const id = window.setTimeout(() => setFlash(null), 400);
    return () => window.clearTimeout(id);
  }, [flash]);

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
    setVisible(false);
    setStepPhase("await");
    setStep(0);
    setPhase("run");
  }, []);

  const view = useMemo(
    () => (score ? buildNBackResult(t, score) : null),
    [t, score],
  );

  const params = useMemo(
    () =>
      seq && visible && step >= 0 && step < seq.angles.length
        ? patchParams(seq.angles[step]!, size)
        : null,
    [seq, visible, step, size],
  );

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
  const pos = Math.min(Math.max(step - DEFAULT_NBACK.n + 1, 0), total);
  const answering = stepPhase === "await";
  const seconds = Math.max(1, Math.ceil(remainingMs / 1000));

  return (
    <div className="screen nback-screen">
      <div className="muted nback-hud">
        <span>{t("nback.count", { n: pos, max: total })}</span>
      </div>

      <p className="nback-prompt">
        {stepPhase === "watch" ? t("nback.watch") : t("nback.prompt")}
      </p>

      <div className="nback-stage">
        <div
          className={`nback-patch${flash ? ` ${flash}` : ""}`}
          style={{ width: size, height: size }}
        >
          {params && <GaborView params={params} size={size} />}
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
            style={{
              fontSize: `${Math.min(2.4 + (combo.n - COMBO_MIN) * 0.5, 6)}rem`,
            }}
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
