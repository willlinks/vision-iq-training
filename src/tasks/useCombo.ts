import { useCallback, useEffect, useRef, useState } from "react";

/** Shortest streak of correct answers that pops a "×N". */
export const COMBO_MIN = 3;
/** Popup lifetime — keep in sync with @keyframes combo-pop in styles.css. */
const COMBO_MS = 950;

export interface Combo {
  n: number;
  /** Monotonic — bumped so a repeated "×N" still retriggers the animation. */
  id: number;
}

/**
 * Tracks a running streak of correct answers for a task. Call `record(correct)`
 * once per answer and `reset()` when a fresh run starts; render `<ComboPopup>`
 * with `current` inside an element that has `position: relative`.
 *
 * `record` and `reset` are stable — destructure them for effect deps.
 */
export function useCombo() {
  const streak = useRef(0);
  const nextId = useRef(0);
  const [current, setCurrent] = useState<Combo | null>(null);

  // Retire the popup once its animation has played.
  useEffect(() => {
    if (!current) return;
    const id = window.setTimeout(() => setCurrent(null), COMBO_MS);
    return () => window.clearTimeout(id);
  }, [current]);

  const record = useCallback((correct: boolean) => {
    if (!correct) {
      streak.current = 0;
      return;
    }
    streak.current += 1;
    if (streak.current >= COMBO_MIN) {
      setCurrent({ n: streak.current, id: nextId.current++ });
    }
  }, []);

  const reset = useCallback(() => {
    streak.current = 0;
    setCurrent(null);
  }, []);

  return { current, record, reset };
}
