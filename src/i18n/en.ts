/** English strings. Keys are shared across every language file. */
export const en = {
  "nav.title": "vision-iq-training · prototype",
  "nav.home": "Home",

  "common.back": "Back",
  "common.start": "Start",
  "common.done": "Done",
  "common.runAgain": "Run again",

  "lang.switchTo": "日本語",

  "home.heading": "Prototype",
  "home.blurb":
    "Local-only. Working so far: contrast detection, matrix reasoning, and a Gabor parameter playground.",
  "home.contrast": "Contrast detection",
  "home.matrix": "Matrix reasoning",
  "home.lab": "Gabor lab",

  "contrast.heading": "Contrast detection",
  "contrast.intro":
    "A faint striped patch flashes briefly inside the left or right circle. Tap the side you think it appeared on, or “Not sure” to let it pick for you. It gets fainter as you improve.",
  "contrast.tip":
    "Hold the device about arm's length away, screen brightness up, room lights dimmed.",
  "contrast.start": "Start",
  "contrast.done": "Done",
  "contrast.trialsDone": "{trials} trials",
  "contrast.runAgain": "Run again",
  "contrast.hudTrial": "trial {n}/{max}",
  "contrast.hudReversals": "reversals {n}/{max}",
  "contrast.leftSquare": "left side",
  "contrast.rightSquare": "right side",
  "contrast.notSure": "Not sure",

  "matrix.heading": "Matrix reasoning",
  "matrix.intro":
    "Every grid follows a hidden rule across its rows and columns. Pick the patch that completes the bottom-right cell.",
  "matrix.progress": "{n} / {max}",

  "mres.correctName": "Correct",
  "mres.correctMeaning": "Puzzles you solved this round.",
  "mres.timeName": "Median time",
  "mres.timeMeaning": "Half your answers were faster than this.",
  "mres.about1": "This is pattern reasoning — finding a rule and applying it.",
  "mres.about2":
    "Practice helps, but the gains stay mostly specific to this kind of puzzle.",
  "mres.about3":
    "Speed and accuracy trade off. Rushing usually costs correctness.",

  "mtip.scan.t": "Check rows and columns separately",
  "mtip.scan.b": "Find one rule at a time, then combine them.",
  "mtip.eliminate.t": "Rule options out",
  "mtip.eliminate.b": "Reject any option that breaks a rule you already found.",
  "mtip.variety.t": "Mix up your puzzles",
  "mtip.variety.b": "Varied puzzle types transfer better than drilling one.",
  "mtip.sleep.t": "Sleep on it",
  "mtip.sleep.b": "Reasoning drops fast when you are short on sleep.",
  "mtip.daily.t": "Short and regular",
  "mtip.daily.b": "A few minutes daily beats an occasional long session.",

  "result.note":
    "Rough guide — the screen is not calibrated. Your trend over time matters more than one score.",
  "result.aboutTitle": "What this means",
  "result.improveTitle": "How to improve",
  "result.you": "You",
  "result.typical": "Typical range",

  "cres.sensitivityName": "Contrast sensitivity",
  "cres.thresholdName": "Contrast threshold",
  "cres.meaning":
    "The faintest pattern you could still spot. Higher is better.",
  "cres.thresholdMeaning": "How much contrast you needed. Lower is better.",
  "cres.about1":
    "Not the same as an eye-chart score. That is small letters; this is faint patterns.",
  "cres.about2":
    "It affects night driving, fog, seeing faces, and low-contrast text.",
  "cres.about3":
    "Your phone is not calibrated. Compare only your own runs on this device.",
  "cres.about4": "A steady drop over weeks is worth an eye exam.",

  "ctip.daily.t": "Keep the daily patch drill",
  "ctip.daily.b":
    "This Gabor task is the targeted exercise. Short and daily beats long and rare.",
  "ctip.light.t": "Read in bright, even light",
  "ctip.light.b":
    "Good light widens the range you can use. Dim, patchy light strains it.",
  "ctip.glare.t": "Cut glare",
  "ctip.glare.b":
    "Clean your screen and glasses. Keep light from reflecting off the screen.",
  "ctip.breaks.t": "Rest your eyes",
  "ctip.breaks.b":
    "Every 20 minutes, look far away for 20 seconds. Tired eyes lose contrast.",
  "ctip.checkup.t": "See an optometrist if it keeps dropping",
  "ctip.checkup.b":
    "A real decline can mean dry eye or cataract. Worth a check.",

  "lab.heading": "Gabor lab",
  "lab.orientation": "orientation",
  "lab.wavelength": "wavelength",
  "lab.sigma": "gaussian width",
  "lab.aspect": "aspect",
  "lab.phase": "phase",
  "lab.contrast": "contrast",
} as const;

export type StringKey = keyof typeof en;
