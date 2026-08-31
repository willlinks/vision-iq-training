import { useCallback, useMemo, useState } from "react";
import { scaleGabor } from "../lib/gabor";
import {
  generateMatrixPuzzle,
  REF_CELL,
  type MatrixPuzzle,
} from "../lib/matrix";
import { GaborView } from "../render/GaborView";
import { useT } from "../i18n";
import { ResultPanel } from "../result/ResultPanel";
import { buildMatrixResult } from "../result/matrixResult";

type Phase = "intro" | "puzzle" | "reveal" | "done";

const PUZZLES = 6;

interface Props {
  onExit: () => void;
}

function cellSize(): number {
  const w = typeof window !== "undefined" ? window.innerWidth : 360;
  return Math.round(Math.min(Math.max(w * 0.84, 240), 330) / 3) - 6;
}

/**
 * Gabor matrix reasoning: spot the rule that runs across the rows and columns
 * and pick the patch that completes the grid. Six puzzles, difficulty ramping
 * with the puzzle index.
 *
 * Answering snaps the chosen patch into the blank cell and reveals the correct
 * one there (green) plus a wrong pick (red); the player taps Next to continue,
 * so a mistake can be studied for as long as they want.
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

  const k = size / REF_CELL;

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
      setPhase("done");
    } else {
      setIndex(next);
      startPuzzle(next);
    }
  }, [index, startPuzzle]);

  const view = useMemo(
    () => buildMatrixResult(t, { correct, total: PUZZLES, timesMs: times }),
    [t, correct, times],
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
      <div className="muted matrix-progress">
        {t("matrix.progress", { n: index + 1, max: PUZZLES })}
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

      {wrong && <p className="muted matrix-note">{t("matrix.answerShown")}</p>}

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

      {revealing ? (
        <button className="primary" onClick={advance}>
          {index + 1 >= PUZZLES ? t("matrix.seeResults") : t("common.next")}
        </button>
      ) : (
        <button onClick={onExit}>{t("common.back")}</button>
      )}
    </div>
  );
}
