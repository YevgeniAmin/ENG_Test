# WO-AUDIO-02 — Audio-Lab Automated Test Report

**Date:** 2026-08-11
**Runner:** Node.js built-in test runner (`node:test` / `node:assert/strict`) — no npm install, no third-party test framework
**Node version:** v24.15.0
**Command:** `node --test test/audio-lab/pure-helpers.test.mjs test/audio-lab/wav-encoding.test.mjs test/audio-lab/engine.test.mjs`
**Network:** none used or required; all modules are local file imports
**Result:** **43 / 43 PASS, 0 fail, 0 skipped**, duration 207.8 ms

## 1. Method

Every test imports `public/assets/js/audio-lab-engine.js` directly (the exact file that ships to the browser) via native ES module `import`. Stateful engine tests (`engine.test.mjs`) inject a hand-written Web Audio test double (`test/audio-lab/fake-audio-context.mjs`) through the engine's dependency-injection seam (`createAudioLabEngine(overrides)`) — no real `AudioContext`, microphone, or browser is required or was used. The fakes track connect/disconnect/start/stop call counts and record every `AudioParam` automation call, which is what makes exact teardown counts (UT-08) and sweep automation sequencing (UT-13) verifiable without a browser.

`FakeOfflineAudioContext` approximates offline rendering (mixes registered oscillator/buffer sources into an output buffer) well enough to prove the export pipeline wires together and produces a correctly shaped WAV; it is **not** a claim of bit-exact spectral/level correctness against a real browser's `OfflineAudioContext` — that remains BT-18/MT-01..MT-10.

## 2. Hard-gate coverage (WO-AUDIO-02 section 19)

| Gate | UT ID(s) | Result |
|---|---|---|
| Gain conversion | UT-01 | PASS (3 tests) |
| Bin mapping | UT-02 | PASS (2 tests) |
| Exact band peak | UT-03 | PASS (3 tests) |
| Threshold validation | UT-04 | PASS (2 tests) |
| Alarm cap | UT-05 | PASS |
| Alarm hold interval | UT-06 | PASS (2 tests) |
| Transactional switching | UT-07 | PASS (4 tests) |
| Teardown | UT-08 | PASS (3 tests) |
| Monitor policy | UT-09 | PASS (2 tests: pure + integration) |
| Channel/phase | UT-10 | PASS (2 tests: pure + integration) |
| Deterministic noise | UT-11, UT-12 | PASS (6 tests) |
| Sweep scheduling | UT-13 | PASS (4 tests: pure + integration, incl. cleanup) |
| WAV RIFF header | UT-14 | PASS |
| PCM24 encoding | UT-15 | PASS (2 tests) |
| Unsupported export rejection | UT-16 | PASS (2 tests) |
| Download filename | UT-17 | PASS (2 tests) |

Also covered, beyond the minimum gate: `validateAudioFile` (file type/size validation), `encodeWavPcm24` malformed-input rejection, and an end-to-end `exportGeneratorWav` happy-path test against `FakeOfflineAudioContext` confirming header fields and byte length for a 1-second 96 kHz stereo render.

## 3. Notable finding from this test run

The first run of `engine.test.mjs` **failed** two UT-13 cases with `TypeError: osc[schedule.rampMethod] is not a function`. Root cause: `audio-lab-engine.js` called `osc.exponentialRampToValueAtTime(...)`/`osc.linearRampToValueAtTime(...)` directly on the oscillator node instead of on `osc.frequency` (the `AudioParam`), in both the live (`startSweep`) and offline-export sweep paths. This would have silently broken every sweep waveform in a real browser (`TypeError` on start). Fixed at `public/assets/js/audio-lab-engine.js:558` and `:787` (now `osc.frequency[schedule.rampMethod](...)`); re-run passed. This is direct evidence the test suite has real defect-catching power, not just tautological coverage.

## 4. Full console output

```
✔ UT-07 a failed microphone request never changes the active source (3.0769ms)
✔ UT-07 a failed file decode never changes the active source away from the prior valid one (1.0152ms)
✔ UT-07 an invalid file is rejected before any decode attempt (0.4557ms)
✔ UT-07 a successful switch commits the new source (0.4348ms)
✔ UT-08 switching away from a playing generator stops and disconnects it exactly once (0.7099ms)
✔ UT-08 stopping the microphone disconnects the source node and stops every track exactly once (0.8921ms)
✔ UT-08 stopping a playing file source stops and disconnects the buffer source exactly once (0.7912ms)
✔ UT-09 the monitor gate stays at zero for microphone and only opens for generator/file while playing (0.7606ms)
✔ UT-10 setOutputControls updates the left/right phase gain nodes as expected (0.7171ms)
✔ UT-13 a logarithmic sweep schedules correct start/end automation and reschedules without overlap (4.3871ms)
✔ UT-13 stopping the generator during a sweep cancels the pending reschedule timer (0.6256ms)
✔ exportGeneratorWav rejects an unsupported configuration before touching the offline renderer (1.0338ms)
✔ exportGeneratorWav produces a well-formed 24-bit/96kHz stereo WAV for an approved configuration (20.0588ms)
✔ UT-01 dbToLinearGain matches 10^(dB/20) within tolerance (2.5951ms)
✔ UT-01 dbToLinearGain returns zero when muted regardless of dB (0.4178ms)
✔ UT-01 dbToLinearGain is safe for non-finite input (0.3473ms)
✔ UT-02 frequencyToBinIndex maps known frequencies at 44.1/48/96 kHz (0.4941ms)
✔ UT-02 frequencyToBinIndex clamps invalid/out-of-range input to a safe bin (0.5121ms)
✔ UT-03 findBandPeak returns the highest in-band bin, ignoring out-of-band peaks (0.8161ms)
✔ UT-03 findBandPeak picks a peak exactly at a band edge (0.405ms)
✔ UT-03 findBandPeak returns null for an empty/invalid band (0.3468ms)
✔ UT-04 validateThresholdBand rejects NaN, reversed range, and Nyquist overrun (0.6416ms)
✔ UT-04 isThresholdExceeded triggers on equality and never on non-finite input (0.7498ms)
✔ UT-05 AlarmLog retains exactly 50 newest events in order (1.2171ms)
✔ UT-06 AlarmLog rejects duplicates inside the hold interval and accepts at the boundary (0.3991ms)
✔ UT-06 AlarmLog.clear resets both events and the hold clock (0.6399ms)
✔ UT-10 computeChannelPhaseGains covers both/left/right and phase inversion (1.9232ms)
✔ UT-09 computeMonitorGain: microphone is always silent, generator/file follow playing state (0.5451ms)
✔ UT-11 generateWhiteNoiseSamples stays within [-1, 1] with a near-zero mean (4.7964ms)
✔ UT-11 generateWhiteNoiseSamples is deterministic for a given seed (0.9711ms)
✔ UT-12 generatePinkNoiseSamples and generateBrownNoiseSamples are bounded with no NaN (12.8122ms)
✔ UT-12 brown noise is smoother (lower sample-to-sample roughness) than white noise from the same RNG stream (3.4684ms)
✔ UT-13 computeSweepSchedule derives correct start/end frequency, timing, and automation method (0.4287ms)
✔ UT-13 computeSweepSchedule clamps non-positive frequencies to the exponential-ramp-safe floor (0.1682ms)
✔ UT-17 buildExportFilename produces a safe, deterministic name (0.2818ms)
✔ UT-17 buildExportFilename strips user-controlled/path-unsafe characters from the waveform token (0.4065ms)
✔ validateAudioFile rejects oversized, empty, and non-audio files; accepts audio types (0.4521ms)
✔ UT-14 encodeWavPcm24 produces a correct RIFF/WAVE header for a known 2-channel 96 kHz buffer (1.8606ms)
✔ UT-15 floatSampleToInt24 clamps and scales known sample values correctly (1.528ms)
✔ UT-15 encodeWavPcm24 writes correct little-endian interleaved sample bytes (0.5784ms)
✔ encodeWavPcm24 rejects mismatched channel lengths and non-finite sample rates (0.6995ms)
✔ UT-16 validateExportConfig accepts only the approved 24-bit/96kHz stereo generator scope (0.312ms)
✔ UT-16 validateExportConfig rejects unsupported bit depth, channel count, and source (0.2747ms)

ℹ tests 43
ℹ suites 0
ℹ pass 43
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 207.834
```

## 5. Explicit non-claims

This report claims only what `node --test` executed: pure-function correctness and fake-graph-integration behavior of `audio-lab-engine.js`. It makes **no** claim about `audio-lab.js` (the DOM controller, untested here — no DOM/browser available in this environment) or about any real-browser, real-hardware, or real-microphone behavior. See the Local Validation report for what static/structural checks were additionally performed, and for the full BROWSER/DEVICE/MANUAL-AUDIO PENDING lists.
