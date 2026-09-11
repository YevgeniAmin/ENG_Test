/**
 * ENG-Portal - Core Memory Suite Application Logic
 * Architecture: Clean Vanilla JS Lifecycle Management Engine
 * Optimization Model: Client-Side Structural Hydration Loops
 */

// ==========================================================================
// 1. Memory Assets Database (Staged Hardware/Security History)
// ==========================================================================
const INITIAL_MEMORIES = [
    {
        id: "MEM-001",
        timestamp: "2026-06-11 11:24",
        title: "Hardware GPU Passthrough Deployment",
        category: "Hardware",
        description: "Mapped specialized RTX 5060 Ti resources directly into isolated Proxmox containers to manage high-context local execution loops.",
        author: "Yevgeni"
    },
    {
        id: "MEM-002",
        timestamp: "2026-06-10 16:40",
        title: "Cloudflare Semantic Firewall Constraints",
        category: "Security",
        description: "Deployed structural rules blocking open port scans and automated routing traces on local endpoints.",
        author: "Fairy Nexus"
    },
    {
        id: "MEM-003",
        timestamp: "2026-06-08 09:12",
        title: "Lossless Audio Sweep Array Core",
        category: "Audio Lab",
        description: "Compiled pure 24-bit/96kHz WAV generation blocks to conduct hardware parameter stress analysis on iOS client layers.",
        author: "Max (QA Node)"
    }
];

// State Telemetry Matrix
let state = {
    memories: [...INITIAL_MEMORIES],
    isSimulating: false,
    vibration: 0,
    oscilloscopeTime: 0
};

// ==========================================================================
// 2. DOM Hydration & Initialization Engine
// ==========================================================================
document.addEventListener("DOMContentLoaded", () => {
    // Inject and hydrate ledger cards
    hydrateMemoryLedger();
    
    // Bind telemetry pipeline action loops
    const simBtn = document.getElementById("btn-simulate-telemetry");
    if (simBtn) {
        simBtn.addEventListener("click", triggerTelemetrySimulation);
    }
    
    // Initiate continuous real-time diagnostic signal wave loop
    animateOscilloscopeWave();
    
    // Enforce localized active class on setup language buttons
    syncLanguageButtonUI();
});

function hydrateMemoryLedger() {
    const container = document.getElementById("memory-ledger-container");
    if (!container) return;
    container.innerHTML = "";

    state.memories.forEach(mem => {
        const card = document.createElement("div");
        card.className = "ledger-card";
        card.innerHTML = `
            <div class="ledger-header">
                <span class="ledger-title">${mem.title}</span>
                <span class="badge badge-surface">${mem.category}</span>
            </div>
            <p class="narrative-text" style="font-size: 0.85rem; margin-top: 8px; margin-bottom: 8px;">${mem.description}</p>
            <div class="ledger-meta">
                <span>Node Trace: ${mem.id} // Operator: ${mem.author}</span>
                <span style="float: right;">${mem.timestamp}</span>
            </div>
        `;
        container.appendChild(card);
    });
}

// ==========================================================================
// 3. Oscilloscope Signal Wave Animation Engine
// ==========================================================================
function animateOscilloscopeWave() {
    state.oscilloscopeTime += 0.05;
    const pathEl = document.getElementById("oscilloscope-path");
    
    if (pathEl) {
        const points = [];
        // Base frequency parameters controlled by state metrics
        const frequency = 0.1;
        const amplitude = state.isSimulating ? 22 : 6;
        
        for (let x = 0; x <= 200; x += 2) {
            const y = 50 + Math.sin(x * frequency + state.oscilloscopeTime) * amplitude 
                         + (state.isSimulating ? (Math.random() - 0.5) * 6 : 0);
            points.push(`${x === 0 ? 'M' : 'L'} ${x} ${y}`);
        }
        
        pathEl.setAttribute("d", points.join(" "));
    }
    
    requestAnimationFrame(animateOscilloscopeWave);
}

function triggerTelemetrySimulation() {
    if (state.isSimulating) return;
    
    state.isSimulating = true;
    const outputLog = document.getElementById("telemetry-log-output");
    if (outputLog) outputLog.innerHTML = "";
    
    appendTelemetryLog("Initializing ESS validation handshakes...");
    
    setTimeout(() => {
        appendTelemetryLog("[OK] Secure Bearer context established.");
    }, 600);

    setTimeout(() => {
        appendTelemetryLog("[OK] Token context mapping trace: PASSED.");
        // Inject clean success alert card asset using semantic components
        const successBlock = document.createElement("div");
        successBlock.className = "alert-box alert-success mt-24";
        successBlock.innerHTML = `<i data-lucide="shield-check"></i> <span>ESS Framework nominal. Lab node operational.</span>`;
        outputLog.appendChild(successBlock);
        if (typeof lucide !== 'undefined') lucide.createIcons();
        
        // Conclude simulation loop
        state.isSimulating = false;
    }, 1800);
}

function appendTelemetryLog(text) {
    const outputLog = document.getElementById("telemetry-log-output");
    if (!outputLog) return;
    
    const line = document.createElement("div");
    line.style.marginBottom = "2px";
    line.textContent = `> ${text}`;
    outputLog.appendChild(line);
    outputLog.scrollTop = outputLog.scrollHeight;
}

function syncLanguageButtonUI() {
    const activeLang = localStorage.getItem("lang") || "he";
    const btnEn = document.getElementById("lang-en");
    const btnHe = document.getElementById("lang-he");
    
    if (btnEn && btnHe) {
        btnEn.classList.remove("active");
        btnHe.classList.remove("active");
        if (activeLang === "he") btnHe.classList.add("active");
        else btnEn.classList.add("active");
    }
}