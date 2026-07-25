const { GoogleGenAI } = require("@google/genai");

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

module.exports = { GoogleGenAI, SEMANTIC_SAFETY_SETTINGS };
