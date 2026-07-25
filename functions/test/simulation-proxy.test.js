const assert = require("node:assert/strict");
const test = require("node:test");

const {
  handleAtpSimulationRequest,
  validateSimulationPayload
} = require("../src/http/simulationProxy");

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

test("validateSimulationPayload rejects missing/invalid fields", () => {
  assert.deepEqual(validateSimulationPayload({}), [
    "unitId must be a non-empty string",
    "testProfile must be a non-empty string"
  ]);
  assert.deepEqual(validateSimulationPayload({ unitId: "UUT-1", testProfile: "standard", parameters: "not-an-object" }), [
    "parameters must be an object when provided"
  ]);
  assert.deepEqual(validateSimulationPayload({ unitId: "UUT-1", testProfile: "standard" }), []);
});

test("handleAtpSimulationRequest returns a structured response with status, logs, and an ADS-000 proof", async () => {
  const req = createMockRequest({ body: { unitId: "UUT-1", testProfile: "standard", parameters: { retries: 2 } } });
  const res = createMockResponse();

  await handleAtpSimulationRequest(req, res);

  assert.equal(res.statusCode, 200);
  assert.equal(res.body.unitId, "UUT-1");
  assert.equal(res.body.testProfile, "standard");
  assert.ok(["ACCEPTED", "REJECTED"].includes(res.body.status));
  assert.ok(Array.isArray(res.body.logs) && res.body.logs.length > 0);
  assert.equal(res.body.proof.ads, "ADS-000");
  assert.match(res.body.proof.payload.fingerprint, /^[a-f0-9]{64}$/);
});

test("handleAtpSimulationRequest is deterministic for the same unitId/testProfile", async () => {
  const req = createMockRequest({ body: { unitId: "UUT-42", testProfile: "burn-in" } });

  const resA = createMockResponse();
  await handleAtpSimulationRequest(req, resA);
  const resB = createMockResponse();
  await handleAtpSimulationRequest(req, resB);

  assert.equal(resA.body.status, resB.body.status);
});

test("handleAtpSimulationRequest rejects invalid payloads with 400", async () => {
  const req = createMockRequest({ body: { unitId: "" } });
  const res = createMockResponse();

  await handleAtpSimulationRequest(req, res);

  assert.equal(res.statusCode, 400);
  assert.ok(Array.isArray(res.body.details) && res.body.details.length > 0);
});

test("handleAtpSimulationRequest rejects non-POST methods with 405", async () => {
  const req = createMockRequest({ method: "GET" });
  const res = createMockResponse();

  await handleAtpSimulationRequest(req, res);

  assert.equal(res.statusCode, 405);
});

test("handleAtpSimulationRequest rejects disallowed origins with 403", async () => {
  const req = createMockRequest({ origin: "https://malicious.example" });
  const res = createMockResponse();

  await handleAtpSimulationRequest(req, res);

  assert.equal(res.statusCode, 403);
});
