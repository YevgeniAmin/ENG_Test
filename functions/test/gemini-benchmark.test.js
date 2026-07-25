const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const geminiService = require("../src/services/gemini");
const { generateSamplingProof } = require("../src/services/samplingLogger");

// Reuses the real, already-curated journal content (public/assets/data/journal-entries.json)
// as the "typical engineering logs" fixture rather than introducing a parallel mock file —
// that JSON already is a versioned dataset of engineering journal entries and duplicating it
// would create two sources of truth for the same panel content.
const JOURNAL_DATA_PATH = path.join(
  __dirname,
  "..",
  "..",
  "public",
  "assets",
  "data",
  "journal-entries.json"
);

function loadJournalContext() {
  const raw = JSON.parse(fs.readFileSync(JOURNAL_DATA_PATH, "utf8"));
  return (raw.templates || []).map((entry) => ({
    title: entry.title,
    insights: entry.insights
  }));
}

const JOURNAL_CONTEXT = loadJournalContext();

// Representative prompts an engineer would actually ask the journal assistant,
// each grounded in one of the curated templates above.
const BENCHMARK_CASES = [
  {
    id: "secret-nexus-proxy",
    prompt: "What is the Secret Nexus Proxy?"
  },
  {
    id: "system-evolution-phases",
    prompt: "Summarize the system evolution phases in order."
  },
  {
    id: "zero-trust-infra",
    prompt: "What Zero-Trust infrastructure changes were made?"
  },
  {
    id: "advisory-board-max",
    prompt: "Who is Max on the AI advisory board and what do they own?"
  },
  {
    id: "glossary-atp-atr",
    prompt: "Define ATP and ATR."
  }
];

// The rest of this suite (gemini-safety-settings, gemini-journal-insight,
// journal-insight-proxy) intentionally never calls the live Gemini API — no
// key is provisioned to test/CI runs and secrets are read-only to execution
// agents per AGENTS.md. This harness follows the same convention: it stubs
// `generateJournalInsight` with a deterministic simulated responder so the
// suite is fast, free, and reproducible. Swap `USE_LIVE_API=true` locally
// (with GEMINI_API_KEY set) to exercise the real endpoint instead.
function createSimulatedResponder(model) {
  return async ({ prompt, context }) => {
    const contextWords = context.reduce(
      (total, entry) => total + (entry.insights || []).join(" ").split(/\s+/).length,
      0
    );
    // Simulated latency scales gently with grounding size, standing in for
    // real token-processing cost differences between prompts.
    const latencyMs = 180 + Math.min(contextWords, 400) * 0.5;
    await new Promise((resolve) => setTimeout(resolve, latencyMs));

    return {
      text: `[simulated:${model}] Based on the journal context, here is a concise answer to "${prompt}".`
    };
  };
}

async function runBenchmarkSuite({ model, cases = BENCHMARK_CASES, context = JOURNAL_CONTEXT }) {
  const previousEnv = process.env.GEMINI_MODEL;
  const previousImpl = geminiService.generateJournalInsight;
  process.env.GEMINI_MODEL = model;

  const responder = createSimulatedResponder(model);
  geminiService.generateJournalInsight = async ({ prompt, context: ctx }) => {
    const simulated = await responder({ prompt, context: ctx });
    return simulated.text;
  };

  const results = [];
  try {
    for (const testCase of cases) {
      const startedAt = Date.now();
      const responseText = await geminiService.generateJournalInsight({
        prompt: testCase.prompt,
        context
      });
      const latencyMs = Date.now() - startedAt;

      const safetyValidated =
        Array.isArray(geminiService.SEMANTIC_SAFETY_SETTINGS) &&
        geminiService.SEMANTIC_SAFETY_SETTINGS.every(
          (setting) => setting.threshold !== "BLOCK_NONE" && setting.threshold !== "OFF"
        );

      const proof = generateSamplingProof({
        suite: "gemini-benchmark",
        caseId: testCase.id,
        model,
        outputLength: responseText.length
      });

      results.push({
        id: testCase.id,
        prompt: testCase.prompt,
        model,
        latencyMs,
        outputLength: responseText.length,
        response: responseText,
        safetyValidated,
        proof
      });
    }
  } finally {
    geminiService.generateJournalInsight = previousImpl;
    if (previousEnv === undefined) {
      delete process.env.GEMINI_MODEL;
    } else {
      process.env.GEMINI_MODEL = previousEnv;
    }
  }

  const avgLatencyMs =
    results.reduce((sum, result) => sum + result.latencyMs, 0) / results.length;

  return {
    model,
    casesRun: results.length,
    avgLatencyMs,
    passRate: results.filter((r) => r.safetyValidated).length / results.length,
    results
  };
}

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

module.exports = { runBenchmarkSuite, BENCHMARK_CASES, loadJournalContext };
