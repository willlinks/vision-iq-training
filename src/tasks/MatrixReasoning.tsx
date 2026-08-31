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
const REVEAL_MS = 800;

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
      window.setTimeout(() => {
        const next = index + 1;
        if (next >= PUZZLES) {
          setPhase("done");
        } else {
          setIndex(next);
          startPuzzle(next);
        }
      }, REVEAL_MS);
    },
    [phase, puzzle, shownAt, index, startPuzzle],
  );

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

  return (
    <div className="screen scroll matrix-screen">
      <div className="muted matrix-progress">
        {t("matrix.progress", { n: index + 1, max: PUZZLES })}
      </div>

      <div
        className="matrix-grid"
        style={{ gridTemplateColumns: `repeat(3, ${size}px)` }}
      >
        {puzzle.grid.map((cell, i) => (
          <div
            className="matrix-cell"
            key={i}
            style={{ width: size, height: size }}
          >
            {i === 8 ? (
              <span className="matrix-blank">?</span>
            ) : (
              <GaborView params={scaleGabor(cell, k)} size={size} />
            )}
          </div>
        ))}
      </div>

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

      <button onClick={onExit}>{t("common.back")}</button>
    </div>
  );
}
