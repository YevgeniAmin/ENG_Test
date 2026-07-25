const assert = require("node:assert/strict");
const test = require("node:test");

const geminiService = require("../src/services/gemini");
const {
  handleJournalInsightRequest,
  validateJournalPayload,
  trimHistory,
  MAX_HISTORY_MESSAGES
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

async function withCapturedConsoleLog(run) {
  const originalLog = console.log;
  const lines = [];
  console.log = (message) => {
    lines.push(message);
  };
  try {
    await run();
  } finally {
    console.log = originalLog;
  }
  return lines;
}

function parseTelemetryLine(lines) {
  const line = lines.find((entry) => typeof entry === "string" && entry.startsWith("JOURNAL_TELEMETRY::"));
  assert.ok(line, "expected a JOURNAL_TELEMETRY:: line to be logged");
  return JSON.parse(line.slice("JOURNAL_TELEMETRY::".length));
}

function historyTurn(role, text) {
  return { role, parts: [{ text }] };
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

test("validateJournalPayload accepts well-formed history and rejects malformed entries", () => {
  assert.deepEqual(
    validateJournalPayload({
      prompt: "hi",
      history: [historyTurn("user", "What is ADS-000?"), historyTurn("model", "It's a telemetry envelope.")]
    }),
    []
  );

  assert.deepEqual(validateJournalPayload({ prompt: "hi", history: "not-an-array" }), [
    "history must be an array when provided"
  ]);
  assert.deepEqual(validateJournalPayload({ prompt: "hi", history: [{ role: "system", parts: [{ text: "x" }] }] }), [
    "history entries must have role 'user'|'model' and non-empty parts[].text"
  ]);
  assert.deepEqual(validateJournalPayload({ prompt: "hi", history: [{ role: "user", parts: [] }] }), [
    "history entries must have role 'user'|'model' and non-empty parts[].text"
  ]);
  assert.deepEqual(validateJournalPayload({ prompt: "hi", history: [{ role: "user", parts: [{ text: "" }] }] }), [
    "history entries must have role 'user'|'model' and non-empty parts[].text"
  ]);
});

test("trimHistory keeps only the last MAX_HISTORY_MESSAGES entries", () => {
  const longHistory = Array.from({ length: 15 }, (_, i) => historyTurn(i % 2 === 0 ? "user" : "model", `turn-${i}`));
  const trimmed = trimHistory(longHistory);

  assert.equal(trimmed.length, MAX_HISTORY_MESSAGES);
  assert.equal(trimmed[0].parts[0].text, "turn-5");
  assert.equal(trimmed[trimmed.length - 1].parts[0].text, "turn-14");
  assert.deepEqual(trimHistory(undefined), []);
  assert.deepEqual(trimHistory("not-an-array"), []);
});

test("handleJournalInsightRequest returns a Gemini-generated response for a valid payload", async () => {
  await withMockedGenerateJournalInsight(
    async ({ prompt, context }) => {
      assert.equal(prompt, "What is the Secret Nexus Proxy?");
      assert.deepEqual(context, [{ title: "Code Components", insights: ["a"] }]);
      return { text: "The Secret Nexus Proxy is a Node.js middleware.", usageMetadata: { totalTokenCount: 42 } };
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

test("handleJournalInsightRequest forwards trimmed history to the Gemini service", async () => {
  const longHistory = Array.from({ length: 15 }, (_, i) => historyTurn(i % 2 === 0 ? "user" : "model", `turn-${i}`));
  let receivedHistory = null;

  await withMockedGenerateJournalInsight(
    async ({ history }) => {
      receivedHistory = history;
      return { text: "ok", usageMetadata: null };
    },
    async () => {
      const req = createMockRequest({ body: { prompt: "Summarize our chat.", history: longHistory } });
      const res = createMockResponse();

      await handleJournalInsightRequest(req, res);

      assert.equal(res.statusCode, 200);
    }
  );

  assert.equal(receivedHistory.length, MAX_HISTORY_MESSAGES);
  assert.equal(receivedHistory[0].parts[0].text, "turn-5");
});

test("handleJournalInsightRequest rejects invalid payloads with 400", async () => {
  const req = createMockRequest({ body: { prompt: "" } });
  const res = createMockResponse();

  await handleJournalInsightRequest(req, res);

  assert.equal(res.statusCode, 400);
  assert.ok(Array.isArray(res.body.details) && res.body.details.length > 0);
});

test("handleJournalInsightRequest rejects malformed history with 400", async () => {
  const req = createMockRequest({ body: { prompt: "hi", history: [{ role: "narrator", parts: [] }] } });
  const res = createMockResponse();

  await handleJournalInsightRequest(req, res);

  assert.equal(res.statusCode, 400);
  assert.ok(res.body.details.some((detail) => detail.includes("history entries")));
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

test("handleJournalInsightRequest emits an ADS-000 telemetry envelope for a successful request", async () => {
  let lines;
  await withMockedGenerateJournalInsight(
    async () => ({ text: "answer", usageMetadata: { totalTokenCount: 17, promptTokenCount: 10, candidatesTokenCount: 7 } }),
    async () => {
      const req = createMockRequest({ body: { prompt: "hi", history: [historyTurn("user", "prior turn")] } });
      const res = createMockResponse();
      lines = await withCapturedConsoleLog(() => handleJournalInsightRequest(req, res));
    }
  );

  const proof = parseTelemetryLine(lines);
  assert.equal(proof.ads, "ADS-000");
  assert.equal(proof.payload && typeof proof.payload.fingerprint, "string");
});

test("handleJournalInsightRequest telemetry captures status code, latency, history size, and error category across outcomes", async () => {
  const successLines = await withCapturedConsoleLog(async () => {
    await withMockedGenerateJournalInsight(
      async () => ({ text: "answer", usageMetadata: { totalTokenCount: 5 } }),
      async () => {
        const req = createMockRequest({ body: { prompt: "hi", history: [historyTurn("user", "prior turn")] } });
        await handleJournalInsightRequest(req, createMockResponse());
      }
    );
  });
  const successFingerprint = parseTelemetryLine(successLines).payload.fingerprint;
  assert.ok(successFingerprint);

  const failureLines = await withCapturedConsoleLog(async () => {
    await withMockedGenerateJournalInsight(
      async () => {
        throw new Error("upstream Gemini failure");
      },
      async () => {
        const req = createMockRequest({ body: { prompt: "hi" } });
        await handleJournalInsightRequest(req, createMockResponse());
      }
    );
  });
  const failureFingerprint = parseTelemetryLine(failureLines).payload.fingerprint;

  const forbiddenLines = await withCapturedConsoleLog(async () => {
    const req = createMockRequest({ origin: "https://malicious.example" });
    await handleJournalInsightRequest(req, createMockResponse());
  });
  const forbiddenFingerprint = parseTelemetryLine(forbiddenLines).payload.fingerprint;

  // Different status/error-category/history combinations must fingerprint
  // differently, proving those fields are actually part of the envelope.
  assert.notEqual(successFingerprint, failureFingerprint);
  assert.notEqual(successFingerprint, forbiddenFingerprint);
  assert.notEqual(failureFingerprint, forbiddenFingerprint);
});
