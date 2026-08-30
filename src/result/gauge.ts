/**
 * Builds a neutral min→max scale for a result value: where the marker sits, and
 * where the "typical / normal vision" range falls, all as 0..1 positions along
 * the track. Pure — no DOM, no i18n, no verdicts. The UI just draws it.
 */
export interface ScaleSpec {
  /** Marker position, 0..1 (0 = domain min on the track). */
  position: number;
  /** Formatted domain endpoints for the axis labels. */
  minLabel: string;
  maxLabel: string;
  /** Highlighted "typical" span as 0..1 track positions, if a range was given. */
  typical?: { from: number; to: number; label: string };
}

const clamp01 = (n: number) => Math.min(1, Math.max(0, n));

export interface ScaleInput {
  value: number;
  /** Domain shown on the track. */
  min: number;
  max: number;
  /** If false, the track is flipped so low values sit on the right. */
  higherIsBetter?: boolean;
  /** Position values on a log scale (contrast, spatial frequency, …). */
  log?: boolean;
  /** Typical range for normal vision, in value units. */
  typicalRange?: [number, number];
  /** Formats a value for display (axis ends and the typical-range label). */
  format: (n: number) => string;
}

export function buildScale(input: ScaleInput): ScaleSpec {
  const { value, min, max, higherIsBetter = true, log = false, format } = input;

  const tx = (n: number) => {
    const v = Math.min(max, Math.max(min, n));
    const t = log
      ? (Math.log(v) - Math.log(min)) / (Math.log(max) - Math.log(min))
      : (v - min) / (max - min);
    return clamp01(higherIsBetter ? t : 1 - t);
  };

  const spec: ScaleSpec = {
    position: tx(value),
    minLabel: format(higherIsBetter ? min : max),
    maxLabel: format(higherIsBetter ? max : min),
  };

  if (input.typicalRange) {
    const [lo, hi] = input.typicalRange;
    const a = tx(lo);
    const b = tx(hi);
    spec.typical = {
      from: Math.min(a, b),
      to: Math.max(a, b),
      label: `${format(lo)}–${format(hi)}`,
    };
  }

  return spec;
}
