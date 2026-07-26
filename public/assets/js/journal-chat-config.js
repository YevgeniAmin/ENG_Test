/**
 * Journal Chat v2 feature flag.
 *
 * Static, local, no build step or server dependency - flip v2Enabled to
 * true and reload to activate the unified Chat Canvas (journal-chat-ui.js).
 * When false (the default), notebook-simulator.js's existing chat/template
 * UI renders exactly as before; journal-chat-ui.js no-ops.
 */
window.JOURNAL_CHAT_CONFIG = Object.freeze({
    v2Enabled: false
});
