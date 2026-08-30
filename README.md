# vision-iq-training

Gabor-patch vision training + cognitive puzzles, mobile-first web app. See
[PLANNING.md](PLANNING.md) for the full design and roadmap.

**Status:** prototype. Local-only, no backend yet.

## Run

```
npm install
npm run dev          # Vite dev server, --host so a phone on the LAN can reach it
npm test             # vitest: gabor math, staircase, gauge, i18n parity
npm run build        # production build + PWA service worker -> dist/
npm run preview      # serve the built app (test the installable PWA here)

npm run lint         # eslint (typescript-eslint + react-hooks)
npm run format       # prettier --write
npm run check        # format:check + lint + typecheck + test  (what CI runs)
```

Node version is pinned in `.nvmrc` (24). CI (`.github/workflows/ci.yml`) runs
`npm run check` + `npm run build` on every push and PR.

## What works so far

- **Contrast detection task** (`src/tasks/ContrastDetection.tsx`) — 2AFC, a faint
  Gabor flashes inside the left or right marker ring, 3-down-1-up staircase
  (`src/lib/staircase.ts`) tracks the contrast threshold, result screen shows
  threshold + sensitivity. Minimal run: ends at 6 reversals or 30 trials; if the
  cap is hit first the estimate falls back to the mean of the last few trial
  levels. A "Not sure" button makes a forced random guess (valid for 2AFC). Both
  rings always paint a canvas and the patch layer is absolutely positioned, so a
  trial never resizes or flashes the ring — only the grating is a cue. Still
  prototype-tuning: timings, staircase params, and patch geometry need
  real-device iteration.
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

## PWA & deploy

`vite-plugin-pwa` produces a web manifest + service worker on `npm run build`
(app-shell precache, offline navigation fallback, auto-update). Icons are
generated from `public/icon.svg` — after editing it run
`node scripts/gen-icons.mjs`.

Install to a phone home screen: open the served URL, "Add to Home Screen"
(iOS needs Safari; Web Push needs iOS 16.4+).

Deploy: connect this repo to Vercel or Netlify. Vite is auto-detected — build
`npm run build`, output `dist/`. The service worker's `navigateFallback`
handles SPA routing; no extra rewrite config needed.

## Layout

- `src/lib/` — pure, DOM-free, unit-tested. Extract to `packages/shared` later.
  - `gabor.ts` — the `G(x,y)` formula and params.
  - `staircase.ts` — adaptive threshold engine.
- `src/render/` — canvas Gabor renderer + sprite cache (DOM-dependent).
- `src/tasks/` — individual task screens.
- `src/result/` — reusable result panel + scale maths.
- `src/i18n/` — JA/EN dictionaries + `useT()` / `useI18n()`.
- `src/ErrorBoundary.tsx` — top-level crash recovery card.
- `src/App.tsx` — trivial in-memory router.
- `public/` — PWA icons (`icon.svg` is the source). `scripts/gen-icons.mjs`
  rasterises it.

## Next

Matrix reasoning, N-back, block rotation, odd-one-out; then the daily-session
flow; then backend + social (deferred — see PLANNING.md).
