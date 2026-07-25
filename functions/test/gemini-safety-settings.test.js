const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const source = fs.readFileSync(
  path.join(__dirname, "..", "src", "services", "gemini.js"),
  "utf8"
);

const settingsMatch = source.match(
  /const SEMANTIC_SAFETY_SETTINGS = Object\.freeze\(\[([\s\S]*?)\]\);/
);

test("Gemini safety settings use only the approved categories and thresholds", () => {
  assert.ok(settingsMatch, "SEMANTIC_SAFETY_SETTINGS must be frozen");

  const settingsSource = settingsMatch[1];
  const categories = [
    ...settingsSource.matchAll(/category: "(HARM_CATEGORY_[A-Z_]+)"/g)
  ].map((match) => match[1]);
  const thresholds = [
    ...settingsSource.matchAll(/threshold: "([A-Z_]+)"/g)
  ].map((match) => match[1]);

  assert.deepEqual(categories, [
    "HARM_CATEGORY_HARASSMENT",
    "HARM_CATEGORY_HATE_SPEECH",
    "HARM_CATEGORY_SEXUALLY_EXPLICIT",
    "HARM_CATEGORY_DANGEROUS_CONTENT"
  ]);
  assert.equal(thresholds.length, 4);
  assert.equal(
    thresholds.filter((value) => value === "BLOCK_MEDIUM_AND_ABOVE").length,
    3
  );
  assert.equal(
    thresholds.filter((value) => value === "BLOCK_ONLY_HIGH").length,
    1
  );
  assert.equal(thresholds.includes("BLOCK_NONE"), false);
  assert.equal(thresholds.includes("OFF"), false);
  assert.equal(settingsSource.includes("HARM_CATEGORY_CIVIC_INTEGRITY"), false);
});
