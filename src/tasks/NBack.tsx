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

const STIM_MS = 1800;
const GAP_MS = 700;

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
 * in orientation; the player taps Match when the current angle repeats the one
 * two patches earlier. A short press flash (green hit / red miss) gives feedback
 * without interrupting the stream.
 */
export function NBack({ onExit }: Props) {
  const t = useT();
  const [phase, setPhase] = useState<Phase>("intro");
  const [seq, setSeq] = useState<NBackSequence | null>(null);
  const [step, setStep] = useState(-1);
  const [visible, setVisible] = useState(false);
  const [flash, setFlash] = useState<Flash>(null);
  const [score, setScore] = useState<NBackScore | null>(null);
  const [size] = useState(patchSize);

  // Presses accumulate here, not in state: nothing in render reads them, and
  // keeping them out of state avoids restarting the step timers on every tap.
  const respondedRef = useRef<boolean[]>([]);

  const total = DEFAULT_NBACK.length - DEFAULT_NBACK.n;

  useEffect(() => {
    if (phase !== "run" || !seq) return;
    if (step >= seq.angles.length) {
      setScore(scoreNBack(respondedRef.current, seq));
      setPhase("done");
      return;
    }
    setVisible(true);
    setFlash(null);
    const t1 = window.setTimeout(() => setVisible(false), STIM_MS);
    const t2 = window.setTimeout(() => setStep((s) => s + 1), STIM_MS + GAP_MS);
    return () => {
      window.clearTimeout(t1);
      window.clearTimeout(t2);
    };
  }, [phase, seq, step]);

  useEffect(() => {
    if (!flash) return;
    const id = window.setTimeout(() => setFlash(null), 400);
    return () => window.clearTimeout(id);
  }, [flash]);

  const begin = useCallback(() => {
    const s = generateNBackSequence(DEFAULT_NBACK, Math.random);
    respondedRef.current = new Array(s.angles.length).fill(false);
    setSeq(s);
    setScore(null);
    setFlash(null);
    setStep(0);
    setPhase("run");
  }, []);

  const press = useCallback(() => {
    if (phase !== "run" || !seq || !visible) return;
    if (step < 0 || step >= seq.angles.length) return;
    if (respondedRef.current[step]) return;
    respondedRef.current[step] = true;
    setFlash(seq.isTarget[step] ? "hit" : "miss");
  }, [phase, seq, visible, step]);

  const view = useMemo(
    () => (score ? buildNBackResult(t, score) : null),
    [t, score],
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
  const showPatch = visible && step >= 0 && step < seq.angles.length;

  return (
    <div className="screen nback-screen">
      <div className="muted nback-hud">
        <span>{t("nback.count", { n: pos, max: total })}</span>
        <span>{t("nback.level")}</span>
      </div>

      <div
        className={`nback-patch${flash ? ` ${flash}` : ""}`}
        style={{ width: size, height: size }}
      >
        {showPatch && (
          <GaborView
            params={patchParams(seq.angles[step]!, size)}
            size={size}
          />
        )}
      </div>

      <button
        className="primary nback-match"
        onPointerDown={press}
        disabled={!showPatch}
      >
        {t("nback.match")}
      </button>
      <button onClick={onExit}>{t("common.back")}</button>
    </div>
  );
}
