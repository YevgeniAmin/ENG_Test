# WO-AUDIO-02C — Audio Lab Corrective Test Report

**Date:** 2026-08-11

**Environment:** `C:\eng-portal-worktrees\wo-audio-02`, Node.js v24.15.0, loopback only

**Finding:** A02V-F01 — MONO SOURCE CHANNEL NORMALIZATION DEFECT

## Verdict

**AUTOMATED CORRECTION PASS; REAL-BROWSER VALIDATION BLOCKED — ENVIRONMENT.**

All available automated correction tests passed. The supported browser-control runtime was initialized for `http://127.0.0.1:8765/audio-lab.html`, but browser discovery returned an empty list (`[]`). No unrelated browser mechanism or fake signal result was substituted for the required real-browser gates. WO-AUDIO-02V.2 must independently execute the browser gates before release.

## Automated results

Baseline command before editing:

`node --test test/audio-lab/pure-helpers.test.mjs test/audio-lab/wav-encoding.test.mjs test/audio-lab/engine.test.mjs`

Baseline result: **43 / 43 PASS, 0 fail, 0 skipped**.

Corrective command after editing: identical to the baseline command.

Final corrective result: **45 / 45 PASS, 0 fail, 0 skipped**, duration 203.9896 ms.

The two added tests are:

1. `A02V-F01 mono generator content reaches both routed channels with right-phase polarity`
2. `A02V-F01 true stereo file content is preserved and the microphone monitor stays closed`

## Defective-baseline failure proof

The exact engine source from commit `15120bf879167ae1f8a40627feecebc829bbf25d` was loaded without changing the worktree and exercised through the enhanced channel-content harness.

Observed result:

```json
{"baseline":"15120bf879167ae1f8a40627feecebc829bbf25d","both":[0.125594321575479,0],"rightOnly":[0,0],"regressionWouldFail":true}
```

This proves that the new channel-content regression detects the original defect.

## Required browser retest

| Test | Result | Evidence boundary |
|---|---|---|
| BT-02 oscillator generation | **BLOCKED — ENVIRONMENT** | No supported browser instance was available. |
| BT-03 noise generation | **BLOCKED — ENVIRONMENT** | No supported browser instance was available. |
| BT-05 channel routing and right phase | **BLOCKED — ENVIRONMENT** | Hard gate not claimed from analyser magnitude or fake output. Independent real-browser L/R capture remains required. |
| BT-06 live FFT configuration | **BLOCKED — ENVIRONMENT** | No supported browser instance was available. |
| BT-18 real OfflineAudioContext export | **BLOCKED — ENVIRONMENT** | No supported browser instance was available; the fake offline renderer is not presented as a substitute. |
| BT-19 observable download | **BLOCKED — ENVIRONMENT** | The environment exposed no browser or observable download surface. |
| BT-20 keyboard/focus interaction | **BLOCKED — ENVIRONMENT** | The environment exposed no real keyboard/focus interaction surface. |

Generator audible routing, real-browser phase inversion, stop/start, sweep, noise, and real `OfflineAudioContext` export therefore remain browser-validation requirements. No PASS is claimed for them in this report.

## Microphone and privacy regression

- Automated monitor-gate assertion: **PASS** — microphone monitor gain remained exactly `0`.
- Automated destination-content assertion: **PASS** — injected microphone content rendered as `[0, 0]` at the destination.
- Runtime microphone wiring was not modified.
- Source scan found no `fetch`, `XMLHttpRequest`, `WebSocket`, `EventSource`, third-party URL, credential, API-key, or token addition in the changed runtime/test files.
- External network use: **none**. The only HTTP request was loopback traffic to `127.0.0.1` for the attempted browser retest.

## Additional validation

- ES-module syntax check: **PASS**.
- `git diff --check`: **PASS** (line-ending notices only; no whitespace errors).
- Modified tracked scope before evidence: exactly the engine, engine test, and existing fake context.
