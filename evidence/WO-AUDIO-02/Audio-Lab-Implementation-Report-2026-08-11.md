# WO-AUDIO-02 — Audio-Lab Implementation Report

**Date:** 2026-08-11
**Branch / worktree:** `feature/audio-lab-v1` at `C:\eng-portal-worktrees\wo-audio-02`
**Baseline:** `origin/main` @ `19570cf6c7b5909f3eaf5c0666f09deedf64ac6c`
**Status:** Implementation complete; feature gate remains `DEVELOPMENT`. Deploy/push/merge **NOT** performed (not authorized).

## 1. Scope delivered

A Portal-native Audio Lab implemented per the WO-AUDIO-01 Portal Adaptation Plan, using the AI Studio canonical source (`index.html` → `src/main.ts` → `src/utils/audioEngine.ts` → `src/utils/wavEncoder.ts`) as a design reference only. No AI Studio framework, build tooling, or package was imported. Runtime is native HTML/CSS/ES modules/Web Audio/Canvas/MediaDevices/File/OfflineAudioContext/Blob — **zero third-party runtime dependencies**.

## 2. Files created / modified

| File | Type | Lines | Purpose |
|---|---|---:|---|
| `public/audio-lab.html` | new | 289 | Semantic Portal shell |
| `public/assets/css/audio-lab.css` | new | 284 | Scoped page styles, layered after `global-tokens.css`/`portal-quality.css` |
| `public/assets/js/audio-lab-engine.js` | new | 861 | DOM-independent Web Audio engine + pure/testable helpers |
| `public/assets/js/audio-lab.js` | new | 687 | Portal controller: DOM wiring, canvas rendering, a11y, privacy UX |
| `test/audio-lab/fake-audio-context.mjs` | new | 268 | Web Audio test doubles (no real browser/audio hardware required) |
| `test/audio-lab/pure-helpers.test.mjs` | new | 247 | UT-01,02,03,04,05,06,09,10,11,12,13,17 + file validation |
| `test/audio-lab/wav-encoding.test.mjs` | new | 110 | UT-14,15,16 |
| `test/audio-lab/engine.test.mjs` | new | 249 | UT-07,08,09,10,13 (integration against the real engine + fakes), export pipeline |
| `public/index.html` | modified (+29) | — | One Audio Lab job card added to the dashboard grid |
| `public/assets/data/versions.json` | modified (+21) | — | `audio-lab` page entry, version `0.1`, status `development` |

No Firebase Function, Gemini endpoint, auth/App Check, PowerShell Simulator, or ATP Simulator file was touched. `git status` in the worktree shows exactly the ten paths above (verified before evidence generation).

## 3. Architecture

### Engine/controller separation

`audio-lab-engine.js` exports both a stateful factory `createAudioLabEngine(overrides)` and a set of pure, DOM-independent helpers (gain conversion, bin mapping, band-peak detection, threshold validation, the alarm log, channel/phase gain computation, monitor-gate policy, deterministic-RNG-seamed noise generators, sweep scheduling, file validation, and WAV/PCM24 encoding). It has no DOM selectors, UI strings, Portal CSS logic, or network calls.

Unlike the AI Studio reference (module-level singleton state), the engine is a **factory**: every `createAudioLabEngine()` call returns an independent instance with its own closured audio graph and state. This was necessary for test isolation and is also a correctness improvement (multiple independent lab sessions never share hidden state).

All browser-only dependencies (AudioContext/OfflineAudioContext construction, `getUserMedia`, file decoding, timers, the noise RNG) are injected via an `overrides` object with browser-appropriate defaults, which is what makes the stateful engine unit-testable without a real browser (see the Automated Test Report).

`audio-lab.js` is the Portal controller: DOM event wiring, the RTA/waterfall canvas render loop, accessibility semantics, and privacy UX. It imports the engine and the pure helpers; it contains no Web Audio graph-construction logic of its own.

### Corrected audio graph (resolves SR-02/SR-03)

```
active source -> master gain -> channel splitter -> left/right phase gains -> channel merger
              -> analyser -> monitor gate -> destination
warning oscillator -> warning gain -> destination   (independent path, never touches any input node)
```

`setOutputControls()` (master gain, channel routing, phase inversion) always updates this one shared graph regardless of which source is active, so gain/channel/phase behave consistently across generator, file, and microphone sources — the AI Studio reference only reapplied these when the generator was the active source (SR-03). The analyser stays connected downstream of the merger even when the monitor gate is zero, so a silent microphone is still fully analyzed.

Monitor-gate policy (`computeMonitorGain`): the microphone is **never** connected to the destination (fixed at 0, no user-facing toggle exists to override it); generator and file sources are only audible while explicitly playing. This is a deliberately more conservative interpretation than "disabled by default" — no control was specified in the WO to re-enable microphone monitoring, so none was added.

### Transactional source switching (resolves SR-01)

`switchSource(type, opts)` fully prepares the candidate source — `getUserMedia()` for microphone, file validation + `decodeAudioData()` for file — **before** any teardown of the current valid source. A rejection or thrown error at any point leaves both the engine's internal state and the caller's UI exactly as they were; nothing is torn down and nothing is committed. Every generator/file/microphone node is torn down through one shared `teardownNode()` helper that stops (if applicable) and disconnects each node exactly once, then nulls the reference so it structurally cannot be torn down twice.

### Threshold and alarm log (resolves SR-04)

`findBandPeak()` iterates every real FFT bin between the configured min/max frequency (mapped via the true `sampleRate / fftSize` bin spacing), not canvas pixel positions. Visual RTA/waterfall rendering in the controller still samples per output pixel for drawing efficiency — that distinction (visual mapping vs. threshold computation) is exactly what SR-04 required. `AlarmLog` is a pure, DOM-independent class (capacity 50, 1000 ms hold interval, caller-supplied timestamp for testability); `audio-lab.js` renders its contents via `createElement`/`textContent` only (no `innerHTML`).

### Canvas lifecycle (resolves SR-05)

The render loop starts only after explicit engine activation, pauses on `visibilitychange` (`document.hidden`), and fully tears down (loop cancelled, `ResizeObserver`s disconnected, engine `teardown()` called) on `pagehide`. Both canvases use a `ResizeObserver` + `devicePixelRatio` to size their backing store; the waterfall's cached `ImageData` line buffer is invalidated on resize so it can never be `putImageData`'d at the wrong width.

The waterfall's `drawImage()`-based scroll-shift is retained as-is per WO section 12 — it is an accepted implementation choice, not a defect to rewrite to `getImageData()`.

### Export scope (resolves SR-06)

`exportGeneratorWav()` only ever renders the generator source. `validateExportConfig()` requires exactly `sampleRate: 96000`, `bitDepth: 24`, `channels: 2`, `exportSource: 'generator'`, and `durationSec` in `[1, 5, 10, 30]`; any other value is rejected with a descriptive error **before** any `OfflineAudioContext` is constructed (verified by a test asserting the offline-context factory is never invoked for a rejected config). The 24-bit encoder (`encodeWavPcm24`) only implements the one supported bit depth — there is no invalid 32-bit-float-with-PCM-format-tag branch as in the AI Studio reference.

### Accessibility (resolves SR-07)

Single `<h1>`, logical `<h2>` sections, native `<button>`s for every action, `<fieldset>`/`<legend>` for grouped controls, a keyboard-operable frequency-inspection `<output>` (replacing the AI Studio mouse-only canvas tooltip), `role="alert"` reserved for the source/export/threshold-config error regions, `role="status" aria-live="polite"` reserved for genuinely discrete state changes (engine activation, microphone active indicator, threshold normal/exceeded transitions) — all continuously-updating read-outs (`live-peak-readout`, the frequency-inspect `<output>`) are updated via a `setTextIfChanged()` guard so identical values never trigger a redundant DOM mutation/announcement at animation-frame rate. The alarm table has a `<caption>` and `scope="col"` headers. `prefers-reduced-motion` is handled globally by the existing `portal-quality.css` (neutralizes the alarm-pulse animation duration); the alarm state is always additionally conveyed as plain status text, never by animation alone. All interactive controls are ≥44×44 CSS px (`.btn`, `.al-radio-label`, `.al-checkbox-label` in `audio-lab.css`).

### CSS (resolves SR-08)

`audio-lab.css` loads after `global-tokens.css` and `portal-quality.css`, consumes only existing `--md-sys-color-*`/`--spacing-*`/`--radius-*` tokens, and defines a small set of module-local `--al-*` variables scoped under `.audio-lab-page`. No inline `style` attributes and no inline event handlers exist anywhere in `audio-lab.html`; the `.btn`/`.app-layout`/`.top-header` component classes are redefined locally in `audio-lab.css` because that is the Portal's established per-page pattern (confirmed by inspecting `ess-sim.css` and `powershell-sim.css`, which do the same rather than sharing a global component library).

### Dependencies (resolves SR-09) and versioning (resolves SR-10)

No `package.json`, dependency, or build step was introduced. `audio-lab.html` is loaded directly as static HTML with `<script type="module">`. The Portal `versions.json` records `audio-lab` at page version `0.1`, status `development`; the upstream AI Studio Rev.01 provenance is preserved only in the WO-AUDIO-01 evidence and in a footer provenance line (`al-provenance`), never as the Portal release version. The footer's `<div class="version-sync"><span></span></div>` matches the static markup actually present on `index.html`/`core-memory.html`/`legal-terms.html`/`ess-lab.html` in the authoritative baseline — `assets/js/version-display.js` exists in the repository but is not linked from any shipped page, so it was treated as not part of the current convention and was not wired in.

## 4. Scope decisions and known limitations

- **Microphone monitor is permanently silent** — no UI control exists to re-enable it, since the WO specified no such control and "must NOT reach speakers by default" is best satisfied by not offering the override at all.
- **File source play/stop mirrors the generator** (explicit Start/Stop rather than autoplay-on-decode) so "enabled only while explicitly playing" applies identically to both non-microphone sources, and so a stopped file source produces no analyser signal (nothing to silently analyze while not playing).
- **Mono source up-mixing** through the two-channel `ChannelSplitterNode` follows the Web Audio specification's explicit (non-up-mixing) behavior for that node type — this is documented, spec-guaranteed behavior, not something the engine works around; it is real-browser-verifiable only (BT-05).
- **No dedicated `audio_lab_preview.webp` was created.** The WO marks this asset optional. A self-contained inline SVG icon is used on the dashboard card instead of fabricating a new binary asset or reusing an unrelated existing image.
- **Brown-noise output is clamped to [-1, 1]** (the AI Studio reference did not clamp); pink/white noise generation is otherwise behaviorally equivalent to the reference algorithms.
- Full acoustic/spectral/interoperability correctness (oscillator frequency accuracy, noise spectral slope, sweep audibility, WAV interoperability with third-party tools, threshold calibration against a real microphone) is **not** claimed here — see the Local Validation report and the DEVICE PENDING / MANUAL AUDIO PENDING lists.
