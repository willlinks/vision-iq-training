import type { StringKey } from "../i18n/en";
import type { ResultView } from "./ResultPanel";
import type { NBackScore } from "../lib/nback";

type T = (key: StringKey, params?: Record<string, string | number>) => string;

const ABOUT_KEYS: StringKey[] = ["nb.about1", "nb.about2", "nb.about3"];

const TIP_KEYS: [StringKey, StringKey][] = [
  ["nbtip.rehearse.t", "nbtip.rehearse.b"],
  ["nbtip.label.t", "nbtip.label.b"],
  ["nbtip.restraint.t", "nbtip.restraint.b"],
  ["nbtip.daily.t", "nbtip.daily.b"],
  ["nbtip.rest.t", "nbtip.rest.b"],
];

/**
 * Result view for the n-back task. Accuracy and error breakdown only — a single
 * short round is not enough to place on a population range.
 */
export function buildNBackResult(t: T, score: NBackScore): ResultView {
  return {
    metrics: [
      {
        name: t("nres.correctName"),
        displayValue: `${score.hits + score.correctRejections} / ${score.scored}`,
        meaning: t("nres.correctMeaning"),
      },
      {
        name: t("nres.hitsName"),
        displayValue: `${score.hits} / ${score.targets}`,
        meaning: t("nres.hitsMeaning"),
      },
      {
        name: t("nres.faName"),
        displayValue: `${score.falseAlarms}`,
        meaning: t("nres.faMeaning"),
      },
      {
        name: t("nres.comboName"),
        displayValue: `${score.longestStreak}`,
        meaning: t("nres.comboMeaning"),
      },
    ],
    youLabel: t("result.you"),
    typicalLabel: t("result.typical"),
    note: t("nres.note"),
    aboutTitle: t("result.aboutTitle"),
    about: ABOUT_KEYS.map((key) => t(key)),
    improveTitle: t("result.improveTitle"),
    tips: TIP_KEYS.map(([tk, bk]) => ({ title: t(tk), body: t(bk) })),
  };
}
