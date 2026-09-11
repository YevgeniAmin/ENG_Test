# Gemini Journal Benchmark — Phase 1 Report (Model A / Baseline)

- **Branch:** `feature/journal-modernization-gemini`
- **Date:** 2026-07-25
- **Harness:** `functions/test/gemini-benchmark.test.js` (`node --test`, via `npm test`)
- **Active Model Identifier:** `gemini-1.5-flash` (set via `GEMINI_MODEL` env var,
  resolved by `resolveActiveModel()` in `functions/src/services/gemini.js`)

## ⚠️ Run mode: simulated, not live API

This run **does not call the live Gemini API**. Consistent with the existing
suite (`gemini-journal-insight.test.js`, `journal-insight-proxy.test.js`), the
harness stubs `generateJournalInsight` with a deterministic simulated
responder. Reasons this is the correct default for an automated/CI suite:

- No `GEMINI_API_KEY` is provisioned to test/CI execution — per `AGENTS.md`,
  secrets are read-only to execution agents and must not be exercised by
  automated scripts.
- Real calls would be non-deterministic, cost money per run, and require
  network access unavailable in CI.
- The harness's job in Phase 1 is to prove the **benchmark scaffolding**
  (model switching, timing capture, safety validation, ADS-000 telemetry)
  works end-to-end and is reusable for Phase 2 (Model B comparison). Model
  *quality* comparison requires a live run, noted under Next Steps.

All metrics below are real output from an actual `npm test` execution — not
hand-written — but the underlying Gemini response text is synthetic.

## Mock dataset

Rather than introduce a second, parallel fixture, the harness reads the
existing production content file `public/assets/data/journal-entries.json`
(read-only) as its journal-entry context — it already is a versioned dataset
of curated engineering journal entries, so duplicating it would create two
sources of truth for the same panel content.

## Test cases executed

| Case ID | Prompt |
|---|---|
| `secret-nexus-proxy` | What is the Secret Nexus Proxy? |
| `system-evolution-phases` | Summarize the system evolution phases in order. |
| `zero-trust-infra` | What Zero-Trust infrastructure changes were made? |
| `advisory-board-max` | Who is Max on the AI advisory board and what do they own? |
| `glossary-atp-atr` | Define ATP and ATR. |

## Response time metrics

| Case ID | Latency (ms) | Output length (chars) | Safety validated |
|---|---:|---:|:---:|
| `secret-nexus-proxy` | 362 | 121 | ✅ |
| `system-evolution-phases` | 351 | 137 | ✅ |
| `zero-trust-infra` | 358 | 139 | ✅ |
| `advisory-board-max` | 353 | 147 | ✅ |
| `glossary-atp-atr` | 355 | 109 | ✅ |

| Metric | Value |
|---|---|
| Cases run | 5 |
| Average latency | 355.8 ms |
| Pass rate (safety validation) | 100% (5/5) |

Simulated latency is deliberately not a fixed constant — it scales with the
size of the journal context injected into the prompt (`180ms + 0.5ms per
context word, capped`), so relative differences between cases are meaningful
even though absolute values are synthetic.

## Telemetry / ADS-000 proof payload

Captured via the real `generateSamplingProof()` (`functions/src/services/samplingLogger.js`) for each case — this part of the harness is genuine, not mocked:

```json
{
  "ads": "ADS-000",
  "schemaVersion": "1.0.0",
  "timestamp": "2026-07-25T15:58:53.150Z",
  "commit": {
    "sha": "3056abd3e57d433be1d0a99aa311c72b9d1d77c5",
    "source": "git"
  },
  "runtime": {
    "node": "v24.15.0",
    "environment": "production"
  },
  "payload": {
    "fingerprint": "54abf408c8531fb42ffbffba4024ed702fdb7528e51c4992d18a7ca5ce9216d8",
    "fieldCount": 4
  }
}
```

(Example shown for `secret-nexus-proxy`; each case produces its own
fingerprinted envelope with a fresh timestamp and a fingerprint over
`{ suite, caseId, model, outputLength }`.)

## Sample generated output

> `[simulated:gemini-1.5-flash] Based on the journal context, here is a concise answer to "What is the Secret Nexus Proxy?".`

## Suite results

```
npm test
✔ resolveActiveModel falls back to the production default when GEMINI_MODEL is unset
✔ resolveActiveModel switches models via the GEMINI_MODEL env var
✔ Baseline model (gemini-1.5-flash) benchmark run produces telemetry-backed results for every case
... (existing 13 tests unchanged) ...
ℹ tests 16
ℹ pass 16
ℹ fail 0
```

`npm run lint` — clean (0 errors).

## What changed to enable this

- `functions/src/services/gemini.js`: added `resolveActiveModel()`, which
  reads `GEMINI_MODEL` and falls back to the existing
  `JOURNAL_INSIGHT_MODEL` default (`gemini-2.5-flash`) — no behavior change
  when the env var is unset.
- `functions/test/gemini-benchmark.test.js` (new): reusable benchmark
  harness (`runBenchmarkSuite`) exported for a future Model B run.

## Next steps (Phase 2 / out of scope here)

- A true model-quality comparison (Model A vs. Model B) requires an
  opt-in, explicitly-authorized live run against the real Gemini API (local
  only, with `GEMINI_API_KEY` set and `npm test` **not** used as the
  trigger) — this should be a separate, manually-invoked script, not part
  of the automated suite.
- Owner sign-off needed before wiring any live-API cost into CI, per the
  multi-agent governance section of `AGENTS.md`.
