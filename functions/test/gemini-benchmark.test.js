const assert = require("node:assert/strict");
const test = require("node:test");

const geminiService = require("../src/services/gemini");
const { runBenchmarkSuite, BENCHMARK_CASES } = require("../benchmarks/gemini-benchmark-harness");

test("resolveActiveModel falls back to the production default when GEMINI_MODEL is unset", () => {
  const previousEnv = process.env.GEMINI_MODEL;
  delete process.env.GEMINI_MODEL;
  try {
    assert.equal(geminiService.resolveActiveModel(), geminiService.JOURNAL_INSIGHT_MODEL);
  } finally {
    if (previousEnv !== undefined) process.env.GEMINI_MODEL = previousEnv;
  }
});

test("resolveActiveModel switches models via the GEMINI_MODEL env var", () => {
  const previousEnv = process.env.GEMINI_MODEL;
  process.env.GEMINI_MODEL = "gemini-1.5-flash";
  try {
    assert.equal(geminiService.resolveActiveModel(), "gemini-1.5-flash");
  } finally {
    if (previousEnv === undefined) delete process.env.GEMINI_MODEL;
    else process.env.GEMINI_MODEL = previousEnv;
  }
});

test("Baseline model (gemini-1.5-flash) benchmark run produces telemetry-backed results for every case", async () => {
  const summary = await runBenchmarkSuite({ model: "gemini-1.5-flash" });

  assert.equal(summary.casesRun, BENCHMARK_CASES.length);
  assert.equal(summary.passRate, 1);
  assert.ok(summary.avgLatencyMs > 0);

  for (const result of summary.results) {
    assert.ok(result.response.length > 0, "response must not be empty");
    assert.ok(result.safetyValidated, `safety settings must validate for case ${result.id}`);
    assert.equal(result.proof.ads, "ADS-000");
    assert.match(result.proof.payload.fingerprint, /^[a-f0-9]{64}$/);
  }

  // Emitted for the benchmark report generation step — captured from stdout
  // rather than written to disk, keeping this suite side-effect free.
  console.log(`BENCHMARK_SUMMARY::${JSON.stringify(summary)}`);
});
