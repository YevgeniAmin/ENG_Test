const { onRequest } = require("firebase-functions/v2/https");
const { defineSecret } = require("firebase-functions/params");
const { GoogleGenAI } = require("@google/genai");
const { google } = require("googleapis");

const geminiApiKey = defineSecret("GEMINI_API_KEY");
const driveServiceAccount = defineSecret("GOOGLE_DRIVE_SERVICE_ACCOUNT");
const DRIVE_FOLDER_ID = "1FfVbQsuEWd90rNDJFcccgSw7gjhX4tgv";

// ⚠️
const LOCAL_NEXUS_URL = ""; 

// חוקת אבטחה סמנטית לעקיפת חסימות שווא בניתוח קוד ושרטוטים הנדסיים
const SEMANTIC_SAFETY_SETTINGS = [
    { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_NONE" },
    { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_NONE" },
    { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_NONE" },
    { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_NONE" },
    { category: "HARM_CATEGORY_CIVIC_INTEGRITY", threshold: "BLOCK_NONE" }
];


// ============================================================================
// 📂 3. פונקציית סנכרון גרסאות מול Google Drive (Live API)
// ============================================================================
exports.driveVersionsProxy = onRequest({ 
    secrets: [driveServiceAccount], 
    cors: true,
    memory: "256MiB", 
    invoker: "public" 
}, async (req, res) => {
    const origin = req.headers.origin || req.headers.referer || "null";
    const isAllowed = origin.includes('yevgeni.info') || origin.includes('localhost') || origin.includes('127.0.0.1') || origin === "null";

    if (!isAllowed) return res.status(403).json({ error: 'Forbidden: Unauthorized Origin' });
    if (req.method !== 'GET') return res.status(405).send({ error: "Method Not Allowed" });

    try {
        const credentialsText = process.env.FUNCTIONS_EMULATOR === 'true' ? process.env.GOOGLE_DRIVE_SERVICE_ACCOUNT : driveServiceAccount.value();
        const credentials = JSON.parse(credentialsText);

        const auth = new google.auth.GoogleAuth({
            credentials,
            scopes: ['https://www.googleapis.com/auth/drive.readonly'],
        });
        const drive = google.drive({ version: 'v3', auth });

        const response = await drive.files.list({
            q: `'${DRIVE_FOLDER_ID}' in parents and trashed = false`,
            fields: 'files(id, name, modifiedTime, version, webViewLink)',
            orderBy: 'modifiedTime desc'
        });

        const files = response.data.files || [];
        const portalRegistry = {
            metadata: { generatedAt: new Date().toISOString(), totalFiles: files.length },
            items: {}
        };

        files.forEach(file => {
            const keyName = file.name.replace(/\.[^/.]+$/, "").replace(/ /g, '_').replace(/-/g, '_').toLowerCase();
            const rawDate = file.modifiedTime;
            const cleanDate = rawDate ? rawDate.replace('T', ' ').split('.')[0] : "N/A";
            
            let autoVersion = '1.0.0';
            if (rawDate) {
                const dateObj = new Date(rawDate);
                const year = dateObj.getFullYear().toString().slice(-2);
                const month = String(dateObj.getMonth() + 1).padStart(2, '0');
                const day = String(dateObj.getDate()).padStart(2, '0');
                const hh = String(dateObj.getHours()).padStart(2, '0');
                const mm = String(dateObj.getMinutes()).padStart(2, '0');
                const ss = String(dateObj.getSeconds()).padStart(2, '0');
                
                const decimalTime = parseInt(hh + mm + ss, 10);
                const base36Time = decimalTime.toString(36).toUpperCase();
                autoVersion = `${year}.${month}.${day}-${base36Time}`;
            }
            
            portalRegistry.items[keyName] = {
                fileName: file.name,
                version: autoVersion,
                lastModified: cleanDate
            };
        });

        res.set('Cache-Control', 'public, max-age=600, s-maxage=600');
        return res.status(200).json(portalRegistry);

    } catch (error) {
        console.error("🚨 Drive Version Sync Error:", error);
        return res.status(500).send({ error: "Internal Server Error syncing versions" });
    }
});
