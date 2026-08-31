import { useCallback, useEffect, useMemo, useState } from "react";
import { scaleGabor } from "../lib/gabor";
import {
  describeMiss,
  generateMatrixPuzzle,
  REF_CELL,
  type MatrixPuzzle,
} from "../lib/matrix";
import { GaborView } from "../render/GaborView";
import { useT } from "../i18n";
import type { StringKey } from "../i18n/en";
import { ResultPanel } from "../result/ResultPanel";
import { buildMatrixResult } from "../result/matrixResult";

type Phase = "intro" | "puzzle" | "reveal" | "done";

const PUZZLES = 6;

interface Props {
  onExit: () => void;
}

function cellSize(): number {
  const w = typeof window !== "undefined" ? window.innerWidth : 360;
  return Math.round(Math.min(Math.max(w * 0.78, 216), 300) / 3) - 6;
}

function clock(ms: number): string {
  const s = Math.max(0, Math.floor(ms / 1000));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

/**
 * Gabor matrix reasoning: spot the rule that runs across the rows and columns
 * and pick the patch that completes the grid. Six puzzles, difficulty ramping
 * with the puzzle index.
 *
 * Answering snaps the chosen patch into the blank cell and reveals the correct
 * one there (green) plus a wrong pick (red). A correct answer moves on almost
 * immediately; a wrong one lingers a few seconds so the answer registers, then
 * advances on its own — no button to press mid-round.
 */
export function MatrixReasoning({ onExit }: Props) {
  const t = useT();
  const [phase, setPhase] = useState<Phase>("intro");
  const [index, setIndex] = useState(0);
  const [puzzle, setPuzzle] = useState<MatrixPuzzle | null>(null);
  const [picked, setPicked] = useState<number | null>(null);
  const [correct, setCorrect] = useState(0);
  const [times, setTimes] = useState<number[]>([]);
  const [shownAt, setShownAt] = useState(0);
  const [size] = useState(cellSize);

  const [startedAt, setStartedAt] = useState(0);
  const [now, setNow] = useState(0);
  const [totalMs, setTotalMs] = useState(0);

  const k = size / REF_CELL;
  const running = phase === "puzzle" || phase === "reveal";

  useEffect(() => {
    if (!running) return;
    const id = window.setInterval(() => setNow(performance.now()), 250);
    return () => window.clearInterval(id);
  }, [running]);

  const startPuzzle = useCallback((i: number) => {
    setPuzzle(generateMatrixPuzzle(i, Math.random));
    setPicked(null);
    setShownAt(performance.now());
    setPhase("puzzle");
  }, []);

  const begin = useCallback(() => {
    setIndex(0);
    setCorrect(0);
    setTimes([]);
    setTotalMs(0);
    setStartedAt(performance.now());
    setNow(performance.now());
    startPuzzle(0);
  }, [startPuzzle]);

  const choose = useCallback(
    (optionIndex: number) => {
      if (phase !== "puzzle" || !puzzle) return;
      const hit = optionIndex === puzzle.answerIndex;
      setPicked(optionIndex);
      setCorrect((c) => c + (hit ? 1 : 0));
      setTimes((ts) => [...ts, performance.now() - shownAt]);
      setPhase("reveal");
    },
    [phase, puzzle, shownAt],
  );

  const advance = useCallback(() => {
    const next = index + 1;
    if (next >= PUZZLES) {
      setTotalMs(performance.now() - startedAt);
      setPhase("done");
    } else {
      setIndex(next);
      startPuzzle(next);
    }
  }, [index, startedAt, startPuzzle]);

  // Auto-advance after an answer: quick on a hit, a longer hold on a miss so the
  // correct patch has time to land. The player never waits on a button.
  useEffect(() => {
    if (phase !== "reveal" || !puzzle) return;
    const hit = picked === puzzle.answerIndex;
    const id = window.setTimeout(advance, hit ? 700 : 2600);
    return () => window.clearTimeout(id);
  }, [phase, puzzle, picked, advance]);

  const missNote = useMemo(() => {
    if (phase !== "reveal" || picked == null || !puzzle) return null;
    if (picked === puzzle.answerIndex) return null;
    const dims = describeMiss(puzzle.options[picked]!, puzzle.grid[8]!);
    if (dims.length === 0) return t("matrix.missVague");
    const names = dims
      .map((d) => t(`matrix.dim.${d}` as StringKey))
      .join(t("matrix.dimSep"));
    return t("matrix.miss", { dims: names });
  }, [phase, picked, puzzle, t]);

  const view = useMemo(
    () =>
      buildMatrixResult(t, {
        correct,
        total: PUZZLES,
        timesMs: times,
        totalMs,
      }),
    [t, correct, times, totalMs],
  );

  if (phase === "intro") {
    return (
      <div className="screen">
        <h2>{t("matrix.heading")}</h2>
        <p className="muted">{t("matrix.intro")}</p>
        <button className="primary" onClick={begin}>
          {t("common.start")}
        </button>
        <button onClick={onExit}>{t("common.back")}</button>
      </div>
    );
  }

  if (phase === "done") {
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

  if (!puzzle) return null;
  const revealing = phase === "reveal";
  const wrong = revealing && picked !== puzzle.answerIndex;

  return (
    <div className="screen scroll matrix-screen">
      <div className="muted matrix-hud">
        <span>{t("matrix.progress", { n: index + 1, max: PUZZLES })}</span>
        <span>{clock(now - startedAt)}</span>
      </div>

      <div
        className="matrix-grid"
        style={{ gridTemplateColumns: `repeat(3, ${size}px)` }}
      >
        {puzzle.grid.map((cell, i) => {
          if (i === 8) {
            return (
              <div
                className={`matrix-cell blank${revealing ? " correct" : ""}`}
                key={i}
                style={{ width: size, height: size }}
              >
                {revealing ? (
                  <div className="matrix-snap">
                    <GaborView
                      params={scaleGabor(puzzle.grid[8]!, k)}
                      size={size}
                    />
                  </div>
                ) : (
                  <span className="matrix-blank">?</span>
                )}
              </div>
            );
          }
          return (
            <div
              className="matrix-cell"
              key={i}
              style={{ width: size, height: size }}
            >
              <GaborView params={scaleGabor(cell, k)} size={size} />
            </div>
          );
        })}
      </div>

      {wrong && <p className="muted matrix-note">{missNote}</p>}

      <div
        className="matrix-options"
        style={{ gridTemplateColumns: `repeat(3, ${size}px)` }}
      >
        {puzzle.options.map((opt, i) => {
          const state = !revealing
            ? ""
            : i === puzzle.answerIndex
              ? " correct"
              : i === picked
                ? " wrong"
                : "";
          return (
            <button
              className={`matrix-option${state}`}
              key={i}
              style={{ width: size, height: size }}
              disabled={revealing}
              onPointerDown={() => choose(i)}
            >
              <GaborView params={scaleGabor(opt, k)} size={size} />
            </button>
          );
        })}
      </div>

      <button onClick={onExit} disabled={revealing}>
        {t("common.back")}
      </button>
    </div>
  );
}
