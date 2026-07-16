/**
 * ENG-Portal - NotebookLM Simulation Engine
 * Architecture: Component-Based Vanilla JS (Zero Frameworks)
 * Telemetry Tier: Staged Data Extraction from Curated Project Context
 * Safety Protocol: Secure Context Protection & Client-Side Output Sanitization
 */

// ==========================================================================
// Curated Context Database (Extracted from Project Historical Context)
// ==========================================================================
const notebookKnowledgeBase = {
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

// ==========================================================================
// Component Initialization & Event Mapping
// ==========================================================================
document.addEventListener("DOMContentLoaded", () => {
    initNotebookSimulator();
});

function initNotebookSimulator() {
    const selector = document.getElementById("templateSelector");
    const sendBtn = document.getElementById("sendPromptBtn");
    const inputField = document.getElementById("aiPromptInput");

    if (!selector || !sendBtn || !inputField) {
        console.warn("[NotebookLM Sim] Required DOM nodes not found. Staging fallback event attachment loops.");
        return;
    }

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
// Core Streaming & Chunk Rendering Engines
// ==========================================================================
let typingTimeout = null;

function loadSelectedTemplate(key) {
    const data = notebookKnowledgeBase[key];
    if (!data) return;

    // Clear any active typewriter loops to prevent async overlaps
    if (typingTimeout) clearTimeout(typingTimeout);

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
 * Handle custom user prompt queries safely (Sanitized Sandbox Execution)
 */
function handleUserPrompt(rawInput) {
    // 1. Strict Input Sanitization Protocol
    const sanitizedInput = rawInput.replace(/<[^>]*>/g, "").trim();
    if (!sanitizedInput) return;

    const insightsList = document.querySelector(".insights-list");
    if (!insightsList) return;

    // 2. Clear old lines and render staging indicators
    insightsList.innerHTML = "";
    
    const statusFeedback = document.createElement("div");
    statusFeedback.className = "text-muted";
    statusFeedback.style.fontSize = "0.8rem";
    statusFeedback.style.fontStyle = "italic";
    statusFeedback.innerHTML = `Searching compiled index for: "<strong>${escapeHtml(sanitizedInput)}</strong>"...`;
    insightsList.appendChild(statusFeedback);

    // 3. Process dynamic text mapping response after brief processing latency
    setTimeout(() => {
        statusFeedback.remove();
        
        const responseBlock = document.createElement("div");
        responseBlock.style.fontSize = "0.85rem";
        responseBlock.style.lineHeight = "1.5";
        
        // Dynamic search check against active template entries
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

        responseBlock.style.whiteSpace = "pre-wrap";
        responseBlock.textContent = matchedText;
        insightsList.appendChild(responseBlock);
    }, 600);
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