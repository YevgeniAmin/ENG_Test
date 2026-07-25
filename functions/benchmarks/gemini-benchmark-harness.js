const fs = require("node:fs");
const path = require("node:path");

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

// Neither this harness nor the rest of the suite (gemini-safety-settings,
// gemini-journal-insight, journal-insight-proxy) calls the live Gemini API —
// no key is provisioned to test/CI runs and secrets are read-only to
// execution agents per AGENTS.md. This harness stubs
// `generateJournalInsight` with a deterministic simulated responder so runs
// are fast, free, and reproducible. A live comparison requires a separate,
// manually-invoked, owner-approved script with GEMINI_API_KEY set.
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

// NOT safe to call concurrently with itself or with anything else that
// touches GEMINI_MODEL / geminiService.generateJournalInsight: it
// monkey-patches shared module state for the duration of the run and
// restores it in `finally`. Await one call fully before starting another.
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

module.exports = { runBenchmarkSuite, BENCHMARK_CASES, JOURNAL_CONTEXT, loadJournalContext };
