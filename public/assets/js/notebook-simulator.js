/**
 * ENG-Portal - NotebookLM Simulation Engine
 * Architecture: Component-Based Vanilla JS (Zero Frameworks)
 * Telemetry Tier: Structured JSON journal data, with a Gemini-backed
 * live insight mode and an offline keyword-match fallback.
 * Safety Protocol: Secure Context Protection & Client-Side Output Sanitization
 */

const JOURNAL_DATA_URL = "assets/data/journal-entries.json";
const GEMINI_REQUEST_TIMEOUT_MS = 8000;

// Phase 2: multi-turn conversation state, capped to keep the grounded
// context (and the request payload) bounded. Matches the backend's cap in
// functions/src/http/journalInsightProxy.js.
const MAX_HISTORY_MESSAGES = 10;
let conversationHistory = [];

// Retained as a resilience fallback if journal-entries.json can't be
// fetched (offline, network hiccup, etc.) so the panel never goes blank.
const FALLBACK_KNOWLEDGE_BASE = {
    "system-evolution": {
        title: "1. System Evolution & R&D Milestones",
        source: "Source: Project_Historical_Context.md",
        insights: [
            "Phase 1: Cloud-Only UI Era focused on static interfaces using Tailwind CSS and Web Audio API.",
            "Phase 2: Local Edge AI Shift via bare-metal self-hosting on Proxmox VE (srv-1), utilizing a dedicated RTX 5060 Ti GPU passed through to LXC/Docker.",
            "Phase 3 & 4: Overcame strict CORS policies and firewall crashes by inventing the Secret Nexus Proxy (Node.js) for Hybrid Edge-Cloud Routing.",
            "Phase 5: Transitioned to Enterprise Zero-Trust infrastructure using Cloudflare Tunnels (srv-1.yevgeni.info) and Bearer Token authorizations."
        ]
    },
    "architectural-decisions": {
        title: "2. Major Architectural & Business Decisions",
        source: "Source: Project_Historical_Context.md",
        insights: [
            "Hybrid Edge-Cloud Routing: Prioritize local 48W GPU for heavy R&D tasks, with dynamic failover to elastic Google Gemini Cloud APIs.",
            "Vanilla Web Standard: Purged external frameworks (Tailwind, React) in favor of semantic HTML5, vanilla JS, and global M3 CSS variables (:root).",
            "Constitutional AI: Hard-coded behavioral safety policies inside the server.js proxy to guarantee deterministic mapping formats.",
            "Semantic Global Sync: Deployed version-sync.js to inject unified version strings (v2.4.0-Sim) and telemetry across all decoupled portal interfaces."
        ]
    },
    "code-components": {
        title: "3. Developed Code Components & Technical Modules",
        source: "Source: Project_Historical_Context.md",
        insights: [
            "Secret Nexus Proxy: Node.js middleware powered by Firebase/Firestore to manage telemetry, routing, and token protection.",
            "PowerShell Enterprise Simulator: Desktop-first Material Design 3 dashboard dynamically rendering client-side script outputs and execution progress.",
            "Advanced Audio QA Lab: Web Audio API engine executing SNR sweeps, phase control, and 24-bit/96kHz lossless file compilation.",
            "Vision-to-Code Pipeline: Local Docker multi-agent script converting Base64 schematic data through LLaVA/Gemini to deep-learning models (Llama 3.1)."
        ]
    },
    "ai-advisory-board": {
        title: "4. AI Advisory Board Framework & Team Personas",
        source: "Source: Project_Historical_Context.md",
        insights: [
            "Max (Gemini Node): SQA Director executing strict bug hunting, CORS testing, event log audits, and Audio lab validation.",
            "David (ChatGPT Node): Technical PM orchestrating Agile sprints, milestone tracking, and timeline enforcement.",
            "Copilot (GitHub Node): Solutions Architect generating ATP templates, infrastructure blueprints, and cloud configurations.",
            "Naftali (Local Agent): Electronics & Hardware Specialist handling EDA, OrCAD library validation, and MPN matrices."
        ]
    },
    "glossary": {
        title: "5. Internal Vocabulary, Glossary & Terminology",
        source: "Source: Project_Historical_Context.md",
        insights: [
            "ATP/ATR & VDD: Strict hardware/software workflow patterns for Acceptance Testing and automated Version Description tracking.",
            "LXC (Linux Containers): Lightweight virtualization on Proxmox separating frontend interfaces from backend AI engines.",
            "M3 Tokens: Semantic design atoms stored as CSS variables enforcing visual continuity across the decoupled system.",
            "Zero Inline Styles: Mandatory engineering constraint forcing layout control into pure layout spreadsheets."
        ]
    }
};

let notebookKnowledgeBase = FALLBACK_KNOWLEDGE_BASE;

// ==========================================================================
// Component Initialization & Event Mapping
// ==========================================================================
document.addEventListener("DOMContentLoaded", () => {
    initNotebookSimulator();
});

async function initNotebookSimulator() {
    const selector = document.getElementById("templateSelector");
    const sendBtn = document.getElementById("sendPromptBtn");
    const inputField = document.getElementById("aiPromptInput");

    if (!selector || !sendBtn || !inputField) {
        console.warn("[NotebookLM Sim] Required DOM nodes not found. Staging fallback event attachment loops.");
        return;
    }

    notebookKnowledgeBase = await loadJournalEntries();

    // Trigger initial render based on default selection
    loadSelectedTemplate(selector.value);

    // Dropdown change listener
    selector.addEventListener("change", (e) => {
        loadSelectedTemplate(e.target.value);
    });

    // Chat prompt submission listener
    sendBtn.addEventListener("click", () => {
        handleUserPrompt(inputField.value);
        inputField.value = ""; // Reset field input
    });

    inputField.addEventListener("keypress", (e) => {
        if (e.key === "Enter") {
            handleUserPrompt(inputField.value);
            inputField.value = "";
        }
    });
}

// ==========================================================================
// Structured Journal Data Loading (with offline fallback)
// ==========================================================================
async function loadJournalEntries() {
    try {
        const response = await fetch(JOURNAL_DATA_URL, { cache: "no-store" });
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        const templates = Array.isArray(data.templates) ? data.templates : [];
        if (templates.length === 0) {
            throw new Error("journal-entries.json contained no templates");
        }

        return templates.reduce((knowledgeBase, entry) => {
            if (entry && typeof entry.key === "string") {
                knowledgeBase[entry.key] = entry;
            }
            return knowledgeBase;
        }, {});
    } catch (error) {
        console.warn("[NotebookLM Sim] Falling back to embedded journal data:", error);
        return FALLBACK_KNOWLEDGE_BASE;
    }
}

// ==========================================================================
// Core Streaming & Chunk Rendering Engines
// ==========================================================================
let typingTimeout = null;

function loadSelectedTemplate(key) {
    const data = notebookKnowledgeBase[key];
    if (!data) return;

    // Clear any active typewriter loops to prevent async overlaps
    if (typingTimeout) clearTimeout(typingTimeout);

    // Switching templates changes topic, so the prior Gemini conversation
    // turns are no longer relevant grounding for follow-up questions.
    conversationHistory = [];

    // Safe targeting of container areas
    const insightsList = document.querySelector(".insights-list");
    const studioTitle = document.querySelector(".recent-insights h4");

    if (studioTitle) {
        studioTitle.textContent = `${data.title} (${data.source})`;
    }

    if (!insightsList) return;
    insightsList.innerHTML = ""; // Clear active viewport lines

    // Build the consolidated string to type out smoothly
    let masterTextIndex = 0;
    const combinedContent = data.insights.map(item => `• ${item}`).join("\n\n");

    // Create a safe text layout block inside the viewport
    const blockDisplay = document.createElement("div");
    blockDisplay.style.whiteSpace = "pre-wrap";
    blockDisplay.style.fontFamily = "var(--font-family-base, sans-serif)";
    blockDisplay.style.fontSize = "0.85rem";
    blockDisplay.style.lineHeight = "1.5";
    blockDisplay.style.color = "#334155";
    insightsList.appendChild(blockDisplay);

    // Execute character streaming script loop
    function streamCharacters() {
        if (masterTextIndex < combinedContent.length) {
            // Secure injection: append plain text characters to bypass XSS injection models
            blockDisplay.textContent += combinedContent.charAt(masterTextIndex);
            masterTextIndex++;
            typingTimeout = setTimeout(streamCharacters, 4); // Fast, high-fidelity processing
        }
    }

    streamCharacters();
}

/**
 * Handle custom user prompt queries. Tries a live Gemini-backed answer
 * first, sending along the running conversation history for multi-turn
 * context; falls back to the offline keyword-match simulation if the
 * backend is unreachable (no network, no functions emulator, CORS, etc.).
 * Prior turns accumulate as chat bubbles rather than replacing each other.
 */
async function handleUserPrompt(rawInput) {
    // 1. Strict Input Sanitization Protocol
    const sanitizedInput = rawInput.replace(/<[^>]*>/g, "").trim();
    if (!sanitizedInput) return;

    const insightsList = document.querySelector(".insights-list");
    if (!insightsList) return;

    // 2. Render the user's turn, then a pending status bubble
    appendChatBubble("user", sanitizedInput);

    const statusBubble = appendChatBubble(
        "status",
        `Searching compiled index for: "<strong>${escapeHtml(sanitizedInput)}</strong>"...`,
        { mode: "html" }
    );

    // 3. Try the live Gemini endpoint, otherwise fall back to the local match
    const liveAnswer = await requestGeminiInsight(sanitizedInput);

    if (statusBubble) statusBubble.remove();

    if (liveAnswer) {
        conversationHistory.push({ role: "user", parts: [{ text: sanitizedInput }] });
        conversationHistory.push({ role: "model", parts: [{ text: liveAnswer }] });
        conversationHistory = conversationHistory.slice(-MAX_HISTORY_MESSAGES);

        appendChatBubble("assistant", liveAnswer, { mode: "markdown", label: "Gemini Live" });
    } else {
        appendChatBubble("assistant", matchLocalInsight(sanitizedInput), { mode: "markdown", label: "Offline Match" });
    }
}

/**
 * Appends a single chat bubble (user turn, pending status, or assistant
 * reply) to the insights panel and keeps it scrolled to the latest message.
 * `mode` controls how `content` is placed into the DOM:
 *   - "text" (default): safe plain text via textContent, no HTML parsing.
 *   - "html": caller-provided HTML that has already been escaped/composed
 *     safely (used only for the small pending-status line below).
 *   - "markdown": rendered through renderMarkdownSafe(), which escapes all
 *     source text before ever building HTML tags.
 */
function appendChatBubble(role, content, { mode = "text", label = null } = {}) {
    const insightsList = document.querySelector(".insights-list");
    if (!insightsList) return null;

    const bubble = document.createElement("div");
    bubble.className = `chat-bubble chat-bubble--${role}`;

    if (label) {
        const badge = document.createElement("span");
        badge.className = "chat-bubble-badge";
        badge.textContent = label;
        bubble.appendChild(badge);
    }

    const body = document.createElement("div");
    body.className = "chat-bubble-content";
    if (mode === "markdown") {
        body.innerHTML = renderMarkdownSafe(content);
    } else if (mode === "html") {
        body.innerHTML = content;
    } else {
        body.textContent = content;
    }
    bubble.appendChild(body);

    insightsList.appendChild(bubble);
    insightsList.scrollTop = insightsList.scrollHeight;
    return bubble;
}

/**
 * Renders a small, safe subset of Markdown (bold, italics, inline code,
 * fenced code blocks, unordered lists) into sanitized HTML. Code spans/
 * blocks are pulled out and escaped independently of the inline-formatting
 * pass, and all remaining text is HTML-escaped before any tag is built —
 * no raw text from a model response ever reaches innerHTML unescaped.
 */
function renderMarkdownSafe(rawText) {
    const text = String(rawText == null ? "" : rawText);
    const codeBlocks = [];
    const inlineCodes = [];

    let working = text.replace(/```([a-zA-Z0-9_-]*)\n?([\s\S]*?)```/g, (_match, lang, code) => {
        const index = codeBlocks.length;
        codeBlocks.push({ lang: lang.trim(), code });
        return ` BLOCK${index} `;
    });

    working = working.replace(/`([^`\n]+)`/g, (_match, code) => {
        const index = inlineCodes.length;
        inlineCodes.push(code);
        return ` INLINE${index} `;
    });

    const escaped = escapeHtml(working);
    const lines = escaped.split("\n");
    const htmlParts = [];
    let listBuffer = [];

    function flushList() {
        if (listBuffer.length > 0) {
            htmlParts.push(`<ul>${listBuffer.join("")}</ul>`);
            listBuffer = [];
        }
    }

    function restoreInlineCodeAndFormatting(line) {
        const withCode = line.replace(/ INLINE(\d+) /g, (_match, i) => {
            return `<code>${escapeHtml(inlineCodes[Number(i)])}</code>`;
        });
        return applyInlineFormatting(withCode);
    }

    for (const line of lines) {
        const blockMatch = line.match(/^ BLOCK(\d+) $/);
        if (blockMatch) {
            flushList();
            const block = codeBlocks[Number(blockMatch[1])];
            const escapedCode = escapeHtml(block.code.replace(/\n$/, ""));
            const langClass = block.lang ? ` class="language-${escapeHtml(block.lang)}"` : "";
            htmlParts.push(`<pre class="chat-code-block"><code${langClass}>${escapedCode}</code></pre>`);
            continue;
        }

        const listMatch = line.match(/^\s*[-*]\s+(.*)$/);
        if (listMatch) {
            listBuffer.push(`<li>${restoreInlineCodeAndFormatting(listMatch[1])}</li>`);
            continue;
        }

        flushList();
        if (line.trim() === "") {
            htmlParts.push("<br>");
        } else {
            htmlParts.push(`<p>${restoreInlineCodeAndFormatting(line)}</p>`);
        }
    }
    flushList();

    return htmlParts.join("");
}

function applyInlineFormatting(escapedLine) {
    return escapedLine
        .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
        .replace(/\*([^*]+)\*/g, "<em>$1</em>")
        .replace(/_([^_]+)_/g, "<em>$1</em>");
}

// ==========================================================================
// Gemini Live Insight Mode
// ==========================================================================
function resolveJournalInsightEndpoint() {
    const { hostname } = window.location;
    const isLocal = hostname === "localhost" || hostname === "127.0.0.1";
    return isLocal
        ? "http://127.0.0.1:5001/eng-web-portal/us-central1/journalInsightProxy"
        : "https://us-central1-eng-web-portal.cloudfunctions.net/journalInsightProxy";
}

async function requestGeminiInsight(prompt) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), GEMINI_REQUEST_TIMEOUT_MS);

    try {
        const response = await fetch(resolveJournalInsightEndpoint(), {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                prompt,
                context: Object.values(notebookKnowledgeBase)
            }),
            signal: controller.signal
        });

        if (!response.ok) return null;

        const data = await response.json();
        return typeof data.response === "string" ? data.response : null;
    } catch (error) {
        console.warn("[NotebookLM Sim] Gemini live request unavailable, using offline match:", error);
        return null;
    } finally {
        clearTimeout(timeoutId);
    }
}

/**
 * Offline keyword-match simulation (original static behavior), used when
 * the Gemini backend can't be reached.
 */
function matchLocalInsight(sanitizedInput) {
    const inputLower = sanitizedInput.toLowerCase();
    let matchedText = "Cognitive engine query complete. No direct mapping constraint found for this query token. Please select a template tab above to stream verified engineering specs.";

    if (inputLower.includes("evolution") || inputLower.includes("proxmox") || inputLower.includes("cors") || inputLower.includes("cloudflare") || inputLower.includes("gpu")) {
        matchedText = `[Matched Asset Index: System Evolution]\n• ${notebookKnowledgeBase["system-evolution"].insights[1]}\n\n• ${notebookKnowledgeBase["system-evolution"].insights[2]}`;
    } else if (inputLower.includes("architecture") || inputLower.includes("vanilla") || inputLower.includes("css") || inputLower.includes("hybrid") || inputLower.includes("m3") || inputLower.includes("routing")) {
        matchedText = `[Matched Asset Index: Architectural Decisions]\n• ${notebookKnowledgeBase["architectural-decisions"].insights[0]}\n\n• ${notebookKnowledgeBase["architectural-decisions"].insights[1]}`;
    } else if (inputLower.includes("audio") || inputLower.includes("vision") || inputLower.includes("proxy") || inputLower.includes("powershell") || inputLower.includes("code") || inputLower.includes("lab")) {
        matchedText = `[Matched Asset Index: Code Components]\n• ${notebookKnowledgeBase["code-components"].insights[2]}\n\n• ${notebookKnowledgeBase["code-components"].insights[3]}`;
    } else if (inputLower.includes("ai") || inputLower.includes("max") || inputLower.includes("david") || inputLower.includes("copilot") || inputLower.includes("naftali") || inputLower.includes("qa") || inputLower.includes("agent")) {
        matchedText = `[Matched Asset Index: AI Advisory Board]\n• ${notebookKnowledgeBase["ai-advisory-board"].insights[0]}\n\n• ${notebookKnowledgeBase["ai-advisory-board"].insights[3]}`;
    } else if (inputLower.includes("atp") || inputLower.includes("vdd") || inputLower.includes("lxc") || inputLower.includes("glossary") || inputLower.includes("inline") || inputLower.includes("acronym")) {
        matchedText = `[Matched Asset Index: Glossary]\n• ${notebookKnowledgeBase["glossary"].insights[0]}\n\n• ${notebookKnowledgeBase["glossary"].insights[1]}`;
    }

    return matchedText;
}

/**
 * Helper function to secure input boundaries from script injection
 */
function escapeHtml(str) {
    return str.replace(/&/g, "&amp;")
              .replace(/</g, "&lt;")
              .replace(/>/g, "&gt;")
              .replace(/"/g, "&quot;")
              .replace(/'/g, "&#039;");
}
