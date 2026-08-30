import type { ReactNode } from "react";
import type { ScaleSpec } from "./gauge";

export interface MetricView {
  name: string;
  displayValue: string;
  meaning: string;
  scale?: ScaleSpec;
}

export interface ResultView {
  metrics: MetricView[];
  /** Legend labels for the scale, shared by every metric. */
  youLabel: string;
  typicalLabel: string;
  note?: string;
  aboutTitle: string;
  about: string[];
  improveTitle: string;
  tips: { title: string; body: string }[];
}

function Scale({
  spec,
  youLabel,
  typicalLabel,
}: {
  spec: ScaleSpec;
  youLabel: string;
  typicalLabel: string;
}) {
  const pos = spec.position;
  const shift = pos < 0.12 ? "0%" : pos > 0.88 ? "-100%" : "-50%";
  return (
    <div className="scale">
      <div className="scale-track">
        {spec.typical && (
          <span
            className="scale-typical"
            style={{
              left: `${spec.typical.from * 100}%`,
              width: `${(spec.typical.to - spec.typical.from) * 100}%`,
            }}
          />
        )}
        <span className="scale-marker" style={{ left: `${pos * 100}%` }} />
        <span
          className="scale-you"
          style={{ left: `${pos * 100}%`, transform: `translateX(${shift})` }}
        >
          {youLabel}
        </span>
      </div>
      <div className="scale-ends">
        <span>{spec.minLabel}</span>
        <span>{spec.maxLabel}</span>
      </div>
      {spec.typical && (
        <div className="scale-legend muted">
          <span className="nowrap">
            <i className="sw sw-typical" /> {typicalLabel}
          </span>{" "}
          <span className="nowrap">({spec.typical.label})</span>
        </div>
      )}
    </div>
  );
}

function Disclosure({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <details className="disclosure">
      <summary>{title}</summary>
      <div className="disclosure-body">{children}</div>
    </details>
  );
}

/** Reusable result view: score + neutral scale + "what it means" + "how to improve". */
export function ResultPanel({ view }: { view: ResultView }) {
  return (
    <div className="result-panel">
      {view.metrics.map((m, i) => (
        <div className="metric" key={i}>
          <div className="metric-name muted">{m.name}</div>
          <div className="result-num">{m.displayValue}</div>
          <div className="metric-meaning">{m.meaning}</div>
          {m.scale && (
            <Scale
              spec={m.scale}
              youLabel={view.youLabel}
              typicalLabel={view.typicalLabel}
            />
          )}
        </div>
      ))}

      {view.note && <p className="muted result-note">{view.note}</p>}

      <Disclosure title={view.aboutTitle}>
        <ul className="about-list">
          {view.about.map((line, i) => (
            <li key={i}>{line}</li>
          ))}
        </ul>
      </Disclosure>

      <Disclosure title={view.improveTitle}>
        <div className="tip-grid">
          {view.tips.map((tip, i) => (
            <div className="tip-card" key={i}>
              <div className="tip-title">{tip.title}</div>
              <p className="tip-body">{tip.body}</p>
            </div>
          ))}
        </div>
      </Disclosure>
    </div>
  );
}
