const { onRequest } = require("firebase-functions/v2/https");
const { geminiApiKey } = require("../config/secrets");
const geminiService = require("../services/gemini");
const { generateSamplingProof } = require("../services/samplingLogger");

const MAX_PROMPT_LENGTH = 500;
const MAX_HISTORY_MESSAGES = 10;
const VALID_HISTORY_ROLES = new Set(["user", "model"]);

function isValidHistoryEntry(entry) {
    if (!entry || typeof entry !== "object") return false;
    if (!VALID_HISTORY_ROLES.has(entry.role)) return false;
    if (!Array.isArray(entry.parts) || entry.parts.length === 0) return false;
    return entry.parts.every((part) => part && typeof part.text === "string" && part.text.length > 0);
}

// Server-side trim regardless of what the client sent, so a misbehaving
// or malicious client can't grow the grounded context unbounded.
function trimHistory(history) {
    return Array.isArray(history) ? history.slice(-MAX_HISTORY_MESSAGES) : [];
}

function validateJournalPayload(body) {
    const errors = [];
    const payload = body && typeof body === "object" ? body : {};

    if (typeof payload.prompt !== "string" || payload.prompt.trim() === "") {
        errors.push("prompt must be a non-empty string");
    } else if (payload.prompt.length > MAX_PROMPT_LENGTH) {
        errors.push(`prompt must be ${MAX_PROMPT_LENGTH} characters or fewer`);
    }
    if (payload.context !== undefined && !Array.isArray(payload.context)) {
        errors.push("context must be an array when provided");
    }
    if (payload.history !== undefined) {
        if (!Array.isArray(payload.history)) {
            errors.push("history must be an array when provided");
        } else if (!payload.history.every(isValidHistoryEntry)) {
            errors.push("history entries must have role 'user'|'model' and non-empty parts[].text");
        }
    }

    return errors;
}

async function handleJournalInsightRequest(req, res) {
    const startedAtNs = process.hrtime.bigint();
    let statusCode = 500;
    let errorCategory = null;
    let usage = null;
    let historyTurns = 0;

    function respond(code, body) {
        statusCode = code;
        return res.status(code).json(body);
    }

    try {
        const origin = req.headers.origin || req.headers.referer || "null";
        const isAllowed = origin.includes('yevgeni.info') || origin.includes('localhost') || origin.includes('127.0.0.1') || origin === "null";

        if (!isAllowed) {
            errorCategory = "forbidden_origin";
            return respond(403, { error: 'Forbidden: Unauthorized Origin' });
        }
        if (req.method !== 'POST') {
            errorCategory = "method_not_allowed";
            return respond(405, { error: "Method Not Allowed" });
        }

        const body = req.body || {};
        const errors = validateJournalPayload(body);
        if (errors.length > 0) {
            errorCategory = "invalid_payload";
            return respond(400, { error: "Invalid journal insight request payload", details: errors });
        }

        const { prompt, context } = body;
        const history = trimHistory(body.history);
        historyTurns = history.length;

        const result = await geminiService.generateJournalInsight({ prompt: prompt.trim(), context, history });
        usage = (result && result.usageMetadata) || null;

        return respond(200, { response: result.text });
    } catch (error) {
        console.error("🚨 Journal Insight Proxy Error:", error);
        errorCategory = errorCategory || "gemini_upstream_error";
        return respond(500, { error: "Internal Server Error generating journal insight" });
    } finally {
        const latencyMs = Number(process.hrtime.bigint() - startedAtNs) / 1e6;
        const proof = generateSamplingProof({
            route: "journalInsightProxy",
            statusCode,
            latencyMs: Math.round(latencyMs * 100) / 100,
            historyTurns,
            errorCategory,
            usage
        });
        console.log(`JOURNAL_TELEMETRY::${JSON.stringify(proof)}`);
    }
}

exports.journalInsightProxy = onRequest({
    secrets: [geminiApiKey],
    cors: true,
    memory: "256MiB",
    invoker: "public"
}, handleJournalInsightRequest);

exports.handleJournalInsightRequest = handleJournalInsightRequest;
exports.validateJournalPayload = validateJournalPayload;
exports.trimHistory = trimHistory;
exports.MAX_HISTORY_MESSAGES = MAX_HISTORY_MESSAGES;
