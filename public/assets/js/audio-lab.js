// Portal controller for the Audio Lab page: DOM wiring, canvas rendering, accessibility, and
// privacy UX. All actual audio behavior lives in audio-lab-engine.js.
import {
  createAudioLabEngine,
  AudioLabEngineError,
  AlarmLog,
  findBandPeak,
  isThresholdExceeded,
  validateThresholdBand,
  frequencyToBinIndex,
  validateAudioFile,
  ANALYSER_FFT_SIZE,
  NOMINAL_MIN_FREQUENCY_HZ,
  NOMINAL_MAX_FREQUENCY_HZ,
} from './audio-lab-engine.js';

const RTA_GRID_COLOR = '#1e293b';
const RTA_LINE_COLOR = '#38bdf8';
const RTA_THRESHOLD_COLOR = '#ef4444';
const WATERFALL_SCROLL_SPEED_PX = 2;
const FREQUENCY_WAVEFORMS = new Set(['sine', 'square', 'triangle', 'sawtooth']);

const PALETTES = {
  inferno: (v) => ({ r: Math.min(255, v * 1.6), g: Math.max(0, (v - 90) * 2), b: Math.max(0, (v - 170) * 3) }),
  thermal: (v) => ({ r: Math.min(255, v * 2), g: Math.min(255, v * 1.2), b: Math.max(0, 255 - v * 2) }),
  viridis: (v) => ({ r: Math.max(0, (v - 128) * 2), g: Math.min(255, v * 1.5), b: Math.min(255, 255 - v) }),
  cyber: (v) => ({ r: Math.max(0, (v - 150) * 2), g: Math.min(255, v * 1.8), b: Math.min(255, v * 2) }),
  monochrome: (v) => ({ r: v, g: v, b: v }),
};

function el(id) {
  return document.getElementById(id);
}

function setTextIfChanged(node, text) {
  if (node.textContent !== text) node.textContent = text;
}

function showError(node, message) {
  node.textContent = message;
  node.hidden = false;
}

function clearError(node) {
  node.textContent = '';
  node.hidden = true;
}

function describeError(err) {
  if (err instanceof AudioLabEngineError) return err.message;
  return 'An unexpected error occurred.';
}

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.className = 'sr-only';
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

function setupCanvasBackingStore(canvas, onResize) {
  const resize = () => {
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    const width = Math.max(1, Math.round(rect.width * dpr));
    const height = Math.max(1, Math.round(rect.height * dpr));
    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width;
      canvas.height = height;
      onResize?.();
    }
  };
  resize();
  const observer = new ResizeObserver(resize);
  observer.observe(canvas);
  return observer;
}

function init() {
  const engine = createAudioLabEngine();
  const alarmLog = new AlarmLog();

  const generatorSettings = {
    waveform: 'sine',
    frequency: 1000,
    gainDb: -12,
    phaseInverted: false,
    channel: 'both',
    muted: false,
    sweepType: 'logarithmic',
    sweepStartFreq: 20,
    sweepEndFreq: 20000,
    sweepDuration: 10,
  };

  let lastConfirmedSourceType = 'generator';
  let thresholdEnabled = true;
  let thresholdConfigValid = true;
  let currentThresholdConfig = { minFrequencyHz: 20, maxFrequencyHz: 20000, thresholdDb: -12 };
  let warningAudioEnabled = false;
  let currentPalette = 'inferno';

  // DOM references
  const engineActivateBtn = el('engine-activate-btn');
  const engineStatusText = el('engine-status-text');

  const sourceRadios = Array.from(document.querySelectorAll('input[name="audio-source"]'));
  const microphonePanel = el('microphone-panel');
  const microphoneStartBtn = el('microphone-start-btn');
  const microphoneStopBtn = el('microphone-stop-btn');
  const microphoneActiveIndicator = el('microphone-active-indicator');
  const filePanel = el('file-panel');
  const fileInput = el('file-input');
  const filePlayBtn = el('file-play-btn');
  const fileStopBtn = el('file-stop-btn');
  const sourceErrorEl = el('source-error');

  const waveformSelect = el('waveform-select');
  const frequencyControl = el('frequency-control');
  const frequencyInput = el('frequency-input');
  const frequencyRange = el('frequency-range');
  const gainRange = el('gain-range');
  const gainValueOutput = el('gain-value');
  const channelRadios = Array.from(document.querySelectorAll('input[name="channel"]'));
  const phaseToggleBtn = el('phase-toggle-btn');
  const muteToggleBtn = el('mute-toggle-btn');
  const sweepFieldset = el('sweep-fieldset');
  const sweepTypeSelect = el('sweep-type-select');
  const sweepStartInput = el('sweep-start-input');
  const sweepEndInput = el('sweep-end-input');
  const sweepDurationInput = el('sweep-duration-input');
  const signalStartBtn = el('signal-start-btn');
  const signalStopBtn = el('signal-stop-btn');

  const exportDurationSelect = el('export-duration-select');
  const exportBtn = el('export-btn');
  const exportStatusEl = el('export-status');
  const exportErrorEl = el('export-error');

  const paletteSelect = el('palette-select');
  const rtaCanvas = el('rta-canvas');
  const waterfallCanvas = el('waterfall-canvas');
  const inspectFrequencyInput = el('inspect-frequency-input');
  const inspectFrequencyReadout = el('inspect-frequency-readout');
  const livePeakReadoutEl = el('live-peak-readout');

  const thresholdEnabledCheckbox = el('threshold-enabled-checkbox');
  const thresholdMinFreqInput = el('threshold-min-freq-input');
  const thresholdMaxFreqInput = el('threshold-max-freq-input');
  const thresholdDbRange = el('threshold-db-range');
  const thresholdDbValueOutput = el('threshold-db-value');
  const warningAudioCheckbox = el('warning-audio-checkbox');
  const thresholdStatusEl = el('threshold-status');
  const thresholdConfigErrorEl = el('threshold-config-error');

  const clearAlarmLogBtn = el('clear-alarm-log-btn');
  const alarmLogTbody = el('alarm-log-tbody');

  const rtaCtx = rtaCanvas.getContext('2d');
  const waterfallCtx = waterfallCanvas.getContext('2d', { alpha: false });
  let waterfallLineImageData = null;

  function syncOutputControls() {
    engine.setOutputControls({
      gainDb: generatorSettings.gainDb,
      muted: generatorSettings.muted,
      channel: generatorSettings.channel,
      phaseInverted: generatorSettings.phaseInverted,
    });
  }

  function updateEngineStatusText() {
    const state = engine.getState();
    if (state.contextState === 'running') {
      setTextIfChanged(engineStatusText, `Engine: active (${Math.round(engine.getSampleRate() / 1000)} kHz)`);
    } else if (state.contextState === 'suspended') {
      setTextIfChanged(engineStatusText, 'Engine: suspended');
    } else {
      setTextIfChanged(engineStatusText, 'Engine: inactive');
    }
  }

  async function activateEngine() {
    await engine.activate();
    updateEngineStatusText();
    startRenderLoop();
  }

  engineActivateBtn.addEventListener('click', () => {
    activateEngine().catch(() => updateEngineStatusText());
  });

  // --- Source selection -----------------------------------------------------

  function resetMicrophoneUi() {
    microphoneStartBtn.hidden = false;
    microphoneStopBtn.hidden = true;
    microphoneActiveIndicator.hidden = true;
  }

  function resetFileUi() {
    filePlayBtn.disabled = true;
    filePlayBtn.hidden = false;
    fileStopBtn.hidden = true;
    fileInput.value = '';
  }

  function revertSourceRadioSelection() {
    const radio = sourceRadios.find((r) => r.value === lastConfirmedSourceType);
    if (radio) radio.checked = true;
    microphonePanel.hidden = lastConfirmedSourceType !== 'microphone';
    filePanel.hidden = lastConfirmedSourceType !== 'file';
  }

  sourceRadios.forEach((radio) => {
    radio.addEventListener('change', async (event) => {
      clearError(sourceErrorEl);
      const value = event.target.value;
      microphonePanel.hidden = value !== 'microphone';
      filePanel.hidden = value !== 'file';

      if (value === 'generator') {
        resetMicrophoneUi();
        resetFileUi();
        try {
          await engine.switchSource('generator');
          lastConfirmedSourceType = 'generator';
          signalStartBtn.disabled = false;
          signalStopBtn.disabled = true;
        } catch (err) {
          showError(sourceErrorEl, describeError(err));
          revertSourceRadioSelection();
        }
      }
      // Microphone/file: selecting the radio only reveals the panel. Permission is requested
      // (or the file is decoded) only on the explicit Start/Play action below.
    });
  });

  microphoneStartBtn.addEventListener('click', async () => {
    clearError(sourceErrorEl);
    microphoneStartBtn.disabled = true;
    try {
      await activateEngine();
      await engine.switchSource('microphone');
      lastConfirmedSourceType = 'microphone';
      microphoneStartBtn.hidden = true;
      microphoneStopBtn.hidden = false;
      microphoneActiveIndicator.hidden = false;
    } catch (err) {
      showError(sourceErrorEl, describeError(err));
      revertSourceRadioSelection();
    } finally {
      microphoneStartBtn.disabled = false;
    }
  });

  microphoneStopBtn.addEventListener('click', async () => {
    clearError(sourceErrorEl);
    await engine.stopMicrophone();
    lastConfirmedSourceType = 'generator';
    resetMicrophoneUi();
    const generatorRadio = sourceRadios.find((r) => r.value === 'generator');
    if (generatorRadio) generatorRadio.checked = true;
    microphonePanel.hidden = true;
  });

  fileInput.addEventListener('change', async () => {
    clearError(sourceErrorEl);
    const file = fileInput.files && fileInput.files[0];
    if (!file) return;

    const validation = validateAudioFile(file);
    if (!validation.valid) {
      showError(sourceErrorEl, validation.reason);
      revertSourceRadioSelection();
      return;
    }

    try {
      await activateEngine();
      await engine.switchSource('file', { file });
      lastConfirmedSourceType = 'file';
      filePlayBtn.disabled = false;
    } catch (err) {
      showError(sourceErrorEl, describeError(err));
      revertSourceRadioSelection();
    }
  });

  filePlayBtn.addEventListener('click', () => {
    try {
      engine.playFile();
      filePlayBtn.hidden = true;
      fileStopBtn.hidden = false;
    } catch (err) {
      showError(sourceErrorEl, describeError(err));
    }
  });

  fileStopBtn.addEventListener('click', () => {
    engine.stopFile();
    filePlayBtn.hidden = false;
    fileStopBtn.hidden = true;
  });

  // --- Generator controls -----------------------------------------------------

  function updateFrequencyControlVisibility() {
    frequencyControl.hidden = generatorSettings.waveform === 'sweep' || !FREQUENCY_WAVEFORMS.has(generatorSettings.waveform);
    sweepFieldset.hidden = generatorSettings.waveform !== 'sweep';
  }

  waveformSelect.addEventListener('change', () => {
    generatorSettings.waveform = waveformSelect.value;
    updateFrequencyControlVisibility();
    engine.updateGeneratorSettings(generatorSettings);
  });

  function setFrequency(value) {
    const clamped = Math.min(NOMINAL_MAX_FREQUENCY_HZ, Math.max(NOMINAL_MIN_FREQUENCY_HZ, value));
    generatorSettings.frequency = clamped;
    frequencyInput.value = String(clamped);
    frequencyRange.value = String(clamped);
    engine.updateGeneratorSettings(generatorSettings);
  }
  frequencyInput.addEventListener('input', () => setFrequency(Number(frequencyInput.value)));
  frequencyRange.addEventListener('input', () => setFrequency(Number(frequencyRange.value)));

  gainRange.addEventListener('input', () => {
    const val = Number(gainRange.value);
    generatorSettings.gainDb = val;
    setTextIfChanged(gainValueOutput, `${val} dBFS`);
    syncOutputControls();
  });

  channelRadios.forEach((radio) => {
    radio.addEventListener('change', (event) => {
      generatorSettings.channel = event.target.value;
      syncOutputControls();
    });
  });

  phaseToggleBtn.addEventListener('click', () => {
    generatorSettings.phaseInverted = !generatorSettings.phaseInverted;
    phaseToggleBtn.setAttribute('aria-pressed', String(generatorSettings.phaseInverted));
    phaseToggleBtn.textContent = generatorSettings.phaseInverted ? 'Phase: 180° inverted' : 'Phase: 0° normal';
    syncOutputControls();
  });

  muteToggleBtn.addEventListener('click', () => {
    generatorSettings.muted = !generatorSettings.muted;
    muteToggleBtn.setAttribute('aria-pressed', String(generatorSettings.muted));
    muteToggleBtn.textContent = generatorSettings.muted ? 'Unmute' : 'Mute';
    syncOutputControls();
  });

  sweepTypeSelect.addEventListener('change', () => {
    generatorSettings.sweepType = sweepTypeSelect.value;
    engine.updateGeneratorSettings(generatorSettings);
  });
  [sweepStartInput, sweepEndInput, sweepDurationInput].forEach((input) => {
    input.addEventListener('input', () => {
      generatorSettings.sweepStartFreq = Number(sweepStartInput.value);
      generatorSettings.sweepEndFreq = Number(sweepEndInput.value);
      generatorSettings.sweepDuration = Number(sweepDurationInput.value);
      engine.updateGeneratorSettings(generatorSettings);
    });
  });

  signalStartBtn.addEventListener('click', async () => {
    await activateEngine();
    engine.playGenerator(generatorSettings);
    signalStartBtn.disabled = true;
    signalStopBtn.disabled = false;
  });

  signalStopBtn.addEventListener('click', () => {
    engine.stopGenerator();
    signalStartBtn.disabled = false;
    signalStopBtn.disabled = true;
  });

  // --- Export -----------------------------------------------------

  exportBtn.addEventListener('click', async () => {
    clearError(exportErrorEl);
    const durationSec = Number(exportDurationSelect.value);
    exportBtn.disabled = true;
    setTextIfChanged(exportStatusEl, 'Rendering 24-bit / 96 kHz WAV…');
    try {
      await activateEngine();
      const { blob, filename } = await engine.exportGeneratorWav(
        { sampleRate: 96000, bitDepth: 24, channels: 2, exportSource: 'generator', durationSec },
        generatorSettings
      );
      downloadBlob(blob, filename);
      setTextIfChanged(exportStatusEl, `Export complete: ${filename}`);
    } catch (err) {
      showError(exportErrorEl, describeError(err));
      setTextIfChanged(exportStatusEl, '');
    } finally {
      exportBtn.disabled = false;
    }
  });

  // --- Threshold monitor -----------------------------------------------------

  function updateThresholdConfig() {
    currentThresholdConfig = {
      minFrequencyHz: Number(thresholdMinFreqInput.value),
      maxFrequencyHz: Number(thresholdMaxFreqInput.value),
      thresholdDb: Number(thresholdDbRange.value),
    };
    const sampleRate = engine.getSampleRate() || 48000;
    const { valid, errors } = validateThresholdBand(currentThresholdConfig, sampleRate);
    thresholdConfigValid = valid;
    if (!valid) {
      showError(thresholdConfigErrorEl, errors.join(' '));
    } else {
      clearError(thresholdConfigErrorEl);
    }
  }

  thresholdEnabledCheckbox.addEventListener('change', () => {
    thresholdEnabled = thresholdEnabledCheckbox.checked;
  });
  thresholdMinFreqInput.addEventListener('input', updateThresholdConfig);
  thresholdMaxFreqInput.addEventListener('input', updateThresholdConfig);
  thresholdDbRange.addEventListener('input', () => {
    setTextIfChanged(thresholdDbValueOutput, `${thresholdDbRange.value} dBFS`);
    updateThresholdConfig();
  });
  warningAudioCheckbox.addEventListener('change', () => {
    warningAudioEnabled = warningAudioCheckbox.checked;
  });
  updateThresholdConfig();

  function renderAlarmTable() {
    const events = alarmLog.getEvents();
    alarmLogTbody.replaceChildren();
    if (events.length === 0) {
      const row = document.createElement('tr');
      row.id = 'alarm-log-empty-row';
      const cell = document.createElement('td');
      cell.colSpan = 4;
      cell.textContent = 'No alarm events recorded.';
      row.appendChild(cell);
      alarmLogTbody.appendChild(row);
      return;
    }
    for (const event of events) {
      const row = document.createElement('tr');
      row.className = 'al-alarm-row-exceeded';
      const timeCell = document.createElement('td');
      timeCell.textContent = event.time;
      const freqCell = document.createElement('td');
      freqCell.textContent = `${event.peakFrequencyHz} Hz`;
      const levelCell = document.createElement('td');
      levelCell.textContent = `${event.peakDb} dBFS`;
      const statusCell = document.createElement('td');
      statusCell.textContent = 'Exceeded';
      row.append(timeCell, freqCell, levelCell, statusCell);
      alarmLogTbody.appendChild(row);
    }
  }

  clearAlarmLogBtn.addEventListener('click', () => {
    alarmLog.clear();
    renderAlarmTable();
  });

  // --- Canvas lifecycle -----------------------------------------------------

  function colorForPalette(byteValue, palette) {
    const fn = PALETTES[palette] || PALETTES.inferno;
    return fn(byteValue);
  }

  paletteSelect.addEventListener('change', () => {
    currentPalette = paletteSelect.value;
  });

  const rtaResizeObserver = setupCanvasBackingStore(rtaCanvas);
  const waterfallResizeObserver = setupCanvasBackingStore(waterfallCanvas, () => {
    waterfallLineImageData = null;
  });

  function renderRta(freqDataDb, sampleRate) {
    const width = rtaCanvas.width;
    const height = rtaCanvas.height;
    rtaCtx.clearRect(0, 0, width, height);

    const logMin = Math.log10(NOMINAL_MIN_FREQUENCY_HZ);
    const logMax = Math.log10(NOMINAL_MAX_FREQUENCY_HZ);

    rtaCtx.strokeStyle = RTA_GRID_COLOR;
    rtaCtx.lineWidth = 1;
    [100, 1000, 10000].forEach((gridFreq) => {
      const gx = ((Math.log10(gridFreq) - logMin) / (logMax - logMin)) * width;
      rtaCtx.beginPath();
      rtaCtx.moveTo(gx, 0);
      rtaCtx.lineTo(gx, height);
      rtaCtx.stroke();
    });

    if (thresholdConfigValid) {
      const threshY = height - ((currentThresholdConfig.thresholdDb + 100) / 100) * height;
      rtaCtx.strokeStyle = RTA_THRESHOLD_COLOR;
      rtaCtx.setLineDash([4, 4]);
      rtaCtx.beginPath();
      rtaCtx.moveTo(0, threshY);
      rtaCtx.lineTo(width, threshY);
      rtaCtx.stroke();
      rtaCtx.setLineDash([]);
    }

    rtaCtx.strokeStyle = RTA_LINE_COLOR;
    rtaCtx.lineWidth = 1.5;
    rtaCtx.beginPath();
    for (let x = 0; x < width; x++) {
      const freq = Math.pow(10, logMin + (x / width) * (logMax - logMin));
      const bin = frequencyToBinIndex(freq, sampleRate, ANALYSER_FFT_SIZE);
      const db = Number.isFinite(freqDataDb[bin]) ? freqDataDb[bin] : -140;
      const y = height - ((db + 100) / 100) * height;
      if (x === 0) rtaCtx.moveTo(x, y);
      else rtaCtx.lineTo(x, y);
    }
    rtaCtx.stroke();
  }

  // Waterfall shift uses drawImage() by accepted design decision (see WO-AUDIO-02 section 12):
  // this is a deliberate implementation choice, not a defect to "fix" back to getImageData().
  function renderWaterfall(freqDataByte, sampleRate) {
    const width = waterfallCanvas.width;
    const height = waterfallCanvas.height;
    if (width < 1 || height <= WATERFALL_SCROLL_SPEED_PX) return;

    if (!waterfallLineImageData || waterfallLineImageData.width !== width) {
      waterfallLineImageData = waterfallCtx.createImageData(width, WATERFALL_SCROLL_SPEED_PX);
    }

    waterfallCtx.drawImage(
      waterfallCanvas,
      0,
      0,
      width,
      height - WATERFALL_SCROLL_SPEED_PX,
      0,
      WATERFALL_SCROLL_SPEED_PX,
      width,
      height - WATERFALL_SCROLL_SPEED_PX
    );

    const logMin = Math.log10(NOMINAL_MIN_FREQUENCY_HZ);
    const logMax = Math.log10(NOMINAL_MAX_FREQUENCY_HZ);
    const data = waterfallLineImageData.data;
    for (let x = 0; x < width; x++) {
      const freq = Math.pow(10, logMin + (x / width) * (logMax - logMin));
      const bin = frequencyToBinIndex(freq, sampleRate, ANALYSER_FFT_SIZE);
      const byteVal = freqDataByte[bin] || 0;
      const { r, g, b } = colorForPalette(byteVal, currentPalette);
      for (let s = 0; s < WATERFALL_SCROLL_SPEED_PX; s++) {
        const idx = (s * width + x) * 4;
        data[idx] = r;
        data[idx + 1] = g;
        data[idx + 2] = b;
        data[idx + 3] = 255;
      }
    }
    waterfallCtx.putImageData(waterfallLineImageData, 0, 0);
  }

  function updateThresholdAndAlarms(freqDataDb, sampleRate) {
    if (!thresholdConfigValid) {
      setTextIfChanged(thresholdStatusEl, 'Status: band configuration invalid');
      thresholdStatusEl.classList.remove('al-alarm-active');
      return;
    }
    const peak = findBandPeak(freqDataDb, sampleRate, currentThresholdConfig.minFrequencyHz, currentThresholdConfig.maxFrequencyHz, ANALYSER_FFT_SIZE);
    if (!peak) return;

    setTextIfChanged(livePeakReadoutEl, `Peak: ${Math.round(peak.frequencyHz)} Hz @ ${peak.decibels.toFixed(1)} dBFS`);

    if (!thresholdEnabled) {
      setTextIfChanged(thresholdStatusEl, 'Status: monitor disabled');
      thresholdStatusEl.classList.remove('al-alarm-active');
      return;
    }

    if (isThresholdExceeded(peak.decibels, currentThresholdConfig.thresholdDb)) {
      setTextIfChanged(thresholdStatusEl, 'Status: threshold exceeded');
      thresholdStatusEl.classList.add('al-alarm-active');
      const accepted = alarmLog.recordIfDue(
        {
          time: new Date().toLocaleTimeString(),
          peakFrequencyHz: Math.round(peak.frequencyHz),
          peakDb: Number(peak.decibels.toFixed(1)),
        },
        Date.now()
      );
      if (accepted) {
        renderAlarmTable();
        if (warningAudioEnabled) engine.playWarningTone();
      }
    } else {
      setTextIfChanged(thresholdStatusEl, 'Status: normal');
      thresholdStatusEl.classList.remove('al-alarm-active');
    }
  }

  function updateInspectFrequencyReadout(freqDataDb, sampleRate) {
    const inspectFreq = Number(inspectFrequencyInput.value);
    if (!Number.isFinite(inspectFreq)) return;
    const bin = frequencyToBinIndex(inspectFreq, sampleRate, ANALYSER_FFT_SIZE);
    const db = freqDataDb[bin];
    setTextIfChanged(inspectFrequencyReadout, Number.isFinite(db) ? `${db.toFixed(1)} dBFS` : '– dBFS');
  }

  let rafId = null;
  let loopRunning = false;
  let freqDataDb = null;
  let freqDataByte = null;

  function frame() {
    if (!loopRunning) return;
    rafId = requestAnimationFrame(frame);
    const analyser = engine.getAnalyser();
    const sampleRate = engine.getSampleRate();
    if (!analyser || !sampleRate) return;
    if (!freqDataDb || freqDataDb.length !== analyser.frequencyBinCount) {
      freqDataDb = new Float32Array(analyser.frequencyBinCount);
      freqDataByte = new Uint8Array(analyser.frequencyBinCount);
    }
    analyser.getFloatFrequencyData(freqDataDb);
    analyser.getByteFrequencyData(freqDataByte);

    renderRta(freqDataDb, sampleRate);
    renderWaterfall(freqDataByte, sampleRate);
    updateThresholdAndAlarms(freqDataDb, sampleRate);
    updateInspectFrequencyReadout(freqDataDb, sampleRate);
  }

  function startRenderLoop() {
    if (loopRunning) return;
    loopRunning = true;
    rafId = requestAnimationFrame(frame);
  }

  function stopRenderLoop() {
    loopRunning = false;
    if (rafId !== null) cancelAnimationFrame(rafId);
    rafId = null;
  }

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      stopRenderLoop();
    } else if (engine.getState().contextState === 'running') {
      startRenderLoop();
    }
  });

  window.addEventListener('pagehide', () => {
    stopRenderLoop();
    rtaResizeObserver.disconnect();
    waterfallResizeObserver.disconnect();
    engine.teardown();
  });

  // Initial UI state
  syncOutputControls();
  updateFrequencyControlVisibility();
  updateEngineStatusText();
  renderAlarmTable();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
