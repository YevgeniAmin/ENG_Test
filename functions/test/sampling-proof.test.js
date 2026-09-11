const assert = require("node:assert/strict");
const test = require("node:test");

const { generateSamplingProof } = require("../src/services/samplingLogger");

test("generateSamplingProof returns a well-formed ADS-000 telemetry envelope", () => {
  const proof = generateSamplingProof({ route: "driveVersionsProxy", count: 3 });

  assert.equal(proof.ads, "ADS-000");
  assert.equal(typeof proof.schemaVersion, "string");
  assert.ok(!Number.isNaN(Date.parse(proof.timestamp)), "timestamp must be a valid ISO date");

  assert.ok(proof.commit && typeof proof.commit.sha === "string");
  assert.ok(["git", "env", "unresolved"].includes(proof.commit.source));

  assert.equal(proof.runtime.node, process.version);
  assert.equal(typeof proof.runtime.environment, "string");

  assert.match(proof.payload.fingerprint, /^[a-f0-9]{64}$/);
  assert.equal(proof.payload.fieldCount, 2);
});

test("generateSamplingProof fingerprint is stable regardless of key order and sensitive to payload changes", () => {
  const proofA = generateSamplingProof({ route: "driveVersionsProxy", count: 3 });
  const proofB = generateSamplingProof({ count: 3, route: "driveVersionsProxy" });
  const proofC = generateSamplingProof({ route: "driveVersionsProxy", count: 4 });

  assert.equal(proofA.payload.fingerprint, proofB.payload.fingerprint);
  assert.notEqual(proofA.payload.fingerprint, proofC.payload.fingerprint);
});

test("generateSamplingProof defaults to an empty payload when called with no metadata", () => {
  const proof = generateSamplingProof();

  assert.equal(proof.payload.fieldCount, 0);
  assert.match(proof.payload.fingerprint, /^[a-f0-9]{64}$/);
});
