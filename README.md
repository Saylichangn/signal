# SIGNAL — skill console website

A functional, interactive single-page build of the SIGNAL mockups. Plain HTML/CSS/JS — no build step.

## Run it

Open `index.html` directly in a browser, or serve the folder:

```
python -m http.server 8080
```

then visit `http://localhost:8080`.

## What's interactive

- **Header / navigation** — anchor links to every section, active-section highlighting, mobile menu.
- **Console** ("Open the console") — writable journal with writing prompts, word count, and local save.
- **Live monitor** — animated dual-channel waveform; drag across it to scrub time.
- **Channel faders** — dragging them updates frequencies and the waveform in real time.
- **Wise Mind** — editable line, balance slider, Hold On / Turn Toward toggles.
- **Switchboard** — skill chips jump to the relevant instrument.
- **STOP dial** — 20-second, four-phase timer with progress ring.
- **TIPP switches + dive-reflex slider**, with state saved locally.
- **Opposite Action** — invert toggle flips the plotted wave.
- **Check the Facts** — editable forecast/report lines, intensity sliders, forecast↔report swap.
- **Window of Tolerance** — draggable "you are here" marker.
- **4-7-8 pacer** — animated ring, phase countdown, 3-minute session timer, play/pause.
- **5-4-3-2-1 grounding** — clickable sense counters.
- **DEAR MAN patch bay** — seven editable lines, re-patch animation, assemble/copy the sentence to the journal, 38-second read-aloud timer.
- **Cognitive triangle** — drag any node; connecting lines follow.
- **Thought record** — editable fields, distortion chips, add-evidence, belief rating, save to journal.
- **The 90-second wave** — playable animated chemistry curve.
- **Print field card** — opens the browser print dialog with a print stylesheet.

Everything you type is stored in this browser's `localStorage` only. Nothing is sent anywhere.

## Backgrounds

The moody forest / nature photos in `assets/` are locally downloaded free stock photos (Unsplash) chosen to match the mockups. The dark overlays that keep text readable are applied in CSS, so you can swap any photo by replacing the matching file in `assets/` without touching the code.
