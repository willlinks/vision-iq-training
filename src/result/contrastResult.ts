import type { StringKey } from "../i18n/en";
import { buildScale } from "./gauge";
import type { ResultView } from "./ResultPanel";

type T = (key: StringKey, params?: Record<string, string | number>) => string;

/**
 * Approximate healthy-adult ranges for this kind of screen-based Gabor detection
 * task. The device is uncalibrated, so these are rough anchors, not clinical
 * norms — the "rough guide" note says so.
 *   contrast threshold ~0.5–3%  ->  sensitivity (100 / threshold%) ~33–200
 */
const SENSITIVITY_DOMAIN: [number, number] = [3, 300];
const SENSITIVITY_TYPICAL: [number, number] = [33, 200];
const THRESHOLD_DOMAIN: [number, number] = [0.3, 40];
const THRESHOLD_TYPICAL: [number, number] = [0.5, 3];

const ABOUT_KEYS: StringKey[] = [
  "cres.about1",
  "cres.about2",
  "cres.about3",
  "cres.about4",
];

const TIP_KEYS: [StringKey, StringKey][] = [
  ["ctip.daily.t", "ctip.daily.b"],
  ["ctip.light.t", "ctip.light.b"],
  ["ctip.glare.t", "ctip.glare.b"],
  ["ctip.breaks.t", "ctip.breaks.b"],
  ["ctip.checkup.t", "ctip.checkup.b"],
];

/**
 * Result view for the contrast-detection task. One neutral min→max scale on
 * contrast sensitivity (higher = better), showing the typical healthy range and
 * the player's marker. No verdict text — the player reads the scale themselves.
 */
export function buildContrastResult(
  t: T,
  input: { thresholdPct: number | null; sensitivity: number | null },
): ResultView {
  const { thresholdPct, sensitivity } = input;

  const sensitivityScale =
    sensitivity != null
      ? buildScale({
          value: sensitivity,
          min: SENSITIVITY_DOMAIN[0],
          max: SENSITIVITY_DOMAIN[1],
          log: true,
          higherIsBetter: true,
          typicalRange: SENSITIVITY_TYPICAL,
          format: (n) => String(Math.round(n)),
        })
      : undefined;

  const thresholdScale =
    thresholdPct != null
      ? buildScale({
          value: thresholdPct,
          min: THRESHOLD_DOMAIN[0],
          max: THRESHOLD_DOMAIN[1],
          log: true,
          higherIsBetter: false,
          typicalRange: THRESHOLD_TYPICAL,
          format: (n) => `${n % 1 === 0 ? n : n.toFixed(1)}%`,
        })
      : undefined;

  return {
    metrics: [
      {
        name: t("cres.sensitivityName"),
        displayValue: sensitivity != null ? String(sensitivity) : "—",
        meaning: t("cres.meaning"),
        ...(sensitivityScale ? { scale: sensitivityScale } : {}),
      },
      {
        name: t("cres.thresholdName"),
        displayValue:
          thresholdPct != null ? `${thresholdPct.toFixed(1)}%` : "—",
        meaning: t("cres.thresholdMeaning"),
        ...(thresholdScale ? { scale: thresholdScale } : {}),
      },
    ],
    youLabel: t("result.you"),
    typicalLabel: t("result.typical"),
    note: t("result.note"),
    aboutTitle: t("result.aboutTitle"),
    about: ABOUT_KEYS.map((k) => t(k)),
    improveTitle: t("result.improveTitle"),
    tips: TIP_KEYS.map(([tk, bk]) => ({ title: t(tk), body: t(bk) })),
  };
}
