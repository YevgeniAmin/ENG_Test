const { onRequest } = require("firebase-functions/v2/https");
const { defineSecret } = require("firebase-functions/params");
const { GoogleGenAI } = require("@google/genai");

// הגדרת הסוד מתוך כספת ה-Secrets של Firebase
const geminiApiKey = defineSecret("GEMINI_API_KEY");

exports.secretNexusProxy = onRequest({ 
    secrets: [geminiApiKey], 
    cors: true,
    memory: "512MiB", // הוספנו זיכרון כדי למנוע קריסה בעלייה
    invoker: "public" // השורה שפותחת את הגישה לעולם
}, async (req, res) => {
    
    // אבטחה בסיסית: מאפשרים רק בקשות POST
    if (req.method !== 'POST') {
        return res.status(405).send({ error: "Method Not Allowed" });
    }

    // שליפת השאילתה מה-body
    const userQuery = req.body?.query; 
    if (!userQuery) {
        return res.status(400).send({ error: "Missing query" });
    }

    try {
        // שליפת המפתח מתוך הכספת או משתני הסביבה המקומיים
        const apiKey = process.env.FUNCTIONS_EMULATOR === 'true' 
            ? process.env.GEMINI_API_KEY 
            : geminiApiKey.value();
        
        // אתחול ה-SDK לפי הפורמט הרשמי והמדויק עבור גרסה v1
        const ai = new GoogleGenAI({ 
            apiKey: apiKey,
            httpOptions: {
                apiVersion: 'v1'
            }
        });

        // הרכבת הוראות המערכת לפרויקט שלנו
        const systemInstruction = "You are an expert Windows System Administrator and PowerShell R&D Specialist at yevgeni.info. Keep responses highly technical and localized in Hebrew/English. Include precise PowerShell code blocks.";
        const fullPrompt = `${systemInstruction}\n\nUser Query: ${userQuery}`;

        // קריאה למודל הדור החדש (מהיר, זול ומדויק בהרבה)
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: fullPrompt
        });

        // החזרת התשובה בצורה נקייה ל-Frontend
        res.status(200).send({ reply: response.text });

    } catch (error) {
        console.error("API Error:", error);
        res.status(500).send({ 
            error: "Failed to connect to Gemini API",
            details: error.message 
        });
    } 
});