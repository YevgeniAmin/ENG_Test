# Gemini Journal Benchmark — Phase 2 Report (Model B / Flagship)

- **Branch:** `feature/journal-modernization-gemini`
- **Date:** 2026-07-25
- **Harness:** `functions/benchmarks/gemini-benchmark-harness.js`, exercised via
  `runBenchmarkSuite({ model: "gemini-1.5-pro" })` (same reusable harness used
  for Phase 1, extracted from the test file — see "Harness fix" below)
- **Active Model Identifier:** `gemini-1.5-pro` (via `GEMINI_MODEL` override,
  resolved by `resolveActiveModel()` in `functions/src/services/gemini.js`)

## ⚠️ Run mode: simulated, not live API

Same convention as Phase 1: no live Gemini API call is made. No
`GEMINI_API_KEY` is provisioned to automated execution, and secrets are
read-only to execution agents per `AGENTS.md`. The numbers below prove the
harness operates correctly end-to-end for a second model — they are not
empirical evidence of Model B's actual output quality. See "Capability
comparison" for that, sourced from public model documentation instead.

## Harness fix: extracted from the test file

Running Phase 2 surfaced a real bug: `runBenchmarkSuite` originally lived
inside `functions/test/gemini-benchmark.test.js`. `require()`-ing that file
directly (to drive a one-off Model B run outside `npm test`) re-triggered its
own `node:test` registrations, which executed concurrently with the manual
call. Both raced over the same shared mutable state
(`process.env.GEMINI_MODEL`, the monkey-patched `generateJournalInsight`),
corrupting results — some "Model B" responses came back labeled
`gemini-1.5-flash`.

Fix: the harness now lives in `functions/benchmarks/gemini-benchmark-harness.js`
(outside any directory literally named `test`, so Node's test runner doesn't
also auto-discover and execute it as a bare test file — that directory-name
match is a real, easy-to-hit default in `node --test`). `gemini-benchmark.test.js`
now just imports and asserts against it. `runBenchmarkSuite` remains
single-flight by design — awaiting one call fully before starting another —
which this fix now actually guarantees when invoked standalone.

## Test cases executed

Same 5 cases as Phase 1, for a like-for-like comparison:

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
| `secret-nexus-proxy` | 348 | 119 | ✅ |
| `system-evolution-phases` | 350 | 135 | ✅ |
| `zero-trust-infra` | 361 | 137 | ✅ |
| `advisory-board-max` | 357 | 145 | ✅ |
| `glossary-atp-atr` | 363 | 107 | ✅ |

| Metric | Value |
|---|---|
| Cases run | 5 |
| Average latency | 355.8 ms |
| Pass rate (safety validation) | 100% (5/5) |

## Telemetry / ADS-000 proof payload

Captured via the real `generateSamplingProof()` — genuine, not mocked:

```json
{
  "ads": "ADS-000",
  "schemaVersion": "1.0.0",
  "timestamp": "2026-07-25T16:15:36.263Z",
  "commit": {
    "sha": "c46beaa08fa3da8c5af012c5cf54f255b1efdcca",
    "source": "git"
  },
  "runtime": {
    "node": "v24.15.0",
    "environment": "production"
  },
  "payload": {
    "fingerprint": "f66d66e4fd4d7ad8d0cf33bcf79146cfb177b5d116c3ff47cd8d23cc94ee59ed",
    "fieldCount": 4
  }
}
```

(Example shown for `secret-nexus-proxy`.)

## Sample generated output

> `[simulated:gemini-1.5-pro] Based on the journal context, here is a concise answer to "What is the Secret Nexus Proxy?".`

---

## Comparative Summary — Model A (`gemini-1.5-flash`) vs Model B (`gemini-1.5-pro`)

### Harness-measured metrics (this repo's simulated runs — operability only)

| Metric | Model A (Flash) | Model B (Pro) | Delta |
|---|---:|---:|---:|
| Avg. simulated latency | 355.8 ms | 355.8 ms | 0 ms |
| Safety pass rate | 100% (5/5) | 100% (5/5) | none |
| Cases run | 5 | 5 | — |

The harness's simulated responder does not vary latency by model tier — it
scales only with journal-context size, which is identical across both runs.
**This table shows the harness behaves identically and correctly for both
models; it is not a real latency comparison.** A genuine latency delta only
shows up against the live API (see Next Steps).

### Model capabilities & prompt understanding depth (from public model documentation, not this harness)

| Dimension | Flash tier | Pro tier |
|---|---|---|
| Design intent | Optimized for speed/cost at high volume | Optimized for reasoning depth on complex, multi-step tasks |
| Context window | Large (comparable across the 1.5 family) | Large (comparable across the 1.5 family) |
| Typical latency (live API) | Lower | Higher |
| Typical cost per token | Lower | Higher |
| Reasoning on ambiguous/multi-step prompts | Adequate for direct, grounded Q&A | Stronger — better at synthesis, nuance, longer chains of inference |

### Safety validation

Identical for both tiers in this harness: `SEMANTIC_SAFETY_SETTINGS` is
applied uniformly by `generateJournalInsight` regardless of which model
`resolveActiveModel()` resolves to — model choice does not affect which
safety thresholds are enforced. No live-API safety-filter behavior
(e.g., actual block/allow decisions per tier) was exercised here.

### Architectural recommendation for the Portal Engineer role

The journal assistant's actual workload is narrow: short, direct,
strictly-grounded Q&A over a small curated corpus
(`public/assets/data/journal-entries.json`), with an explicit instruction to
decline rather than infer beyond the supplied context. That's a low-reasoning-
complexity, latency-sensitive, low-volume use case — it plays to Flash's
strengths and doesn't need Pro's deeper multi-step reasoning.

**Recommendation:** keep the production default on a Flash-tier model
(currently `gemini-2.5-flash` in `JOURNAL_INSIGHT_MODEL`) for this endpoint.
Reserve `GEMINI_MODEL=gemini-1.5-pro` (or a future Pro-tier default) as an
opt-in override for scenarios that actually need deeper reasoning — e.g., if
the journal panel later takes on open-ended synthesis across the full
historical corpus rather than single-topic grounded lookups. This is a
judgment call from public model-tier characteristics, not from this
harness's simulated numbers, and should be revisited once a real live-API
comparison exists.

## Next steps (unchanged from Phase 1)

- A true model-quality/latency comparison requires an opt-in, explicitly
  owner-authorized live run against the real Gemini API (local only, with
  `GEMINI_API_KEY` set, invoked manually — **not** wired into `npm test`/CI).
- Owner sign-off required before any live-API cost enters an automated
  pipeline, per the multi-agent governance section of `AGENTS.md`.
