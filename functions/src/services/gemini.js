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

const JOURNAL_INSIGHT_MODEL = "gemini-2.5-flash";
const JOURNAL_PROMPT_MAX_LENGTH = 500;

function resolveGeminiApiKey() {
  return process.env.FUNCTIONS_EMULATOR === "true"
    ? process.env.GEMINI_API_KEY
    : geminiApiKey.value();
}

// Grounds the model in the curated journal context only, so it declines
// rather than invents when a question falls outside the supplied entries.
function buildJournalPrompt(prompt, context) {
  const entries = Array.isArray(context) ? context : [];
  const contextText = entries
    .map((entry) => {
      const title = entry && entry.title ? entry.title : "Untitled entry";
      const insights = Array.isArray(entry && entry.insights) ? entry.insights : [];
      return `### ${title}\n${insights.map((line) => `- ${line}`).join("\n")}`;
    })
    .join("\n\n");

  return [
    "You are the ENG-PORTAL journal assistant. Answer strictly using the",
    "curated engineering journal context below. If the answer isn't",
    "contained in the context, say so plainly instead of inventing details.",
    "Keep the response concise (under 120 words) and professional.",
    "",
    "Journal context:",
    contextText || "(no journal context supplied)",
    "",
    `Question: ${prompt}`
  ].join("\n");
}

async function generateJournalInsight({ prompt, context }) {
  const trimmedPrompt = typeof prompt === "string" ? prompt.trim().slice(0, JOURNAL_PROMPT_MAX_LENGTH) : "";
  if (!trimmedPrompt) {
    throw new Error("prompt must be a non-empty string");
  }

  const ai = new GoogleGenAI({ apiKey: resolveGeminiApiKey() });
  const response = await ai.models.generateContent({
    model: JOURNAL_INSIGHT_MODEL,
    contents: buildJournalPrompt(trimmedPrompt, context),
    config: { safetySettings: SEMANTIC_SAFETY_SETTINGS }
  });

  return response.text;
}

module.exports = {
  GoogleGenAI,
  SEMANTIC_SAFETY_SETTINGS,
  JOURNAL_INSIGHT_MODEL,
  buildJournalPrompt,
  generateJournalInsight
};
