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

const JOURNAL_INSIGHT_MODEL = "gemini-2.0-flash";
const JOURNAL_PROMPT_MAX_LENGTH = 500;

// Phase 2: multi-turn conversations are capped to this many prior turns
// (both directions combined) so grounded context doesn't grow unbounded.
const JOURNAL_HISTORY_MAX_MESSAGES = 10;

// Allows benchmark/ops tooling to pin a specific model per-run (e.g.
// GEMINI_MODEL=gemini-1.5-flash) without touching the production default.
function resolveActiveModel() {
  return process.env.GEMINI_MODEL || JOURNAL_INSIGHT_MODEL;
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
  JOURNAL_HISTORY_MAX_MESSAGES,
  resolveActiveModel,
  buildJournalPrompt,
  buildJournalSystemInstruction,
  buildJournalContents,
  generateJournalInsight
};
