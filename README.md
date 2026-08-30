# vision-iq-training

Gabor-patch vision training + cognitive puzzles, mobile-first web app. See
[PLANNING.md](PLANNING.md) for the full design and roadmap.

**Status:** prototype. Local-only, no backend yet.

## Run

```
npm install
npm run dev        # Vite dev server, --host so a phone on the LAN can reach it
npm test           # vitest: gabor math + staircase convergence
npm run build      # production build to dist/
npm run typecheck
```

## What works so far

- **Contrast detection task** (`src/tasks/ContrastDetection.tsx`) — 2AFC, a faint
  Gabor flashes inside the left or right marker ring, 3-down-1-up staircase
  (`src/lib/staircase.ts`) tracks the contrast threshold, result screen shows
  threshold + sensitivity. Minimal run: ends at 5 reversals or 20 trials (~12-18
  trials typical). A "Not sure" button makes a forced random guess (valid for
  2AFC). Both rings always paint a canvas and the patch layer is absolutely
  positioned, so a trial never resizes or flashes the ring — only the grating is
  a cue. Still prototype-tuning: timings, staircase params, and patch geometry
  need real-device iteration.
- **Gabor lab** (`src/tasks/GaborLab.tsx`) — live parameter sliders over the
  renderer.

## Languages

Japanese and English. **Defaults to Japanese** for everyone right now; the topbar toggle
switches and the choice is remembered (`localStorage` `viq.lang`). Strings live in
`src/i18n/en.ts` (source of truth for keys) and `src/i18n/ja.ts`; components use
`useT()` / `useI18n()` from `src/i18n`. A test enforces key + placeholder parity between
the two files.

## Result screens (`src/result/`)

Reusable, meant for every task's result announcement:

- `ResultPanel.tsx` — score + a neutral **min→max scale** showing the domain
  ends, the typical range for normal vision, and the player's marker (no verdict
  text — the player reads it themselves), a short one-line meaning, and two
  collapsible sections: **"What this means"** and **"How to improve"** (cards).
- `gauge.ts` — pure scale maths (`buildScale`): marker position + typical-range
  span as 0..1 track positions; unit-tested; higher/lower-is-better + log scales.
- `contrastResult.ts` — builds the `ResultView` for contrast detection (bands,
  explanations, tips) from i18n keys. Add one `<task>Result.ts` per task.

All copy is intentionally short-sentence and lives in `src/i18n`.

## Layout

- `src/lib/` — pure, DOM-free, unit-tested. Extract to `packages/shared` later.
  - `gabor.ts` — the `G(x,y)` formula and params.
  - `staircase.ts` — adaptive threshold engine.
- `src/render/` — canvas Gabor renderer + sprite cache (DOM-dependent).
- `src/tasks/` — individual task screens.
- `src/App.tsx` — trivial in-memory router.

## Next

Matrix reasoning, N-back, block rotation, odd-one-out; then the daily-session
flow; then backend + social (deferred — see PLANNING.md).
