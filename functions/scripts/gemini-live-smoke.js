/**
 * Opt-in live Gemini API smoke test. Skipped automatically when no local
 * GEMINI_API_KEY is available — never runs against the real API in normal
 * `npm test`/CI. Never prints the key, the full prompt, or the full response
 * text (only length/preview).
 *
 * Usage: npm run test:gemini:live
 */
require("dotenv").config();

const {
  JOURNAL_INSIGHT_MODEL,
  SEMANTIC_SAFETY_SETTINGS,
  generateJournalInsight
} = require("../src/services/gemini");

async function main() {
  if (!process.env.GEMINI_API_KEY) {
    console.log("[gemini:live] SKIPPED — no local GEMINI_API_KEY set in this shell/.env.");
    process.exit(0);
    return;
  }

  // Matches resolveGeminiApiKey()'s emulator-mode branch in src/services/gemini.js
  // so this script reads the same env var path production tooling expects.
  process.env.FUNCTIONS_EMULATOR = "true";

  console.log(`[gemini:live] Calling model "${JOURNAL_INSIGHT_MODEL}" with a minimal grounded prompt...`);
  const startedAt = Date.now();

  try {
    const result = await generateJournalInsight({
      prompt: "In one short sentence, what is this journal context about?",
      context: [
        { title: "Smoke Test", insights: ["This is a minimal smoke-test context entry."] }
      ],
      history: []
    });

    const latencyMs = Date.now() - startedAt;
    const text = typeof result.text === "string" ? result.text : "";

    if (!text.trim()) {
      console.error(`[gemini:live] FAIL — model "${JOURNAL_INSIGHT_MODEL}" returned an empty response after ${latencyMs}ms.`);
      process.exitCode = 1;
      return;
    }

    console.log(
      `[gemini:live] PASS — model "${JOURNAL_INSIGHT_MODEL}" responded in ${latencyMs}ms ` +
        `(${text.length} chars, ${SEMANTIC_SAFETY_SETTINGS.length} safety categories applied).`
    );
  } catch (error) {
    const latencyMs = Date.now() - startedAt;
    const status = error && error.status ? ` status=${error.status}` : "";
    const message = error && error.message ? String(error.message).slice(0, 300) : String(error);
    console.error(`[gemini:live] FAIL — model "${JOURNAL_INSIGHT_MODEL}" errored after ${latencyMs}ms:${status} ${message}`);
    process.exitCode = 1;
  }
}

main();
