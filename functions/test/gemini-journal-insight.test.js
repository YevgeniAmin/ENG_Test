const assert = require("node:assert/strict");
const test = require("node:test");

const { buildJournalPrompt, generateJournalInsight } = require("../src/services/gemini");

test("buildJournalPrompt includes journal context and the user question", () => {
  const prompt = buildJournalPrompt("What is the Secret Nexus Proxy?", [
    {
      title: "Code Components",
      insights: ["Secret Nexus Proxy: Node.js middleware for telemetry."]
    }
  ]);

  assert.match(prompt, /Code Components/);
  assert.match(prompt, /Secret Nexus Proxy: Node\.js middleware for telemetry\./);
  assert.match(prompt, /Question: What is the Secret Nexus Proxy\?/);
  assert.match(prompt, /journal context/i);
});

test("buildJournalPrompt handles missing/empty context without throwing", () => {
  const prompt = buildJournalPrompt("Any question", undefined);
  assert.match(prompt, /\(no journal context supplied\)/);
  assert.match(prompt, /Question: Any question/);
});

test("generateJournalInsight rejects an empty prompt before calling the API", async () => {
  await assert.rejects(
    () => generateJournalInsight({ prompt: "   ", context: [] }),
    /prompt must be a non-empty string/
  );
});
