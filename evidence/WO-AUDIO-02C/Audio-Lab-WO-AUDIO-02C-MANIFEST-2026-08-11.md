# WO-AUDIO-02C — Evidence Manifest

**Date:** 2026-08-11

**Finding:** A02V-F01 — MONO SOURCE CHANNEL NORMALIZATION DEFECT

**Branch:** `feature/audio-lab-v1`

**Parent / defective baseline:** `15120bf879167ae1f8a40627feecebc829bbf25d`

## Corrective scope

| File | Purpose | SHA-256 |
|---|---|---|
| `public/assets/js/audio-lab-engine.js` | Explicit live and offline stereo normalization for mono oscillator/sweep sources | `84B932DD0AE24B2279D6BC78C9419A35D5BC5BFD70C85456DDB51668FA81B195` |
| `test/audio-lab/fake-audio-context.mjs` | Minimal scalar channel-content propagation through the existing fake graph | `F9750FB62CD3A8DBFC893FF84BAB20B505AE7B5DFD008FBB3A550C708CF3D2B3` |
| `test/audio-lab/engine.test.mjs` | A02V-F01 signal-content, stereo-preservation, and microphone-gate regression tests | `236B2CAAB3A3102BA7841312F9E2A1540389C89CEAECDF114FFC81B7FD5FEBC6` |

## Evidence files

| File | Purpose | SHA-256 |
|---|---|---|
| `Audio-Lab-Channel-Routing-Correction-2026-08-11.md` | Root cause, exact correction, baseline measurements, and regression mapping | `FBF6C34E4E33B61BAADC481BEF3FB82102CD426C1BFC2D3970224C0447276283` |
| `Audio-Lab-Corrective-Test-Report-2026-08-11.md` | Automated results, baseline-failure proof, browser status, and privacy boundary | `FEB09E766AA33A0B021C7E3A03F79D353B76E46C9837D384B7B5921163709FAB` |
| `Audio-Lab-WO-AUDIO-02C-MANIFEST-2026-08-11.md` | This manifest; its final SHA-256 is reported in the completion response | Self-reference intentionally omitted |

## Result summary

- Automated suite: **45 / 45 PASS**.
- Defective-baseline replay: **regression failure confirmed**.
- BT-02: **BLOCKED — ENVIRONMENT**.
- BT-03: **BLOCKED — ENVIRONMENT**.
- BT-05: **BLOCKED — ENVIRONMENT**; no false PASS claimed for the hard gate.
- BT-06: **BLOCKED — ENVIRONMENT**.
- BT-18: **BLOCKED — ENVIRONMENT**.
- BT-19: **BLOCKED — ENVIRONMENT**.
- BT-20: **BLOCKED — ENVIRONMENT**.
- Microphone monitor-gate regression: **PASS**.
- External network: **none**; loopback-only server used for the browser attempt.

## Explicit exclusions

No HTML, CSS, controller, Firebase, Gemini, authentication, deployment, PR, merge, or push operation is included. The authorized corrective commit is created only after final validation and diff review; its SHA is necessarily reported outside this immutable in-commit manifest.
