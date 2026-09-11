const { defineSecret } = require("firebase-functions/params");

const geminiApiKey = defineSecret("GEMINI_API_KEY");
const driveServiceAccount = defineSecret("GOOGLE_DRIVE_SERVICE_ACCOUNT");

module.exports = { geminiApiKey, driveServiceAccount };
