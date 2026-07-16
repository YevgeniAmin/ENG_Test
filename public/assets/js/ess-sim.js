/**
 * ENG-Portal - Vibration Simulation Logic
 * Pure Vanilla JS, Decoupled Architecture.
 */

// ==========================================================================
// 1. Core Data Structures & Variables
// ==========================================================================
// Generate log-scaled frequency labels for PSD
const vibLabels = Array.from({length: 60}, (_, i) => {
    if (i < 15) return 20 + i * 4; 
    if (i < 40) return 80 + (i-15) * 10; 
    return 350 + (i-40) * 80; 
});

let vibData = Array(60).fill(0);
let vibChartInst = null;
let vibLogicInterval = null;
let vibGraphInterval = null;
let isTesting = false;

// ==========================================================================
// 2. Chart Initialization (Chart.js)
// ==========================================================================
function initVibrationChart() {
    Chart.defaults.color = 'rgba(148, 163, 184, 0.5)'; // Muted Slate
    Chart.defaults.font.family = "'Consolas', 'Courier New', monospace";

    const vibCtx = document.getElementById('vibChart').getContext('2d');
    
    // Cyber Gradient
    let vibGradient = vibCtx.createLinearGradient(0, 0, 0, 250);
    vibGradient.addColorStop(0, '#38bdf8'); // Sky 400
    vibGradient.addColorStop(1, '#818cf8'); // Indigo 400

    vibChartInst = new Chart(vibCtx, {
        type: 'bar',
        data: {
            labels: vibLabels.map(v => Math.round(v) + 'Hz'),
            datasets: [{
                data: vibData,
                backgroundColor: vibGradient,
                borderRadius: 2,
                barPercentage: 0.85,
                categoryPercentage: 1.0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            animation: false, // Critical for high-speed telemetry feel
            plugins: { legend: { display: false } },
            scales: {
                x: { 
                    grid: { display: false }, 
                    ticks: { maxTicksLimit: 8, font: { size: 10 } } 
                },
                y: { 
                    min: 0, 
                    max: 0.035,
                    grid: { color: 'rgba(51, 65, 85, 0.5)' }, // Slate 700
                    ticks: { font: { size: 10 } }
                }
            }
        }
    });
}

// ==========================================================================
// 3. Mathematical Simulation Engines
// ==========================================================================
function generateRMS() {
    const target = 6.0;
    const noise = (Math.random() * 0.30 - 0.15); // ±0.15g variance
    return target + noise;
}

function generatePSDProfile() {
    return vibLabels.map(f => {
        let basePsd = 0.001; 
        
        // MIL-STD-810 shape approximation
        if (f >= 20 && f < 80) {
            basePsd = 0.0025 + (0.012 - 0.0025) * ((f - 20) / (80 - 20));
        } else if (f >= 80 && f < 350) {
            basePsd = 0.012 + (0.022 - 0.012) * ((f - 80) / (350 - 80));
        } else if (f >= 350 && f <= 1000) {
            basePsd = 0.022;
        } else if (f > 1000) {
            basePsd = 0.022 - (0.022 - 0.005) * ((f - 1000) / 1000); 
        }
        
        // Inject sensor noise
        const noise = (Math.random() * 0.004 - 0.002);
        return Math.max(basePsd + noise, 0.0005);
    });
}

// ==========================================================================
// 4. UI Update Pipelines
// ==========================================================================
function simulateVibrationTextUpdates() {
    const rms = generateRMS();
    const measuredEl = document.getElementById('vibMeasured');
    measuredEl.textContent = rms.toFixed(2) + 'g';

    const diff = Math.abs(rms - 6.0);
    const statusEl = document.getElementById('vibStatus');
    
    // Reset Classes
    statusEl.className = 'badge';

    // Tolerances Evaluation
    if (diff < 0.15) {
        statusEl.textContent = 'SYSTEM OK';
        statusEl.classList.add('status-ok');
    } else if (diff < 0.40) {
        statusEl.textContent = 'NEAR LIMIT';
        statusEl.classList.add('status-warn');
    } else {
        statusEl.textContent = 'OUT OF SPEC';
        statusEl.classList.add('status-err');
    }

    // Tick Clock
    document.getElementById('vibTimestamp').textContent = new Date().toLocaleTimeString('en-US', { hour12: false });
}

function updateLiveVibrationGraph() {
    vibChartInst.data.datasets[0].data = generatePSDProfile();
    vibChartInst.update();
}

// ==========================================================================
// 5. Execution Controllers
// ==========================================================================
function startVibrationSimulation() {
    if (isTesting) return;
    
    if (!vibChartInst) initVibrationChart(); 
    isTesting = true;

    // UI Toggles
    document.getElementById('btn-start').disabled = true;
    document.getElementById('btn-stop').disabled = false;
    document.getElementById('vibMeasured').classList.remove('idle');
    
    // Ignition
    vibLogicInterval = setInterval(simulateVibrationTextUpdates, 1200);
    vibGraphInterval = setInterval(updateLiveVibrationGraph, 100); // High-frequency polling
    simulateVibrationTextUpdates(); 
}

function stopVibrationSimulation() {
    if (!isTesting) return;
    
    clearInterval(vibLogicInterval);
    clearInterval(vibGraphInterval);
    isTesting = false;

    // UI Toggles
    document.getElementById('btn-start').disabled = false;
    document.getElementById('btn-stop').disabled = true;
    
    // System Reset
    if (vibChartInst) {
        vibChartInst.data.datasets[0].data = Array(60).fill(0);
        vibChartInst.update();
    }
    
    const vibStatEnd = document.getElementById('vibStatus');
    vibStatEnd.textContent = "IDLE";
    vibStatEnd.className = "badge status-idle";
    
    const measuredEl = document.getElementById('vibMeasured');
    measuredEl.textContent = "0.00g";
    measuredEl.classList.add('idle');
}

// Auto-init Empty Chart on Load
document.addEventListener("DOMContentLoaded", () => {
    initVibrationChart();
});
