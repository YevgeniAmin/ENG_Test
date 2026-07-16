/**
 * ENG-Portal - NotebookLM Simulation Engine
 * Architecture: Component-Based Vanilla JS (Zero Frameworks)
 * Telemetry Tier: Staged Data Extraction from Curated Project Context
 * Safety Protocol: Secure Context Protection & Client-Side Output Sanitization
 */

// ==========================================================================
// Curated Context Database (Extracted from Project Research Assets)
// ==========================================================================
const notebookKnowledgeBase = {
    "project-overview": {
        title: "ENG-Portal Framework & Architectural Overview",
        source: "Source: Project_Historical_Context.md",
        insights: [
            "System Architecture Shift: Successfully migrated from a cloud-dependent layout to an enterprise-grade Hybrid Edge-Cloud Routing paradigm.",
            "Local Infrastructure Layer: Implemented a physical Proxmox VE hypervisor host (srv-1) passing through a dedicated NVIDIA RTX 5060 Ti GPU into isolated Linux Containers (LXC).",
            "CORS & Security Solution: Engineered the Secret Nexus Proxy tier (server.js) to intercept local network payloads, safely bypassing browser cross-origin constraints without compromising token encryption keys.",
            "Resilience Strategy: Incorporated an 8-second AbortController timeout matrix that automatically shifts traffic from home edge endpoints back to Google Cloud APIs seamlessly if local hardware is offline."
        ]
    },
    "tech-dna": {
        title: "Tech DNA, Design System & Synchronization Codes",
        source: "Source: Project_Historical_Context.md",
        insights: [
            "UI Governance Rule: Enforced a pure HTML5 and Material Design 3 (M3) language suite across the framework. Completely stripped inline styling vectors.",
            "Design Tokens Strategy: Centralized all dynamic interface tokens (hex colors, modular spacing intervals, micro-elevation drops) safely inside standard CSS global pseudo-classes (:root).",
            "Global Asset Decoupling: Standardized layout code by pulling all rendering processes away from HTML blocks into external, logical layout spreadsheets.",
            "Central Telemetry Control: Deployed a unique version-sync.js telemetry tracker that unifies and auto-injects version strings (v2.4.0-Sim) globally into legal views and sub-panels."
        ]
    },
    "research-insights": {
        title: "Advanced Engineering R&D & Laboratory Pipelines",
        source: "Source: project_tracker.md",
        insights: [
            "Acoustic Verification Lab: Deployed a Web Audio API engine supporting Signal-to-Noise Ratio (SNR) sweeps, phase control manipulation, and raw uncompressed file formatting (24-bit/96kHz WAV/FLAC outputs).",
            "Multi-Agent AI Matrix: Established isolated, specialized behavioral roles across multiple LLM networks (Max for rigid QA audits, David for sprint tracking, Copilot for solution specs).",
            "Multimodal Vision Pipeline: Developed a secure Docker automated vision pipeline that transforms schematic asset images into Base64 data chunks for automated code extraction arrays.",
            "Field Telemetry Plans: Designing an agile industrial IoT registry to automate Acceptance Test Report (ATR) and Version Description Document (VDD) formatting loops."
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
        
        if (inputLower.includes("hardware") || inputLower.includes("gpu") || inputLower.includes("proxmox")) {
            matchedText = `[Matched Asset Index: Infrastructure]\n${notebookKnowledgeBase["project-overview"].insights[1]}\n\n${notebookKnowledgeBase["project-overview"].insights[3]}`;
        } else if (inputLower.includes("css") || inputLower.includes("design") || inputLower.includes("material")) {
            matchedText = `[Matched Asset Index: UI System]\n${notebookKnowledgeBase["tech-dna"].insights[0]}\n\n${notebookKnowledgeBase["tech-dna"].insights[1]}`;
        } else if (inputLower.includes("audio") || inputLower.includes("sound") || inputLower.includes("qa")) {
            matchedText = `[Matched Asset Index: Audio Lab]\n${notebookKnowledgeBase["research-insights"].insights[0]}\n\n${notebookKnowledgeBase["research-insights"].insights[1]}`;
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