const { GoogleGenAI } = require("@google/genai");
const { geminiApiKey } = require("../config/secrets");

// See docs/architecture/decisions/0001-gemini-safety-settings.md
const SEMANTIC_SAFETY_SETTINGS = Object.freeze([
  Object.freeze({
    category: "HARM_CATEGORY_HARASSMENT",
    threshold: "BLOCK_MEDIUM_AND_ABOVE"
  }),
  Object.freeze({
    category: "HARM_CATEGORY_HATE_SPEECH",
    threshold: "BLOCK_MEDIUM_AND_ABOVE"
  }),
  Object.freeze({
    category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
    threshold: "BLOCK_MEDIUM_AND_ABOVE"
  }),
  Object.freeze({
    category: "HARM_CATEGORY_DANGEROUS_CONTENT",
    threshold: "BLOCK_ONLY_HIGH"
  })
]);

// Production incident 2026-07-26: the deployed function was still serving
// gemini-2.5-flash (pre-fix) and every real request 404'd — Google's API
// returned "This model models/gemini-2.5-flash is no longer available to
// new users" for this project's key (see production logs, PR
// fix/journal-gemini-production-500). Investigating that also surfaced that
// gemini-2.0-flash (the model this constant pointed to right after that PR)
// had *already* been shut down on 2026-06-01, per
// ai.google.dev/gemini-api/docs/deprecations. gemini-3.6-flash (GA
// 2026-07-21, ai.google.dev/gemini-api/docs/changelog) is the current
// stable, no-announced-shutdown replacement Google's docs point both of
// those retired models to, and needs no request-shape changes for our
// generateContent call (safetySettings + systemInstruction + contents).
const JOURNAL_INSIGHT_MODEL = "gemini-3.6-flash";
const JOURNAL_PROMPT_MAX_LENGTH = 500;

// Model ids confirmed unavailable to this project during the 2026-07-26
// incident investigation above — resolveActiveModel() won't let a
// GEMINI_MODEL override silently select one of these.
const KNOWN_UNAVAILABLE_MODEL_IDS = new Set([
  "gemini-2.0-flash",
  "gemini-2.0-flash-001",
  "gemini-2.0-flash-lite",
  "gemini-2.0-flash-lite-001",
  "gemini-2.5-flash"
]);

// Phase 2: multi-turn conversations are capped to this many prior turns
// (both directions combined) so grounded context doesn't grow unbounded.
const JOURNAL_HISTORY_MAX_MESSAGES = 10;

// Allows benchmark/ops tooling to pin a specific model per-run (e.g.
// GEMINI_MODEL=gemini-1.5-flash) without touching the production default.
// Blank/whitespace-only overrides and known-unavailable ids fall back to
// the default instead of silently taking effect.
function resolveActiveModel() {
  const override = process.env.GEMINI_MODEL ? process.env.GEMINI_MODEL.trim() : "";
  if (!override) return JOURNAL_INSIGHT_MODEL;
  if (KNOWN_UNAVAILABLE_MODEL_IDS.has(override)) {
    console.warn(
      `[gemini] Ignoring GEMINI_MODEL override "${override}": known unavailable model id. Falling back to ${JOURNAL_INSIGHT_MODEL}.`
    );
    return JOURNAL_INSIGHT_MODEL;
  }
  return override;
}

function resolveGeminiApiKey() {
  return process.env.FUNCTIONS_EMULATOR === "true"
    ? process.env.GEMINI_API_KEY
    : geminiApiKey.value();
}

function buildJournalContextText(context) {
  const entries = Array.isArray(context) ? context : [];
  return entries
    .map((entry) => {
      const title = entry && entry.title ? entry.title : "Untitled entry";
      const insights = Array.isArray(entry && entry.insights) ? entry.insights : [];
      return `### ${title}\n${insights.map((line) => `- ${line}`).join("\n")}`;
    })
    .join("\n\n");
}

// Grounds the model in the curated journal context only, so it declines
// rather than invents when a question falls outside the supplied entries.
// Shared between the legacy single-shot prompt below and the multi-turn
// systemInstruction used by generateJournalInsight.
function buildJournalSystemInstruction(context) {
  const contextText = buildJournalContextText(context);
  return [
    "You are the ENG-PORTAL journal assistant. Answer strictly using the",
    "curated engineering journal context below. If the answer isn't",
    "contained in the context, say so plainly instead of inventing details.",
    "Keep the response concise (under 120 words) and professional.",
    "",
    "Journal context:",
    contextText || "(no journal context supplied)"
  ].join("\n");
}

function buildJournalPrompt(prompt, context) {
  return [
    buildJournalSystemInstruction(context),
    "",
    `Question: ${prompt}`
  ].join("\n");
}

// Trims to the last N turns (defense-in-depth; the HTTP proxy layer also
// trims before this is ever called) and maps to the GoogleGenAI Content shape.
function buildJournalContents(prompt, history) {
  const trimmedHistory = Array.isArray(history)
    ? history.slice(-JOURNAL_HISTORY_MAX_MESSAGES)
    : [];

  return [...trimmedHistory, { role: "user", parts: [{ text: prompt }] }];
}

async function generateJournalInsight({ prompt, context, history }) {
  const trimmedPrompt = typeof prompt === "string" ? prompt.trim().slice(0, JOURNAL_PROMPT_MAX_LENGTH) : "";
  if (!trimmedPrompt) {
    throw new Error("prompt must be a non-empty string");
  }

  const ai = new GoogleGenAI({ apiKey: resolveGeminiApiKey() });
  const response = await ai.models.generateContent({
    model: resolveActiveModel(),
    contents: buildJournalContents(trimmedPrompt, history),
    config: {
      safetySettings: SEMANTIC_SAFETY_SETTINGS,
      systemInstruction: buildJournalSystemInstruction(context)
    }
  });

  return {
    text: response.text,
    usageMetadata: response.usageMetadata || null
  };
}

module.exports = {
  GoogleGenAI,
  SEMANTIC_SAFETY_SETTINGS,
  JOURNAL_INSIGHT_MODEL,
  KNOWN_UNAVAILABLE_MODEL_IDS,
  JOURNAL_HISTORY_MAX_MESSAGES,
  resolveActiveModel,
  buildJournalPrompt,
  buildJournalSystemInstruction,
  buildJournalContents,
  generateJournalInsight
};
