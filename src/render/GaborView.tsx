import { useEffect, useRef } from "react";
import { type GaborParams } from "../lib/gabor";
import { renderGaborSprite } from "./gaborSprite";

interface Props {
  params: GaborParams;
  /** Rendered sprite resolution in device-independent px. */
  size: number;
}

/** Draws a cached Gabor sprite onto a canvas, DPR-aware. */
export function GaborView({ params, size }: Props) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 3);
    const pxSize = Math.round(size * dpr);
    canvas.width = pxSize;
    canvas.height = pxSize;
    canvas.style.width = `${size}px`;
    canvas.style.height = `${size}px`;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const sprite = renderGaborSprite(params, pxSize);
    ctx.clearRect(0, 0, pxSize, pxSize);
    ctx.drawImage(sprite, 0, 0);
  }, [params, size]);

  return <canvas ref={ref} aria-hidden="true" />;
}
