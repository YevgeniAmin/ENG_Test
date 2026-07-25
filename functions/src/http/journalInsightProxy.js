const { onRequest } = require("firebase-functions/v2/https");
const { geminiApiKey } = require("../config/secrets");
const geminiService = require("../services/gemini");

const MAX_PROMPT_LENGTH = 500;

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

    return errors;
}

async function handleJournalInsightRequest(req, res) {
    const origin = req.headers.origin || req.headers.referer || "null";
    const isAllowed = origin.includes('yevgeni.info') || origin.includes('localhost') || origin.includes('127.0.0.1') || origin === "null";

    if (!isAllowed) return res.status(403).json({ error: 'Forbidden: Unauthorized Origin' });
    if (req.method !== 'POST') return res.status(405).json({ error: "Method Not Allowed" });

    try {
        const body = req.body || {};
        const errors = validateJournalPayload(body);
        if (errors.length > 0) {
            return res.status(400).json({ error: "Invalid journal insight request payload", details: errors });
        }

        const { prompt, context } = body;
        const text = await geminiService.generateJournalInsight({ prompt: prompt.trim(), context });

        return res.status(200).json({ response: text });
    } catch (error) {
        console.error("🚨 Journal Insight Proxy Error:", error);
        return res.status(500).json({ error: "Internal Server Error generating journal insight" });
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
