const crypto = require("node:crypto");
const { execSync } = require("node:child_process");

// No ADS-000 document exists in this repository (its Source of Truth is
// Google Drive, per ADS-003's document-identification table) — this envelope
// covers the four elements requested for the ADS-000 proof-of-sampling
// utility, not a verified field-level spec.
const ADS_SCHEMA_VERSION = "1.0.0";

function canonicalize(value) {
  if (Array.isArray(value)) {
    return value.map(canonicalize);
  }
  if (value && typeof value === "object") {
    return Object.keys(value)
      .sort()
      .reduce((acc, key) => {
        acc[key] = canonicalize(value[key]);
        return acc;
      }, {});
  }
  return value;
}

function resolveCommitHash() {
  try {
    const sha = execSync("git rev-parse HEAD", {
      cwd: __dirname,
      stdio: ["ignore", "pipe", "ignore"]
    })
      .toString()
      .trim();
    return { sha, source: "git" };
  } catch (_error) {
    const envSha = process.env.GIT_COMMIT_SHA || process.env.COMMIT_SHA;
    if (envSha) return { sha: envSha, source: "env" };
    return { sha: "unknown", source: "unresolved" };
  }
}

function generateSamplingProof(metadata = {}) {
  const fingerprint = crypto
    .createHash("sha256")
    .update(JSON.stringify(canonicalize(metadata)))
    .digest("hex");

  return {
    ads: "ADS-000",
    schemaVersion: ADS_SCHEMA_VERSION,
    timestamp: new Date().toISOString(),
    commit: resolveCommitHash(),
    runtime: {
      node: process.version,
      environment: process.env.FUNCTIONS_EMULATOR === "true"
        ? "emulator"
        : (process.env.NODE_ENV || "production")
    },
    payload: {
      fingerprint,
      fieldCount: Object.keys(metadata).length
    }
  };
}

module.exports = { generateSamplingProof };
