# vision-iq-training — Planning

Working name: **vision-iq-training** (product name "EyeQ" TBD — check trademark before shipping).

## Context

A mobile-first web app that merges **Gabor-patch vision training** (contrast-sensitivity
exercise via perceptual-learning tasks) with **cognitive/IQ puzzles**, unified by a single
rendering primitive: *every task is drawn from Gabor patches*. A small closed group of users
share daily progress on a visual map to motivate a daily habit. **Delivered as a web app / PWA
only.** Native wrapping (Capacitor, per the sibling `vscode-mobile-companion` project) is
explicitly out of scope for now — revisit if/when it goes public.

Why: the user wants a daily-habit training tool for themselves and a few friends now, with a
path to a public product later. The dual vision+cognitive angle and the shared-progress map are
the differentiators.

A first-run **questionnaire** captures what each user wants to improve (near/reading vision,
distance, general contrast, or brain-training only) and screens for anisometropia / a weaker
eye and photosensitivity; the resulting **training profile** tunes the game's starting
parameters. The vision tasks follow the perceptual-learning protocol with published support
for **presbyopia** (GlassesOff / Polat: brief low-contrast Gabors, collinear flankers,
backward masking, near distance) and can run in a **monocular mode** for users with a weaker
eye (**anisometropia** / anisometropic amblyopia). See *Clinical targets & training profile*.
Framed as visual exercise, never medical treatment.

## Guiding decisions

| Area | Decision | Rationale |
|---|---|---|
| Frontend | React + Vite + TypeScript | Matches `vscode-mobile-companion`; Capacitor's documented path |
| Rendering | Canvas 2D with pre-rendered Gabor sprite cache; escalate to WebGL only if 60fps fails | Gabor is expensive per-pixel; render once, then transform |
| Backend | Supabase (Postgres + Auth + RLS + Realtime + Edge Functions) | Free tier covers it; Sign in with Apple built in; scales to product phase |
| pCloud | Optional later — "export my training data" only | File store, not a DB; can't do concurrent leaderboard writes |
| Hosting | Vercel or Netlify for the PWA; Supabase hosts backend | Zero-friction GitHub deploy |
| Native | Out of scope — web/PWA only for now | Revisit for a public launch |
| Monorepo | pnpm workspaces: `shared`, `web` | Keeps the pure logic testable in isolation |
| i18n | Japanese + English; tiny custom dict + `useT()` hook, no i18n library yet | Only ~30 strings; swap for an established lib if plural rules / rich formatting are needed |

Language: ships **Japanese-default** now (English via a remembered toggle). All new UI strings
go through the `src/i18n` dictionaries — `en.ts` is the key source of truth, `ja.ts` must match
(a parity test enforces it). Locale auto-detection from `navigator.language` is a later add.

## Repo layout (target)

```
vision-iq-training/
  package.json                # pnpm workspace root
  pnpm-workspace.yaml
  packages/
    shared/                   # pure TS, unit-tested, no DOM
      gabor/                  # G(x,y) formula, patch param types
      staircase/              # 3-down-1-up / QUEST adaptive engine
      scoring/                # composite score, CSF trend
      daily/                  # seeded RNG for the shared daily challenge
      types/                  # shared domain + Supabase row types
    web/                      # React + Vite PWA
      src/render/             # canvas Gabor renderer + sprite cache
      src/tasks/              # contrast-detection, matrix, n-back, rotation, odd-one-out
      src/session/            # daily workout flow + calibration/warm-up
      src/social/             # group, leaderboard, progress map
      src/data/               # Supabase client, offline queue, sync
      public/                 # PWA manifest, service worker, icons
  supabase/
    migrations/               # schema
    functions/                # edge functions (submit-session, daily-seed)
```

## Gabor rendering (`packages/shared/gabor` + `packages/web/src/render`)

Reference formula (from user):

```
G(x,y) = exp(-(x'^2 + g^2 * y'^2) / (2 * s^2)) * cos(2*pi * x'/l + p)
x' = x*cos(theta) + y*sin(theta)
y' = -x*sin(theta) + y*cos(theta)
theta = orientation, l = wavelength (spatial freq), p = phase, g = aspect ratio, s = Gaussian SD
```

- `shared/gabor` holds the math + `GaborParams` type + validation. No canvas dependency.
- `web/src/render` renders params to an `OffscreenCanvas`/`<canvas>` via `ImageData`, keyed by a
  hash of the params → **sprite cache** (`Map<string, canvas>`). Draw = `drawImage` + transform.
- Contrast is applied as a multiplier on the cos term, mapped around mid-grey (128). Provide a
  `contrast: 0..1` field; actual on-screen contrast is uncalibrated (documented limitation).
- Support: static, phase-drift (for detection tasks), and a "no flicker" accessibility mode.

## Core task types (`packages/web/src/tasks`)

Each task implements a common interface: `start(config) -> renders -> onResponse -> {correct, rt, nextConfig}`.
The adaptive engine in `shared/staircase` drives difficulty.

1. **Contrast detection** (vision core, v1 first). Two intervals or 2-AFC location; patch present
   at adaptive contrast. 3-down-1-up staircase converges on ~79% threshold. ~40 trials.
   - **Lateral-masking / collinear-flanker variant** — the target Gabor is flanked by
     high-contrast collinear Gabors at a controlled separation (in units of wavelength). This
     is the configuration the presbyopia perceptual-learning literature (GlassesOff / Polat)
     actually uses; it drives collinear facilitation. Same staircase, extra `flankers` config.
   - **Backward-masking / temporal constraint** — target flashes, then a noise/plaid mask after
     a stimulus-onset asynchrony that shortens as the user improves. Already seeded by the
     fixed exposure in the prototype.
   - Every vision task carries an `eye: "both" | "left" | "right"` field (see Clinical targets).
2. **Gabor matrix reasoning** (fluid intelligence). 3x3 grid, bottom-right blank, 6 options.
   Rules operate on orientation / spatial frequency / contrast (e.g. "orientation +30 deg per
   column, contrast halves per row"). Procedurally generated from a rule DSL. **Prototype one
   puzzle early to check legibility** before building the full generator.
3. **Gabor N-back** (working memory). Sequential patches; match orientation OR spatial frequency
   to N steps back. N adapts up/down with accuracy. Start single-stream; dual N-back as a toggle.
4. **Gabor block rotation** (spatial). 3D block figure, faces textured with Gabor lines; "same"
   vs "mirror" decision. RT is the metric.
5. **Rapid odd-one-out** (processing speed). Grid of identical patches, one deviant in
   orientation or contrast; tap it under a tight timer. Grid size / deviation adapt.

## Clinical targets & training profile (future — planned, not in the prototype)

Not medical treatment and no medical claims in any copy. All of this is framed as
"visual exercise, alongside — not instead of — your eye-care professional."

### Onboarding questionnaire → `TrainingProfile`

A short first-run questionnaire builds a `TrainingProfile` stored on the user (local now,
`profiles` row later). It sets the *starting* task parameters; per-task adaptivity and the
progression band take over from there. Re-askable from settings.

Questions (branching, ~6 taps):
1. **Primary goal** — sharper near/reading vision · sharper distance vision · general contrast &
   processing speed · brain-training only (skip vision tuning).
2. **Age band** — drives baseline expectations and default spatial-frequency range.
3. **Do you wear correction for this task?** — none · reading glasses · distance glasses ·
   contacts (incl. multifocal) · progressives. (Multifocal-contact wearers are a known
   perceptual-learning population — neuroadaptation.)
4. **Is one eye noticeably weaker / blurrier than the other?** (anisometropia signal) →
   if yes: 4a. **Diagnosed lazy eye (amblyopia) and under an eye doctor's care?**
   4b. **Any double vision, or diagnosed eye-turn (strabismus)?**
5. **History of seizures / photosensitivity?** — forces the no-flicker, static-only path.
6. **Screen distance you'll usually train at** — feeds the px/degree calibration.

### How the profile adjusts the game

| Profile signal | Adjustment |
|---|---|
| Goal = near/reading | Near-distance mode (~40 cm target), higher spatial frequencies (near acuity limit), collinear-flanker + backward-masking variant emphasised — the presbyopia protocol |
| Goal = distance | Lower/mid spatial frequencies, longer viewing distance prompt |
| Goal = brain-training only | Vision block minimised to a short warm-up; cognitive block expanded |
| Older age band | Gentler starting contrast, wider SF sweep, more trials per staircase |
| Multifocal-contact wearer | Flanker/neuroadaptation emphasis, both-eyes mode |
| One weaker eye (no strabismus/diplopia) | Unlock **monocular mode**: "cover your other eye" blocks that train the weak eye on its own staircase; per-eye baselines & trend lines. Dichoptic (anaglyph) mode offered later. |
| Strabismus / diplopia / untreated | Monocular & dichoptic modes hidden; both-eyes only; stronger "see your eye doctor" prompt |
| Photosensitivity | Static patches only, no phase drift, no masking flash animation |

### Anisometropia support tiers

- **Tier 1 — monocular mode** (small, add with the profile work): per-eye `TrainingProfile`
  fields, per-eye staircases and baselines, a covered-eye training block with a timer.
- **Tier 2 — dichoptic mode** (later, real feature): red/cyan anaglyph rendering — signal to
  one eye's colour channel at boosted contrast, background to both — to rebalance suppression
  (Hess-style). Cardboard split-screen is an alternative. Gated behind the strabismus/diplopia
  screen.

## Daily workout flow (`packages/web/src/session`)

1. **Calibration / warm-up (~45s):** brightness lock (Capacitor plugin later; on web, prompt),
   "dim the room" prompt, credit-card-width slider → px/mm, viewing-distance prompt → px/degree.
   Persisted; re-prompt weekly. First-ever launch: baseline contrast-sensitivity test + epilepsy
   warning + non-medical disclaimer.
2. **Vision block (~6 min):** contrast detection + one other vision task, adaptive.
3. **Cognitive block (~5 min):** rotates through matrix / n-back / rotation / odd-one-out.
4. **Result screen:** composite score, contrast-threshold trend line, streak, group standing.
   Each metric's scale also carries a sparkline from the progress history (see *Progress
   history*). Uses the reusable `src/result/ResultPanel` — every metric gets a neutral min→max scale
   showing the domain ends, the typical range for normal vision, and the player's marker (no
   verdict text — the player interprets it), a one-line plain meaning, a collapsible "What this
   means" (short lines), and a collapsible "How to improve" with real-world exercise cards. Copy
   is short-sentence and naturally phrased per language (JA is not a literal translation), in
   `src/i18n`. Each task ships a `<task>Result.ts` that builds its `ResultView`. Keep this
   pattern for all result announcements. Typical ranges are rough anchors (uncalibrated screen).

Session = the unit of progression. One counted session per calendar day (server-owned date).
Optional 1-2 **bonus practice rounds/day**: cosmetic rewards only, do not advance the map or streak.

## Progress history — the vision tracker (`packages/web/src/history`)

Treat the eye-test outputs like a health-tracker app: every completed measurement is a
timestamped data point the user can review over weeks and months.

- **Metrics tracked over time:** contrast sensitivity, contrast threshold, and (as they land)
  each later task's headline number — plus the baseline re-test. Stored per `eye`
  (`both` / `left` / `right`) so a weaker eye's trend is separable.
- **Storage:** local first — an append-only `measurements` store in IndexedDB
  (`{ id, taskId, metric, eye, value, unit, takenAt, sessionId }`). Later this is just a
  projection of the `sessions` rows synced to Supabase; the history view reads the local store
  either way, so it works offline and pre-backend.
- **Result screen:** under each metric's scale, add a **sparkline** of the last ~10 points with
  the typical-range band shaded behind it — same visual language as the scale, so "where I am"
  and "where I'm heading" read together.
- **History view** (its own screen, reachable from home/profile): per-metric line chart, range
  selector (month / 3 months / year / all), the typical-range band overlaid, and a plain
  read-out of change ("contrast sensitivity: 34 → 51 over 6 weeks"). Toggle eyes. Export CSV
  later (ties into the optional pCloud export).
- **Honesty guards:** show a min-points threshold before drawing a trend line (e.g. ≥5),
  render individual points until then; label the axis "your device, uncalibrated"; never
  extrapolate or forecast. A sharp real drop surfaces the "worth an eye exam" note, not a
  diagnosis.
- **Reuse:** the chart component is metric-agnostic (`MetricSeries` → chart), so cognitive
  tasks can plug into the same tracker later.

## Progression + social (`packages/web/src/social`)

- **Map position = total counted sessions completed** (not absolute stage number), so late
  joiners aren't permanently behind and consistency is what's rewarded.
- Difficulty ramps along the path (scripted band) on top of per-task adaptivity.
- **Groups:** create/join by invite code. Group view shows members' avatars along the shared
  path + a **weekly leaderboard** (streak length, weekly composite score).
- Build the **weekly leaderboard first** (reads well for 3-5 people); the illustrated avatar map
  is a later visual layer over the same data.
- Visibility opt-in; show "nearest neighbors" rather than a global rank to avoid last-place demotivation.
- Streaks + one **streak-freeze token** per week; daily reminder (local notification now, push later);
  weekly recap card. Cosmetic unlocks: patch color themes, avatar frames. **No lives/energy gating.**

## Backend (`supabase/`)

Tables (RLS on all): `profiles` (incl. `training_profile` JSON from onboarding), `groups`,
`group_members`, `sessions` (one row per completed session: date, `eye`, per-task metrics,
composite score, raw trial log JSON), `daily_challenges` (date → seed, server-generated).
Per-eye trend queries filter `sessions.eye`.

Edge Functions:
- `daily-seed` — returns today's seed for the caller's date; creates the row if absent.
- `submit-session` — receives raw trial log, **recomputes** the composite score server-side
  (client score advisory), validates timestamp/date, writes the `sessions` row. Anti-cheat seam.

Offline: completed sessions queue in IndexedDB, flushed to `submit-session` on reconnect.

## Native wrapper — out of scope

No Capacitor / native build for now. The app is installable to the home screen as a PWA on
iOS and Android, which covers the closed-group phase. If a public launch happens later,
revisit Capacitor per the `vscode-mobile-companion` project; nothing in this plan blocks that
(keep web assets self-contained, auth token in durable storage, no server-side session cookies).

Consequence for notifications: **local reminders only** (Notification API / scheduled via the
service worker where supported). Real push (APNs/FCM) waits for the native phase. iOS PWA Web
Push needs iOS 16.4+ and the app added to the home screen.

## Known risks / open items

- Uncalibrated contrast → leaderboard ranks improvement-vs-baseline and puzzle performance, not
  raw thresholds. Revisit if it feels unfair.
- Perceptual-learning gains are slow, specific, and modest; IQ-task transfer is contested. Copy
  stays non-medical. Motivation system, not results, drives retention.
- Matrix-reasoning legibility with Gabor textures is unproven — gated by an early prototype.
- Staircase tuning needs real-user data iteration.
- Clinical framing risk: presbyopia/anisometropia targeting must stay "exercise, not treatment"
  in every string, or it's an App Store rejection and a credibility problem. Legal review of
  copy before any public launch. Monocular/dichoptic modes need the strabismus/diplopia screen
  wired before they ship.
- Solo-dev scope is large; phases below are ordered so there is something playable after Phase 2.

## Current status (2026-08-29)

Building the **game prototype first**, local-only, no backend. DB sync (Supabase or
alternative) is deferred — revisit after the core loop is fun. For the prototype only, we skip
the pnpm monorepo and use a single Vite + React + TS app; pure logic still lives DOM-free under
`src/lib/` so it can be extracted to `packages/shared` later. Tooling: npm (no pnpm installed),
Node 24. i18n live (JA default + EN).

Contrast-detection task: playable end-to-end, minimal run (5 reversals / 20-trial cap → result,
~12-18 trials). "Not sure" button = forced random guess (valid for 2AFC). Fixed the early
giveaway where the stimulus box resized/brightened — stage is now uniform grey with constant
marker rings, both rings always canvas-painted, patch layer absolutely positioned. Topbar
buttons have a fixed footprint so EN/JA label swaps don't reflow. Still needs real-device
tuning of timings / staircase / patch geometry, and a proper inter-trial mask (currently a
plain blank). Next: matrix reasoning prototype.

## Phased build

**Phase 0 — Scaffold.** pnpm workspace, `shared` + `web` packages, Vite + React + TS, PWA
manifest + service worker, lint/test setup, Vercel/Netlify deploy from GitHub.

**Phase 1 — Gabor engine.** `shared/gabor` formula + tests; `web/src/render` canvas renderer +
sprite cache; a dev page rendering patches with live param sliders.

**Phase 2 — First playable loop.** Contrast-detection task + `shared/staircase` 3-down-1-up;
minimal session flow (warm-up → vision block → result); local-only score history. **Milestone:
a daily session you can actually run on the iPad in Safari.**

**Phase 3 — Full task set.** Matrix (prototype-then-generator), N-back, block rotation,
odd-one-out. Cognitive block wired into the session. Composite scoring in `shared/scoring`.

**Phase 3.2 — Progress history / vision tracker.** Append-only `measurements` store in
IndexedDB; per-metric, per-eye. Sparkline under each result-screen scale; a dedicated history
view with range selector and typical-range overlay. Metric-agnostic chart component. Honesty
guards (min points before a trend line, no forecasting). Becomes a projection of synced
`sessions` in Phase 4.

**Phase 3.5 — Onboarding questionnaire + training profile.** First-run questionnaire →
`TrainingProfile` (local); profile-driven starting parameters; collinear-flanker + backward-
masking variants of contrast detection; monocular mode + per-eye baselines/trend lines;
photosensitivity → static-only path. Non-medical disclaimer + strabismus/diplopia screen.
(Dichoptic/anaglyph mode deferred to a later phase.)

**Phase 4 — Backend + social.** Supabase project, schema + RLS, auth (email magic-link is
enough for the closed group; add OAuth providers later), `daily-seed` + `submit-session`
functions, offline queue + sync, groups + invite codes,
weekly leaderboard, streaks, daily local reminder (Notification API / service worker).

**Phase 5 — Progress map.** Illustrated avatar map over the group data; cosmetic unlocks;
weekly recap. Ship to the closed group here.

## Verification

- `pnpm test` in `shared` — gabor math, staircase convergence (simulated observer converges to
  known threshold), daily-seed determinism, scoring.
- `pnpm --filter web dev` → open on desktop + on the iPad mini over LAN; run a full daily
  session; confirm 60fps on the odd-one-out grid on the oldest target device.
- Supabase: local `supabase start`; integration test that `submit-session` rejects a tampered
  score and a wrong-date submission; two clients see each other on the leaderboard via Realtime.
- PWA: Lighthouse PWA audit passes; installs to home screen on iPad; works fully offline after
  first load; queued session syncs on reconnect.
- Onboarding: each questionnaire answer path produces the expected `TrainingProfile` (unit
  tests on the profile-builder in `shared`); "photosensitivity = yes" removes all flicker/mask
  animation; "weaker eye + no strabismus" unlocks monocular mode and "strabismus/diplopia"
  keeps it hidden; monocular sessions record the correct `eye` and show a per-eye trend line.
