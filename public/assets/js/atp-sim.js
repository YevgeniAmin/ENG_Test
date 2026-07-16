/**
 * ATP/ATR Automated Pipeline Simulator
 * Orchestrates document automation workflows and mocks distributed node telemetry.
 */

const mockAIData = {
    "doc-project-name": "Project Artemis - Comm Module",
    "doc-uut": "UHF Transceiver Unit",
    "dc-num": "DOC-2026-0042",
    "dc-rev": "02",
    "dc-date": "02/06/2026",
    "dc-prep": "AI Test Agent (Auto-Gen)",
    "dc-revby": "David Cohen, QA",
    "dc-appby": "Sarah Levi, R&D Manager",
    "scope-family": "Artemis Comm",
    "scope-pn": "ART-TRX-800",
    "scope-stage": "Serial Production",
    "uut-name": "UHF Transceiver Unit",
    "uut-pn": "ART-TRX-800",
    "uut-rev": "C1",
    "uut-sn": "SN-2026-90014",
    "uut-hw": "V1.4",
    "uut-sw": "FW-2.0.1b",
    "uut-config": "Standard Military Spec",
    "res-vis-1": "All parts present",
    "pf-vis-1": "PASS",
    "ev-vis-1": "img_vis_001.jpg",
    "res-vis-2": "Connectors OK, LED Green",
    "pf-vis-2": "PASS",
    "ev-vis-2": "img_vis_002.jpg",
    "res-pow-1": "23.95 V",
    "pf-pow-1": "PASS",
    "ev-pow-1": "log_pow_v.txt",
    "res-pow-2": "1.82 A",
    "pf-pow-2": "PASS",
    "ev-pow-2": "log_pow_i.txt",
    "res-eth-1": "1000Mbps Full Duplex",
    "pf-eth-1": "PASS",
    "ev-eth-1": "pcap_link.log",
    "res-eth-2": "Sent: 100, Recv: 100",
    "pf-eth-2": "PASS",
    "ev-eth-2": "ping_res.log",
    "final-status": "ACCEPTED",
    "final-comments": "All automated tests passed successfully. Ready for packaging.",
    "sig-name-1": "AI Agent / Auto Test Rig",
    "sig-sign-1": "Verified by Automation Script",
    "sig-date-1": "02/06/2026 10:45:00",
    "sig-name-2": "David Cohen",
    "sig-sign-2": "D. Cohen",
    "sig-date-2": "02/06/2026 11:30:00"
};

const sleep = ms => new Promise(r => setTimeout(r, ms));

/**
 * Iterates through the verification matrix, feeding structured telemetry to form controls
 */
async function startAISimulation() {
    const btn = document.getElementById('aiFillBtn');
    if (!btn) return;

    btn.disabled = true;
    btn.innerHTML = `
        <svg class="animate-spin h-4 w-4 text-slate-900 inline-block mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg> AI processing...`;

    const radioYes = document.getElementById('ctrl-yes');
    if (radioYes) radioYes.checked = true;

    for (const [id, value] of Object.entries(mockAIData)) {
        const el = document.getElementById(id);
        if (el) {
            el.value = value;
            el.classList.add('ai-filled');
            
            if (id === 'final-status' && value === 'ACCEPTED') {
                el.classList.add('text-emerald-400', 'bg-emerald-950/30');
            }
            if (id.startsWith('pf-')) {
                el.classList.add(value === 'PASS' ? 'text-emerald-400' : 'text-rose-400');
            }

            // Adaptive processing interval simulation
            await sleep(Math.random() * 80 + 30); 
        }
    }

    setTimeout(() => {
        document.querySelectorAll('.ai-filled').forEach(el => {
            el.classList.remove('ai-filled');
        });
    }, 1500);

    btn.innerHTML = '<i data-lucide="check-circle-2" class="w-4 h-4 inline-block mr-2"></i> סוים בהצלחה!';
    btn.classList.replace('bg-sky-500', 'bg-emerald-500');
    btn.classList.replace('hover:bg-sky-400', 'hover:bg-emerald-400');
    btn.classList.replace('text-slate-900', 'text-white');
    
    setTimeout(() => {
        btn.disabled = false;
        btn.innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="inline mr-2"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/></svg>
            הפעל סימולציית AI מחדש`;
        btn.classList.replace('bg-emerald-500', 'bg-sky-500');
        btn.classList.replace('hover:bg-emerald-400', 'hover:bg-sky-400');
        btn.classList.replace('text-white', 'text-slate-900');
        if (window.lucide) lucide.createIcons();
    }, 3000);
}

/**
 * Flushes all values from data nodes across the active document lifecycle
 */
function clearForm() {
    document.querySelectorAll('input[type="text"], textarea, select').forEach(el => {
        el.value = '';
        el.className = el.className.replace(/ai-filled|text-emerald-400|text-rose-400|bg-emerald-950\/30/g, '').trim();
    });
    const radioYes = document.getElementById('ctrl-yes');
    const radioNo = document.getElementById('ctrl-no');
    if (radioYes) radioYes.checked = false;
    if (radioNo) radioNo.checked = false;
}

// Global Lifecycle Bindings
document.addEventListener('DOMContentLoaded', () => {
    const aiBtn = document.getElementById('aiFillBtn');
    const clearBtn = document.getElementById('clearBtn');
    const printBtn = document.getElementById('printBtn');

    if (aiBtn) aiBtn.addEventListener('click', startAISimulation);
    if (clearBtn) clearBtn.addEventListener('click', clearForm);
    if (printBtn) printBtn.addEventListener('click', () => window.print());
});