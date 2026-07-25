const assert = require("node:assert/strict");
const test = require("node:test");

const geminiService = require("../src/services/gemini");
const {
  handleJournalInsightRequest,
  validateJournalPayload
} = require("../src/http/journalInsightProxy");

function createMockResponse() {
  return {
    statusCode: null,
    body: null,
    headers: {},
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.body = payload;
      return this;
    },
    set(key, value) {
      this.headers[key] = value;
      return this;
    }
  };
}

function createMockRequest({ method = "POST", origin = "https://yevgeni.info", body = {} } = {}) {
  return { method, headers: { origin }, body };
}

async function withMockedGenerateJournalInsight(mockFn, run) {
  const original = geminiService.generateJournalInsight;
  geminiService.generateJournalInsight = mockFn;
  try {
    await run();
  } finally {
    geminiService.generateJournalInsight = original;
  }
}

test("validateJournalPayload rejects missing/invalid fields", () => {
  assert.deepEqual(validateJournalPayload({}), [
    "prompt must be a non-empty string"
  ]);
  assert.deepEqual(validateJournalPayload({ prompt: "  " }), [
    "prompt must be a non-empty string"
  ]);
  assert.deepEqual(validateJournalPayload({ prompt: "hi", context: "not-an-array" }), [
    "context must be an array when provided"
  ]);
  assert.deepEqual(validateJournalPayload({ prompt: "hi", context: [] }), []);
  assert.deepEqual(
    validateJournalPayload({ prompt: "x".repeat(501) }),
    ["prompt must be 500 characters or fewer"]
  );
});

test("handleJournalInsightRequest returns a Gemini-generated response for a valid payload", async () => {
  await withMockedGenerateJournalInsight(
    async ({ prompt, context }) => {
      assert.equal(prompt, "What is the Secret Nexus Proxy?");
      assert.deepEqual(context, [{ title: "Code Components", insights: ["a"] }]);
      return "The Secret Nexus Proxy is a Node.js middleware.";
    },
    async () => {
      const req = createMockRequest({
        body: {
          prompt: "What is the Secret Nexus Proxy?",
          context: [{ title: "Code Components", insights: ["a"] }]
        }
      });
      const res = createMockResponse();

      await handleJournalInsightRequest(req, res);

      assert.equal(res.statusCode, 200);
      assert.equal(res.body.response, "The Secret Nexus Proxy is a Node.js middleware.");
    }
  );
});

test("handleJournalInsightRequest rejects invalid payloads with 400", async () => {
  const req = createMockRequest({ body: { prompt: "" } });
  const res = createMockResponse();

  await handleJournalInsightRequest(req, res);

  assert.equal(res.statusCode, 400);
  assert.ok(Array.isArray(res.body.details) && res.body.details.length > 0);
});

test("handleJournalInsightRequest rejects non-POST methods with 405", async () => {
  const req = createMockRequest({ method: "GET" });
  const res = createMockResponse();

  await handleJournalInsightRequest(req, res);

  assert.equal(res.statusCode, 405);
});

test("handleJournalInsightRequest rejects disallowed origins with 403", async () => {
  const req = createMockRequest({ origin: "https://malicious.example" });
  const res = createMockResponse();

  await handleJournalInsightRequest(req, res);

  assert.equal(res.statusCode, 403);
});

test("handleJournalInsightRequest returns 500 when the Gemini service throws", async () => {
  await withMockedGenerateJournalInsight(
    async () => {
      throw new Error("upstream Gemini failure");
    },
    async () => {
      const req = createMockRequest({ body: { prompt: "test prompt" } });
      const res = createMockResponse();

      await handleJournalInsightRequest(req, res);

      assert.equal(res.statusCode, 500);
    }
  );
});
