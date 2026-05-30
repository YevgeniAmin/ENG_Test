const { onRequest } = require("firebase-functions/v2/https");
const { defineSecret } = require("firebase-functions/params");
const { GoogleGenAI } = require("@google/genai");

const geminiApiKey = defineSecret("GEMINI_API_KEY");
const translateApiKey = defineSecret("GOOGLE_TRANSLATE_API_KEY"); 

// ============================================================================
// 🧚‍♀️ 1. פונקציית הפיה הדיגיטלית (Google Gemini Proxy)
// ============================================================================
exports.secretNexusProxy = onRequest({ 
    secrets: [geminiApiKey], 
    cors: true,
    memory: "512MiB", 
    invoker: "public" 
}, async (req, res) => {
    
    // 🛡️ חומת אש פנימית (Firewall)
    const origin = req.headers.origin || req.headers.referer || "null";
    const isAllowed = origin.includes('yevgeni.info') || origin.includes('localhost') || origin.includes('127.0.0.1') || origin.includes('192.168.') || origin.includes('10.0.') || origin === "null";

    if (!isAllowed) {
        console.warn(`🚨 Unauthorized access attempt to Gemini Proxy from: ${origin}`);
        return res.status(403).json({ error: 'Forbidden: Unauthorized Origin' });
    }

    if (req.method !== 'POST') return res.status(405).send({ error: "Method Not Allowed" });

    const userQuery = req.body?.query; 
    if (!userQuery) return res.status(400).send({ error: "Missing query" });

    try {
        const apiKey = process.env.FUNCTIONS_EMULATOR === 'true' ? process.env.GEMINI_API_KEY : geminiApiKey.value();
        const ai = new GoogleGenAI({ apiKey: apiKey, httpOptions: { apiVersion: 'v1' } });
        const systemInstruction = "You are an expert Windows System Administrator and PowerShell R&D Specialist at yevgeni.info. Keep responses highly technical and localized in Hebrew/English. Include precise PowerShell commands when applicable.";

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: userQuery,
            config: { systemInstruction: systemInstruction, temperature: 0.3 }
        });

        if (response && response.text) return res.status(200).send({ result: response.text });
        throw new Error("Invalid response from Gemini model");

    } catch (error) {
        console.error("🚨 Nexus Proxy Error:", error);
        return res.status(500).send({ error: "Internal Server Error during processing" });
    }
});

// ============================================================================
// 🌍 2. פונקציית התרגום הגלובלית (Google Translate API - Batch Mode)
// ============================================================================
exports.translateNexusProxy = onRequest({ 
    secrets: [translateApiKey], 
    cors: true,
    memory: "256MiB",
    invoker: "public"
}, async (req, res) => {
    
    // 🛡️ חומת אש פנימית (Firewall)
    const origin = req.headers.origin || req.headers.referer || "null";
    const isAllowed = origin.includes('yevgeni.info') || origin.includes('localhost') || origin.includes('127.0.0.1') || origin.includes('192.168.') || origin === "null";

    if (!isAllowed) {
        console.warn(`🚨 Unauthorized access attempt to Translate Proxy from: ${origin}`);
        return res.status(403).json({ error: 'Forbidden: Unauthorized Origin' });
    }

    if (req.method !== 'POST') return res.status(405).send({ error: "Method Not Allowed" });

    const textsArray = req.body?.texts; 
    const targetLanguage = req.body?.targetLanguage;

    if (!textsArray || !Array.isArray(textsArray) || !targetLanguage) {
        return res.status(400).json({ error: 'Missing texts array or targetLanguage' });
    }

    try {
        const apiKey = process.env.FUNCTIONS_EMULATOR === 'true' ? process.env.GOOGLE_TRANSLATE_API_KEY : translateApiKey.value();

        const response = await fetch(`https://translation.googleapis.com/language/translate/v2?key=${apiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Referer': 'https://yevgeni.info' },
            body: JSON.stringify({ q: textsArray, target: targetLanguage, format: 'html' })
        });

        const data = await response.json();
        
        if (data.data && data.data.translations) {
            const translatedTexts = data.data.translations.map(t => t.translatedText);
            return res.json({ translatedTexts: translatedTexts });
        } else {
            return res.status(502).json({ error: 'Invalid response from Google API' });
        }
    } catch (error) {
        console.error('Translation Proxy Error 🚨:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});