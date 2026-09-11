const assert = require("node:assert/strict");
const test = require("node:test");

const geminiService = require("../src/services/gemini");

function withGeminiModelEnv(value, run) {
  const previous = process.env.GEMINI_MODEL;
  if (value === undefined) delete process.env.GEMINI_MODEL;
  else process.env.GEMINI_MODEL = value;
  try {
    return run();
  } finally {
    if (previous === undefined) delete process.env.GEMINI_MODEL;
    else process.env.GEMINI_MODEL = previous;
  }
}

test("JOURNAL_INSIGHT_MODEL is an explicit, non-empty model id", () => {
  assert.equal(typeof geminiService.JOURNAL_INSIGHT_MODEL, "string");
  assert.ok(geminiService.JOURNAL_INSIGHT_MODEL.trim().length > 0);
});

test("JOURNAL_INSIGHT_MODEL is not one of the ids confirmed unavailable during the 2026-07-26 incident", () => {
  assert.equal(geminiService.KNOWN_UNAVAILABLE_MODEL_IDS.has(geminiService.JOURNAL_INSIGHT_MODEL), false);
});

test("resolveActiveModel returns the approved default when no override is set", () => {
  withGeminiModelEnv(undefined, () => {
    assert.equal(geminiService.resolveActiveModel(), geminiService.JOURNAL_INSIGHT_MODEL);
  });
});

test("resolveActiveModel falls back to the default for a blank/whitespace-only override", () => {
  withGeminiModelEnv("   ", () => {
    assert.equal(geminiService.resolveActiveModel(), geminiService.JOURNAL_INSIGHT_MODEL);
  });
});

test("resolveActiveModel falls back to the default for an empty-string override", () => {
  withGeminiModelEnv("", () => {
    assert.equal(geminiService.resolveActiveModel(), geminiService.JOURNAL_INSIGHT_MODEL);
  });
});

test("resolveActiveModel refuses known-unavailable overrides and falls back to the default", () => {
  for (const unavailableId of geminiService.KNOWN_UNAVAILABLE_MODEL_IDS) {
    withGeminiModelEnv(unavailableId, () => {
      assert.equal(geminiService.resolveActiveModel(), geminiService.JOURNAL_INSIGHT_MODEL);
    });
  }
});

test("resolveActiveModel trims and respects a valid override", () => {
  withGeminiModelEnv("  gemini-1.5-flash  ", () => {
    assert.equal(geminiService.resolveActiveModel(), "gemini-1.5-flash");
  });
});
