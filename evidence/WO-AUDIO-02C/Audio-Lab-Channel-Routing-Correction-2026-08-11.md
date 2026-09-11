# WO-AUDIO-02C — Audio Lab Channel Routing Correction

**Date:** 2026-08-11

**Finding:** A02V-F01 — MONO SOURCE CHANNEL NORMALIZATION DEFECT

**Authority:** Narrow correction and tests only

**Defective baseline:** `15120bf879167ae1f8a40627feecebc829bbf25d`

**Branch:** `feature/audio-lab-v1`

## Precheck

- HEAD matched the authorized defective baseline exactly.
- The active branch matched `feature/audio-lab-v1`.
- Tracked files were clean before correction.
- Only the expected prior `evidence/` directory was untracked.
- The existing graph was inspected before editing.

## Independent pre-fix measurements (verbatim)

```text
Both / normal:
~1002 Hz, non-zero signal

Both / right inverted:
same result as normal

Left only:
same non-zero signal

Right only:
effectively silence
```

## Root cause

The live oscillator and sweep nodes are mono AudioNodes. They were connected directly to the shared master gain, which then fed a two-output `ChannelSplitterNode`. A splitter exposes existing input channels; it does not duplicate a mono input. Consequently, splitter output 1 contained silence, so right-only routing and right-channel phase inversion had no right-channel signal to control.

The same structural defect existed in the oscillator and sweep branches of the offline export graph.

## Exact source correction

`public/assets/js/audio-lab-engine.js` now creates an explicit two-input `ChannelMergerNode` for mono generator normalization. Each oscillator or sweep output is connected to both merger inputs before the shared master/routing graph:

`mono oscillator/sweep → explicit stereo merger → master gain → splitter → L/R gains and right phase → output merger → analyser → monitor gate`

The offline oscillator and sweep export paths use the same explicit normalization pattern before their shared export routing graph.

True-stereo decoded file sources continue to connect directly to the shared master gain, preserving independent left and right content. Generated stereo noise also bypasses the mono normalizer. The microphone path is unchanged, and its monitor gate remains exactly zero.

## Regression coverage

Two A02V-F01 tests were added to `test/audio-lab/engine.test.mjs`. The existing fake Web Audio graph was minimally enhanced to propagate one scalar sample per channel through the nodes actually constructed by the engine. The tests assert channel content rather than only GainNode control values:

- mono generator signal is present in both channels;
- right-only retains right signal and silences left;
- left-only retains left signal and silences right;
- right inversion produces equal-and-opposite right-channel polarity;
- true-stereo file channel content is neither duplicated nor collapsed; and
- the microphone monitor gate is zero and microphone content does not reach the destination.

Replaying the defective baseline through the enhanced harness produced `both = [0.125594321575479, 0]` and `rightOnly = [0, 0]`, confirming that the new regression fails against commit `15120bf879167ae1f8a40627feecebc829bbf25d`.

## Scope

Runtime modification is limited to `public/assets/js/audio-lab-engine.js`. Test changes are limited to the existing Audio Lab engine test and fake context. No HTML, CSS, controller, Firebase, authentication, deployment, or security configuration was changed.
