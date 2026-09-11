const { google } = require("googleapis");
const { driveServiceAccount } = require("../config/secrets");

const DRIVE_FOLDER_ID = "1FfVbQsuEWd90rNDJFcccgSw7gjhX4tgv";

async function listDriveVersions() {
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

    return response.data.files || [];
}

function buildPortalRegistry(files) {
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

    return portalRegistry;
}

module.exports = { DRIVE_FOLDER_ID, listDriveVersions, buildPortalRegistry };
