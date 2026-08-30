import { useState } from "react";
import { DEFAULT_GABOR, type GaborParams, toDeg, toRad } from "../lib/gabor";
import { GaborView } from "../render/GaborView";
import { useT } from "../i18n";
import type { StringKey } from "../i18n/en";

interface Props {
  onExit: () => void;
}

interface Ctl {
  key: keyof GaborParams;
  labelKey: StringKey;
  min: number;
  max: number;
  step: number;
  toView?: (n: number) => number;
  fromView?: (n: number) => number;
  fmt?: (n: number) => string;
}

const CONTROLS: Ctl[] = [
  {
    key: "theta",
    labelKey: "lab.orientation",
    min: 0,
    max: 180,
    step: 1,
    toView: toDeg,
    fromView: toRad,
    fmt: (n) => `${n.toFixed(0)}°`,
  },
  { key: "wavelength", labelKey: "lab.wavelength", min: 4, max: 80, step: 1 },
  { key: "sigma", labelKey: "lab.sigma", min: 4, max: 80, step: 1 },
  { key: "aspect", labelKey: "lab.aspect", min: 0.2, max: 3, step: 0.1 },
  {
    key: "phase",
    labelKey: "lab.phase",
    min: 0,
    max: 360,
    step: 5,
    toView: toDeg,
    fromView: toRad,
    fmt: (n) => `${n.toFixed(0)}°`,
  },
  {
    key: "contrast",
    labelKey: "lab.contrast",
    min: 0.01,
    max: 1,
    step: 0.01,
    fmt: (n) => `${(n * 100).toFixed(0)}%`,
  },
];

/** Dev playground: render a Gabor patch with live parameter sliders. */
export function GaborLab({ onExit }: Props) {
  const t = useT();
  const [params, setParams] = useState<GaborParams>({
    ...DEFAULT_GABOR,
    wavelength: 22,
    sigma: 30,
  });

  return (
    <div className="screen">
      <h2>{t("lab.heading")}</h2>
      <div style={{ background: "var(--grey)", borderRadius: 16, padding: 24 }}>
        <GaborView params={params} size={220} />
      </div>
      {CONTROLS.map((c) => {
        const raw = params[c.key];
        const view = c.toView ? c.toView(raw) : raw;
        return (
          <div className="slider-row" key={c.key}>
            <label htmlFor={c.key}>{t(c.labelKey)}</label>
            <input
              id={c.key}
              type="range"
              min={c.min}
              max={c.max}
              step={c.step}
              value={view}
              onChange={(e) => {
                const v = Number(e.target.value);
                const next = c.fromView ? c.fromView(v) : v;
                setParams((p) => ({ ...p, [c.key]: next }));
              }}
            />
            <output>{c.fmt ? c.fmt(view) : view.toFixed(1)}</output>
          </div>
        );
      })}
      <button onClick={onExit}>{t("common.back")}</button>
    </div>
  );
}
