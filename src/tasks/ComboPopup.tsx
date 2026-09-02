import { useT } from "../i18n";
import { COMBO_MIN, type Combo } from "./useCombo";

/** Font size for the "×N" popup — grows with the streak, capped. */
function fontRem(n: number): number {
  return Math.min(2.4 + (n - COMBO_MIN) * 0.5, 6);
}

/** The floating "×N" number. Render inside an element with `position: relative`. */
export function ComboPopup({ combo }: { combo: Combo | null }) {
  const t = useT();
  if (!combo) return null;
  return (
    <div
      key={combo.id}
      className="combo-pop"
      aria-hidden="true"
      style={{ fontSize: `${fontRem(combo.n)}rem` }}
    >
      {t("combo.x", { n: combo.n })}
    </div>
  );
}
