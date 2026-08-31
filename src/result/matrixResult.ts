import type { StringKey } from "../i18n/en";
import type { ResultView } from "./ResultPanel";

type T = (key: StringKey, params?: Record<string, string | number>) => string;

const ABOUT_KEYS: StringKey[] = ["mres.about1", "mres.about2", "mres.about3"];

const TIP_KEYS: [StringKey, StringKey][] = [
  ["mtip.scan.t", "mtip.scan.b"],
  ["mtip.eliminate.t", "mtip.eliminate.b"],
  ["mtip.variety.t", "mtip.variety.b"],
  ["mtip.sleep.t", "mtip.sleep.b"],
  ["mtip.daily.t", "mtip.daily.b"],
];

function median(xs: number[]): number | null {
  if (xs.length === 0) return null;
  const s = [...xs].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 ? s[mid]! : (s[mid - 1]! + s[mid]!) / 2;
}

function mmss(ms: number): string {
  const s = Math.round(ms / 1000);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

/**
 * Result view for matrix reasoning. Accuracy and speed only — no scale, since a
 * six-puzzle round is too short to place on a meaningful range.
 */
export function buildMatrixResult(
  t: T,
  input: {
    correct: number;
    total: number;
    timesMs: number[];
    totalMs: number;
  },
): ResultView {
  const med = median(input.timesMs);

  return {
    metrics: [
      {
        name: t("mres.correctName"),
        displayValue: `${input.correct} / ${input.total}`,
        meaning: t("mres.correctMeaning"),
      },
      {
        name: t("mres.totalName"),
        displayValue: input.totalMs > 0 ? mmss(input.totalMs) : "—",
        meaning: t("mres.totalMeaning"),
      },
      {
        name: t("mres.timeName"),
        displayValue: med != null ? `${(med / 1000).toFixed(1)} s` : "—",
        meaning: t("mres.timeMeaning"),
      },
    ],
    youLabel: t("result.you"),
    typicalLabel: t("result.typical"),
    aboutTitle: t("result.aboutTitle"),
    about: ABOUT_KEYS.map((key) => t(key)),
    improveTitle: t("result.improveTitle"),
    tips: TIP_KEYS.map(([tk, bk]) => ({ title: t(tk), body: t(bk) })),
  };
}
