const crypto = require("node:crypto");
const { onRequest } = require("firebase-functions/v2/https");
const { generateSamplingProof } = require("../services/samplingLogger");

// No live caller exists yet: the ATP AI Simulation page
// (public/atp-ai-simulation.html) fills its form from a hardcoded
// client-side mock object and never calls a backend. This endpoint is
// scaffolding for a future integration, not wired to that page.

function validateSimulationPayload(body) {
    const errors = [];
    const payload = body && typeof body === "object" ? body : {};

    if (typeof payload.unitId !== "string" || payload.unitId.trim() === "") {
        errors.push("unitId must be a non-empty string");
    }
    if (typeof payload.testProfile !== "string" || payload.testProfile.trim() === "") {
        errors.push("testProfile must be a non-empty string");
    }
    if (payload.parameters !== undefined && (typeof payload.parameters !== "object" || payload.parameters === null || Array.isArray(payload.parameters))) {
        errors.push("parameters must be an object when provided");
    }

    return errors;
}

// Deterministic mock outcome (not a real UUT test result): the same
// unitId + testProfile pair always yields the same status, so callers
// can rely on reproducible simulation behavior.
function deriveMockStatus(unitId, testProfile) {
    const digest = crypto.createHash("sha256").update(`${unitId}:${testProfile}`).digest();
    return digest[0] % 2 === 0 ? "ACCEPTED" : "REJECTED";
}

function buildSimulationResult(unitId, testProfile, parameters) {
    const status = deriveMockStatus(unitId, testProfile);
    const logs = [
        `[INIT] Starting simulation for unit "${unitId}" using profile "${testProfile}"`,
        `[EXEC] Applying ${Object.keys(parameters).length} parameter override(s)`,
        `[RESULT] Simulation completed with status ${status}`
    ];

    return { status, logs };
}

async function handleAtpSimulationRequest(req, res) {
    const origin = req.headers.origin || req.headers.referer || "null";
    const isAllowed = origin.includes('yevgeni.info') || origin.includes('localhost') || origin.includes('127.0.0.1') || origin === "null";

    if (!isAllowed) return res.status(403).json({ error: 'Forbidden: Unauthorized Origin' });
    if (req.method !== 'POST') return res.status(405).json({ error: "Method Not Allowed" });

    try {
        const body = req.body || {};
        const errors = validateSimulationPayload(body);
        if (errors.length > 0) {
            return res.status(400).json({ error: "Invalid simulation request payload", details: errors });
        }

        const { unitId, testProfile } = body;
        const parameters = body.parameters || {};

        const { status, logs } = buildSimulationResult(unitId, testProfile, parameters);
        const proof = generateSamplingProof({ unitId, testProfile, parameters });

        return res.status(200).json({
            unitId,
            testProfile,
            status,
            logs,
            proof
        });
    } catch (error) {
        console.error("🚨 ATP Simulation Proxy Error:", error);
        return res.status(500).json({ error: "Internal Server Error running simulation" });
    }
}

exports.atpSimulationProxy = onRequest({
    cors: true,
    memory: "256MiB",
    invoker: "public"
}, handleAtpSimulationRequest);

exports.handleAtpSimulationRequest = handleAtpSimulationRequest;
exports.validateSimulationPayload = validateSimulationPayload;
