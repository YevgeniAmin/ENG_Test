const { onRequest } = require("firebase-functions/v2/https");
const { driveServiceAccount } = require("../config/secrets");
const { listDriveVersions, buildPortalRegistry } = require("../services/drive");

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
        const files = await listDriveVersions();
        const portalRegistry = buildPortalRegistry(files);

        res.set('Cache-Control', 'public, max-age=600, s-maxage=600');
        return res.status(200).json(portalRegistry);

    } catch (error) {
        console.error("🚨 Drive Version Sync Error:", error);
        return res.status(500).send({ error: "Internal Server Error syncing versions" });
    }
});
