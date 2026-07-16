/**
 * PowerShell Enterprise Simulator Logic
 * Architecture: Vanilla JS, Component-Based Data Handling.
 * Language: Professional Engineering English
 */

// ==========================================================================
// Data Structures (Simulated Cmdlets Database)
// ==========================================================================
const cmdletsData = [
    {
        id: "cmd-mem-01",
        title: "Hardware Memory Test",
        category: "Hardware & Memory",
        cmdlet: "Get-WmiObject Win32_PhysicalMemory | Measure-Object -Property Capacity -Sum",
        description: "Calculates total physical memory installed on the endpoint and verifies module integrity.",
        output: [
            "Count    : 2",
            "Average  : ",
            "Sum      : 34359738368",
            "Maximum  : ",
            "Minimum  : ",
            "Property : Capacity",
            "",
            "Status   : OK. Total RAM: 32.00 GB (3200MHz)"
        ]
    },
    {
        id: "cmd-sys-02",
        title: "System Hardware Info (SysInfo)",
        category: "Hardware & Memory",
        cmdlet: "Get-CimInstance Win32_ComputerSystem | Select-Object Manufacturer, Model",
        description: "Retrieves endpoint manufacturer and model parameters for inventory auditing.",
        output: [
            "Manufacturer       Model",
            "------------       -----",
            "Dell Inc.          Latitude 7420",
            "SystemType         x64-based PC"
        ]
    },
    {
        id: "cmd-net-03",
        title: "AI Server Connectivity Test",
        category: "Network & Connectivity",
        cmdlet: 'Test-NetConnection -ComputerName "api.secret-nexus.local" -Port 443',
        description: "Executes a detailed ping and port check against internal AI API infrastructure.",
        output: [
            "ComputerName     : api.secret-nexus.local",
            "RemoteAddress    : 10.50.2.14",
            "RemotePort       : 443",
            "InterfaceAlias   : Ethernet0",
            "SourceAddress    : 10.50.2.100",
            "TcpTestSucceeded : True",
            "PingReplyDetails : 12ms"
        ]
    },
    {
        id: "cmd-disk-04",
        title: "Physical Disk Health Check",
        category: "Hardware & Memory",
        cmdlet: "Get-PhysicalDisk | Select-Object DeviceId, MediaType, HealthStatus",
        description: "Scans physical drive telemetry to detect early S.M.A.R.T. failures.",
        output: [
            "DeviceId MediaType HealthStatus OperationalStatus",
            "-------- --------- ------------ -----------------",
            "0        NVMe      Healthy      OK",
            "1        SSD       Healthy      OK"
        ]
    },
    {
        id: "cmd-ai-05",
        title: "AI Model Diagnostics & QA",
        category: "AI & Automation Pipeline",
        cmdlet: "Invoke-AiModelTest -Endpoint 'http://10.50.2.14:11434' -Model 'llama3.1:8b' -TestType 'Latency'",
        description: "Executes a deep diagnostic health check on local Ollama models, verifying token generation speed and context window integrity.",
        output: [
            "Initiating handshake with AI Node 10.50.2.14...",
            "Validating API Bearer Tokens... [OK]",
            "Model Loaded: llama3.1:8b (VRAM allocation: 4.8GB)",
            "--------------------------------------------------",
            "Prompt Eval Time       : 124ms",
            "Token Generation Speed : 62.4 tokens/sec",
            "Context Window State   : Healthy (8192 ctx)",
            "Temperature Setting    : 0.7 (R&D Mode)",
            "--------------------------------------------------",
            "Status: PASSED. Local GPU (RTX 5060 Ti) operating nominally."
        ]
    },
    {
        id: "cmd-proxmox-06",
        title: "Proxmox LXC Update & AI Restart",
        category: "Server Infrastructure",
        cmdlet: "Update-ProxmoxContainer -VMID 102 -RestartService 'ollama', 'open-webui'",
        description: "Applies pending system updates to the target LXC container on the Proxmox host and orchestrates a graceful restart of AI services.",
        output: [
            "Connecting to Proxmox VE (SRV-1) API via Secret Nexus...",
            "Targeting CT 102 (Ubuntu 24.04 - AI Core)...",
            "Running 'apt-get update && apt-get upgrade -y'...",
            "[OK] 14 packages upgraded. No reboot required.",
            "Flushing old context cache...",
            "Restarting systemd service: ollama.service... [OK]",
            "Restarting docker container: open-webui... [OK]",
            "Checking listening ports (11434, 3000)... [ACTIVE]",
            "Status: SUCCESS. All AI environments are updated and online."
        ]
    }
];

// ==========================================================================
// State Management
// ==========================================================================
let state = {
    selectedCmdletId: null,
    isExecuting: false,
    terminalOpen: false
};

// ==========================================================================
// DOM Initialization & Render Functions
// ==========================================================================
document.addEventListener("DOMContentLoaded", () => {
    lucide.createIcons();
    renderCmdletCards();
    document.getElementById('kpi-cmdlets-count').innerText = cmdletsData.length;
    attachEventListeners();
    updateTerminalToggleButton();
    updateTerminalVisibility();
});

/**
 * Renders the Component Cards dynamically into the DOM.
 */
function renderCmdletCards() {
    const listContainer = document.getElementById('cmdlet-list');
    listContainer.innerHTML = ''; 

    cmdletsData.forEach(cmd => {
        const isSelected = state.selectedCmdletId === cmd.id;
        
        const card = document.createElement('div');
        card.className = `card ${isSelected ? 'selected' : ''}`;
        card.onclick = () => selectCmdlet(cmd.id);

        card.innerHTML = `
            <div class="card-header">
                <span class="card-title">${cmd.title}</span>
                <span class="badge badge-outline">${cmd.category}</span>
            </div>
            <p class="card-desc">${cmd.description}</p>
            <div style="background: var(--md-sys-color-surface-variant); padding: 8px; border-radius: 4px; font-family: monospace; font-size: 0.75rem; overflow-x: auto; white-space: nowrap;">
                ${cmd.cmdlet}
            </div>
        `;

        listContainer.appendChild(card);
    });
}

/**
 * Handles User Selection of a Cmdlet
 */
function selectCmdlet(id) {
    if (state.isExecuting) return; 
    
    state.selectedCmdletId = id;
    renderCmdletCards(); 
    updateStepper(2); 
    updateTerminalToggleButton();

    const selected = cmdletsData.find(c => c.id === id);
    appendLog(`Command selected and staged for execution. Awaiting confirmation...`, 'text-muted');
    appendLog(`PS> ${selected.cmdlet}`, 'log-cmd');
}

// ==========================================================================
// Terminal & Execution Logic
// ==========================================================================
function attachEventListeners() {
    document.getElementById('btn-open-terminal').addEventListener('click', () => {
        if (state.selectedCmdletId) {
            toggleTerminal(true);
        }
    });
    document.getElementById('btn-execute').addEventListener('click', executeSimulation);
    document.getElementById('btn-clear').addEventListener('click', clearTerminal);
}

function executeSimulation() {
    if (!state.selectedCmdletId || state.isExecuting) return;
    toggleTerminal(true);

    const selectedCmd = cmdletsData.find(c => c.id === state.selectedCmdletId);
    state.isExecuting = true;

    // UI Updates
    const btn = document.getElementById('btn-execute');
    btn.disabled = true;
    btn.innerHTML = `<i data-lucide="loader-2" class="lucide-spin"></i> Processing...`;
    lucide.createIcons();
    
    updateStepper(3);
    document.getElementById('terminal-status').innerText = "EXECUTING";
    document.getElementById('terminal-status').style.color = "var(--md-sys-color-error)";

    // Append standard initiation text
    appendLog(`Connecting to target node [SRV-1] via secure port...`, 'text-muted');

    // Simulate Network Latency Pipeline (Async Simulation)
    setTimeout(() => {
        appendLog(`[OK] WinRM connection secured. Initiating command execution...`, 'log-success');
    }, 800);

    setTimeout(() => {
        // Output the result
        selectedCmd.output.forEach(line => {
            appendLog(line);
        });
        
        // Finalize
        appendLog(`[OK] Execution completed successfully.`, 'log-success');
        appendLog(`PS C:\\ENG-Portal\\Nexus> _`, 'text-muted');
        
        // Reset UI State
        state.isExecuting = false;
        btn.disabled = false;
        btn.innerHTML = `<i data-lucide="play"></i> Execute Command`;
        lucide.createIcons();
        document.getElementById('terminal-status').innerText = "READY";
        document.getElementById('terminal-status').style.color = "inherit";
        updateStepper(4);
        updateTerminalToggleButton();
    }, 2500);
}

function appendLog(text, cssClass = '') {
    const screen = document.getElementById('terminal-screen');
    const line = document.createElement('div');
    line.className = `log-line ${cssClass}`;
    line.innerHTML = text.replace(/ /g, '&nbsp;'); 
    screen.appendChild(line);
    
    // Auto-scroll to bottom
    screen.scrollTop = screen.scrollHeight;
}

/**
 * Clears Terminal Screen
 */
function clearTerminal() {
    if (state.isExecuting) return;
    const screen = document.getElementById('terminal-screen');
    screen.innerHTML = `
        <div class="log-line text-muted">Windows PowerShell Simulator (C) Enterprise Core.</div>
        <div class="log-line text-muted">PS C:\\ENG-Portal\\Nexus> _</div>
    `;
    updateStepper(1);
    state.selectedCmdletId = null;
    renderCmdletCards();
    toggleTerminal(false);
    updateTerminalToggleButton();
}

function toggleTerminal(open) {
    state.terminalOpen = open;
    const terminal = document.querySelector('.terminal-container');
    if (!terminal) return;
    terminal.classList.toggle('active', open);
    terminal.classList.toggle('hidden', !open);
}

function updateTerminalVisibility() {
    const terminal = document.querySelector('.terminal-container');
    if (!terminal) return;
    terminal.classList.toggle('active', state.terminalOpen);
    terminal.classList.toggle('hidden', !state.terminalOpen);
}

function updateTerminalToggleButton() {
    const openBtn = document.getElementById('btn-open-terminal');
    if (!openBtn) return;
    openBtn.disabled = !state.selectedCmdletId || state.isExecuting;
    openBtn.innerHTML = state.terminalOpen ? `<i data-lucide="terminal"></i> Show Terminal` : `<i data-lucide="terminal"></i> Open Terminal`;
    lucide.createIcons();
}

/**
 * Updates the Visual Workflow Stepper Component
 */
function updateStepper(activeStepNumber) {
    const progressBar = document.getElementById('execution-progress');
    if (progressBar) {
        const percentage = ((activeStepNumber - 1) / 3) * 100;
        progressBar.style.width = `${percentage}%`;
    }

    const labels = document.querySelectorAll('.progress-label');
    labels.forEach(label => {
        const step = Number(label.dataset.step);
        label.classList.toggle('completed', step < activeStepNumber);
        label.classList.toggle('active', step === activeStepNumber);
    });
}