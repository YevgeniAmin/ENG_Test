// DOM-independent Web Audio engine for the ENG-Portal Audio Lab.
// No DOM selectors, UI strings, network calls, or Gemini/API dependency belong in this file.
// All stateful behavior is created per-instance via createAudioLabEngine() (no module-level
// singletons) so multiple isolated engines can exist side by side, e.g. under test.

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

export const ANALYSER_FFT_SIZE = 8192;
export const NOMINAL_MIN_FREQUENCY_HZ = 20;
export const NOMINAL_MAX_FREQUENCY_HZ = 20000;

// exponentialRampToValueAtTime() throws for target values <= 0; this floor exists purely to
// keep sweep automation valid, independent of the 20 Hz-20 kHz nominal UI input range.
export const MIN_SWEEP_FREQUENCY_HZ = 1;

export const ALARM_LOG_CAPACITY = 50;
export const ALARM_HOLD_MS_DEFAULT = 1000;

export const DEFAULT_MAX_FILE_BYTES = 100 * 1024 * 1024;

export const APPROVED_EXPORT_DURATIONS_SEC = [1, 5, 10, 30];
export const REQUIRED_EXPORT_SAMPLE_RATE = 96000;
export const REQUIRED_EXPORT_BIT_DEPTH = 24;
export const REQUIRED_EXPORT_CHANNELS = 2;
export const REQUIRED_EXPORT_SOURCE = 'generator';

const OSCILLATOR_WAVEFORMS = new Set(['sine', 'square', 'triangle', 'sawtooth']);
const NOISE_WAVEFORMS = new Set(['white-noise', 'pink-noise', 'brown-noise']);

const WARNING_TONE_FREQUENCY_HZ = 880;
const WARNING_TONE_DURATION_SEC = 0.15;
const WARNING_TONE_PEAK_GAIN = 0.1; // bounded, roughly -20 dBFS

const GAIN_RAMP_TIME_CONSTANT_SEC = 0.005; // short ramp to avoid clicks

// ---------------------------------------------------------------------------
// Errors
// ---------------------------------------------------------------------------

// message is always a fixed, sanitized string: never the raw browser exception,
// a device label, or a file path.
export class AudioLabEngineError extends Error {
  constructor(code, message) {
    super(message);
    this.name = 'AudioLabEngineError';
    this.code = code;
  }
}

// ---------------------------------------------------------------------------
// Pure helpers: gain
// ---------------------------------------------------------------------------

export function dbToLinearGain(db, { muted = false } = {}) {
  if (muted) return 0;
  if (!Number.isFinite(db)) return 0;
  return Math.pow(10, db / 20);
}

// ---------------------------------------------------------------------------
// Pure helpers: bin mapping and band-peak detection
// ---------------------------------------------------------------------------

export function frequencyToBinIndex(frequencyHz, sampleRate, fftSize = ANALYSER_FFT_SIZE) {
  if (
    !Number.isFinite(frequencyHz) ||
    !Number.isFinite(sampleRate) ||
    sampleRate <= 0 ||
    !Number.isFinite(fftSize) ||
    fftSize <= 0
  ) {
    return 0;
  }
  const binCount = fftSize / 2;
  const binWidthHz = sampleRate / fftSize;
  const bin = Math.round(frequencyHz / binWidthHz);
  return Math.max(0, Math.min(binCount - 1, bin));
}

export function binIndexToFrequency(binIndex, sampleRate, fftSize = ANALYSER_FFT_SIZE) {
  if (!Number.isFinite(binIndex) || !Number.isFinite(sampleRate) || sampleRate <= 0) return 0;
  return binIndex * (sampleRate / fftSize);
}

// Iterates every real FFT bin inside [minFrequencyHz, maxFrequencyHz] rather than sampling by
// canvas pixel position, so narrow peaks are never skipped or repeated (resolves SR-04).
export function findBandPeak(frequencyDataDb, sampleRate, minFrequencyHz, maxFrequencyHz, fftSize = ANALYSER_FFT_SIZE) {
  if (!frequencyDataDb || frequencyDataDb.length === 0) return null;
  if (!Number.isFinite(sampleRate) || sampleRate <= 0) return null;
  if (!Number.isFinite(minFrequencyHz) || !Number.isFinite(maxFrequencyHz)) return null;

  const binCount = Math.min(frequencyDataDb.length, fftSize / 2);
  const startBin = frequencyToBinIndex(minFrequencyHz, sampleRate, fftSize);
  const endBin = frequencyToBinIndex(maxFrequencyHz, sampleRate, fftSize);
  const lo = Math.max(0, Math.min(startBin, endBin));
  const hi = Math.min(binCount - 1, Math.max(startBin, endBin));

  let peakBin = -1;
  let peakDb = -Infinity;
  for (let bin = lo; bin <= hi; bin++) {
    const db = frequencyDataDb[bin];
    if (Number.isFinite(db) && db > peakDb) {
      peakDb = db;
      peakBin = bin;
    }
  }
  if (peakBin === -1) return null;
  return { binIndex: peakBin, frequencyHz: binIndexToFrequency(peakBin, sampleRate, fftSize), decibels: peakDb };
}

// ---------------------------------------------------------------------------
// Pure helpers: threshold validation and comparison
// ---------------------------------------------------------------------------

export function validateThresholdBand({ minFrequencyHz, maxFrequencyHz, thresholdDb }, sampleRate) {
  const errors = [];
  if (!Number.isFinite(minFrequencyHz) || minFrequencyHz <= 0) errors.push('minFrequencyHz must be a positive finite number.');
  if (!Number.isFinite(maxFrequencyHz) || maxFrequencyHz <= 0) errors.push('maxFrequencyHz must be a positive finite number.');
  if (!Number.isFinite(thresholdDb)) errors.push('thresholdDb must be a finite number.');
  if (Number.isFinite(minFrequencyHz) && Number.isFinite(maxFrequencyHz) && minFrequencyHz > maxFrequencyHz) {
    errors.push('minFrequencyHz must not exceed maxFrequencyHz.');
  }
  if (Number.isFinite(sampleRate) && sampleRate > 0 && Number.isFinite(maxFrequencyHz)) {
    const nyquist = sampleRate / 2;
    if (maxFrequencyHz > nyquist) errors.push('maxFrequencyHz exceeds the Nyquist limit for the active sample rate.');
  }
  return { valid: errors.length === 0, errors };
}

// Equality triggers; NaN/non-finite inputs never trigger.
export function isThresholdExceeded(peakDb, thresholdDb) {
  return Number.isFinite(peakDb) && Number.isFinite(thresholdDb) && peakDb >= thresholdDb;
}

// ---------------------------------------------------------------------------
// Pure state: alarm log (capped, hold-interval gated, no DOM)
// ---------------------------------------------------------------------------

export class AlarmLog {
  constructor({ capacity = ALARM_LOG_CAPACITY, holdMs = ALARM_HOLD_MS_DEFAULT } = {}) {
    this.capacity = capacity;
    this.holdMs = holdMs;
    this._events = [];
    this._lastAcceptedAtMs = -Infinity;
  }

  // nowMs is caller-supplied (not Date.now() internally) so hold-interval behavior is testable
  // without real timers.
  recordIfDue(event, nowMs) {
    if (!Number.isFinite(nowMs)) throw new AudioLabEngineError('invalid-clock', 'recordIfDue requires a finite timestamp.');
    if (nowMs - this._lastAcceptedAtMs < this.holdMs) return false;
    this._lastAcceptedAtMs = nowMs;
    this._events.unshift(event);
    if (this._events.length > this.capacity) this._events.length = this.capacity;
    return true;
  }

  getEvents() {
    return this._events.slice();
  }

  clear() {
    this._events = [];
    this._lastAcceptedAtMs = -Infinity;
  }
}

// ---------------------------------------------------------------------------
// Pure helpers: channel routing / phase / monitor policy
// ---------------------------------------------------------------------------

export function computeChannelPhaseGains(channel, phaseInverted) {
  const left = channel === 'right' ? 0 : 1;
  const right = channel === 'left' ? 0 : (phaseInverted ? -1 : 1);
  return { left, right };
}

// Monitor-gate policy (SR-02/SR-03): microphone is never routed to the destination; generator
// and decoded-file sources are audible only while explicitly playing.
export function computeMonitorGain(sourceType, { isPlaying = false } = {}) {
  if (sourceType === 'generator' || sourceType === 'file') return isPlaying ? 1 : 0;
  return 0;
}

// ---------------------------------------------------------------------------
// Pure helpers: deterministic RNG seam and noise generators
// ---------------------------------------------------------------------------

export function createSeededRng(seed = 1) {
  let state = (seed >>> 0) || 1;
  return function seededRandom() {
    state ^= state << 13;
    state >>>= 0;
    state ^= state >>> 17;
    state ^= state << 5;
    state >>>= 0;
    return state / 4294967296;
  };
}

export function generateWhiteNoiseSamples(length, rng = Math.random) {
  const out = new Float32Array(length);
  for (let i = 0; i < length; i++) out[i] = rng() * 2 - 1;
  return out;
}

// Paul Kellet's refined 1/f pink-noise approximation.
export function generatePinkNoiseSamples(length, rng = Math.random) {
  const out = new Float32Array(length);
  let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
  for (let i = 0; i < length; i++) {
    const white = rng() * 2 - 1;
    b0 = 0.99886 * b0 + white * 0.0555179;
    b1 = 0.99332 * b1 + white * 0.0750759;
    b2 = 0.96900 * b2 + white * 0.1538520;
    b3 = 0.86650 * b3 + white * 0.3104856;
    b4 = 0.55000 * b4 + white * 0.5329522;
    b5 = -0.7616 * b5 - white * 0.0168980;
    out[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.11;
    b6 = white * 0.115926;
  }
  return out;
}

// Leaky-integrator Brownian noise; output is clamped to [-1, 1] (upstream did not clamp).
export function generateBrownNoiseSamples(length, rng = Math.random) {
  const out = new Float32Array(length);
  let last = 0;
  for (let i = 0; i < length; i++) {
    const white = rng() * 2 - 1;
    last = (last + 0.02 * white) / 1.02;
    out[i] = Math.max(-1, Math.min(1, last * 3.5));
  }
  return out;
}

// ---------------------------------------------------------------------------
// Pure helpers: sweep scheduling
// ---------------------------------------------------------------------------

export function computeSweepSchedule({ sweepType, startFreqHz, endFreqHz, durationSec, startTime = 0 }) {
  const clampedStart = Math.max(MIN_SWEEP_FREQUENCY_HZ, Number(startFreqHz) || MIN_SWEEP_FREQUENCY_HZ);
  const clampedEnd = Math.max(MIN_SWEEP_FREQUENCY_HZ, Number(endFreqHz) || MIN_SWEEP_FREQUENCY_HZ);
  const duration = Math.max(0.001, Number(durationSec) || 0.001);
  const rampMethod = sweepType === 'logarithmic' ? 'exponentialRampToValueAtTime' : 'linearRampToValueAtTime';
  return {
    startFreqHz: clampedStart,
    endFreqHz: clampedEnd,
    startTime,
    endTime: startTime + duration,
    durationSec: duration,
    rampMethod,
  };
}

// ---------------------------------------------------------------------------
// Pure helpers: file validation
// ---------------------------------------------------------------------------

export function validateAudioFile(file, { maxBytes = DEFAULT_MAX_FILE_BYTES } = {}) {
  if (!file) return { valid: false, reason: 'No file was provided.' };
  if (typeof file.size === 'number' && file.size <= 0) return { valid: false, reason: 'The selected file is empty.' };
  if (typeof file.size === 'number' && file.size > maxBytes) {
    return { valid: false, reason: 'The selected file exceeds the local analysis size limit.' };
  }
  if (typeof file.type === 'string' && file.type && !file.type.startsWith('audio/')) {
    return { valid: false, reason: 'The selected file is not recognized as an audio type.' };
  }
  return { valid: true };
}

// ---------------------------------------------------------------------------
// Pure helpers: WAV / PCM24 encoding
// ---------------------------------------------------------------------------

export function floatSampleToInt24(sample) {
  const safe = Number.isFinite(sample) ? sample : 0;
  const clamped = Math.max(-1, Math.min(1, safe));
  return clamped < 0 ? Math.floor(clamped * 0x800000) : Math.floor(clamped * 0x7fffff);
}

function writeAscii(view, offset, text) {
  for (let i = 0; i < text.length; i++) view.setUint8(offset + i, text.charCodeAt(i));
}

// Generic 24-bit PCM RIFF/WAVE encoder. channelBuffers is an array of equal-length
// Float32Array-like sample arrays, one per channel.
export function encodeWavPcm24(channelBuffers, sampleRate) {
  if (!Array.isArray(channelBuffers) || channelBuffers.length === 0) {
    throw new AudioLabEngineError('encode-no-channels', 'encodeWavPcm24 requires at least one channel buffer.');
  }
  const numChannels = channelBuffers.length;
  const numFrames = channelBuffers[0].length;
  for (const ch of channelBuffers) {
    if (ch.length !== numFrames) {
      throw new AudioLabEngineError('encode-length-mismatch', 'encodeWavPcm24 requires equal-length channel buffers.');
    }
  }
  if (!Number.isFinite(sampleRate) || sampleRate <= 0) {
    throw new AudioLabEngineError('encode-bad-rate', 'encodeWavPcm24 requires a positive finite sampleRate.');
  }

  const bytesPerSample = 3;
  const blockAlign = numChannels * bytesPerSample;
  const byteRate = sampleRate * blockAlign;
  const dataSize = numFrames * blockAlign;
  const headerSize = 44;
  const totalSize = headerSize + dataSize;

  const arrayBuffer = new ArrayBuffer(totalSize);
  const view = new DataView(arrayBuffer);

  writeAscii(view, 0, 'RIFF');
  view.setUint32(4, totalSize - 8, true);
  writeAscii(view, 8, 'WAVE');

  writeAscii(view, 12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true); // PCM
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, byteRate, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, 24, true);

  writeAscii(view, 36, 'data');
  view.setUint32(40, dataSize, true);

  let offset = headerSize;
  for (let frame = 0; frame < numFrames; frame++) {
    for (let ch = 0; ch < numChannels; ch++) {
      const intSample = floatSampleToInt24(channelBuffers[ch][frame]);
      view.setUint8(offset, intSample & 0xff);
      view.setUint8(offset + 1, (intSample >> 8) & 0xff);
      view.setUint8(offset + 2, (intSample >> 16) & 0xff);
      offset += 3;
    }
  }
  return arrayBuffer;
}

export function validateExportConfig(config) {
  const errors = [];
  if (!config || typeof config !== 'object') return { valid: false, errors: ['Export configuration is required.'] };
  if (config.sampleRate !== REQUIRED_EXPORT_SAMPLE_RATE) errors.push(`Only ${REQUIRED_EXPORT_SAMPLE_RATE} Hz export is supported.`);
  if (config.bitDepth !== REQUIRED_EXPORT_BIT_DEPTH) errors.push(`Only ${REQUIRED_EXPORT_BIT_DEPTH}-bit export is supported.`);
  if (config.channels !== REQUIRED_EXPORT_CHANNELS) errors.push(`Only ${REQUIRED_EXPORT_CHANNELS}-channel (stereo) export is supported.`);
  if (config.exportSource !== REQUIRED_EXPORT_SOURCE) errors.push(`Only "${REQUIRED_EXPORT_SOURCE}" export source is supported.`);
  if (!APPROVED_EXPORT_DURATIONS_SEC.includes(config.durationSec)) {
    errors.push(`durationSec must be one of: ${APPROVED_EXPORT_DURATIONS_SEC.join(', ')}.`);
  }
  return { valid: errors.length === 0, errors };
}

export function buildExportFilename({ waveform, durationSec, timestampMs }) {
  const safeWaveform = String(waveform || 'signal').toLowerCase().replace(/[^a-z0-9-]/g, '') || 'signal';
  const safeDuration = Number.isFinite(durationSec) ? Math.round(durationSec) : 0;
  const safeTimestamp = Number.isFinite(timestampMs) ? Math.round(timestampMs) : 0;
  return `audio-lab_${safeWaveform}_${safeDuration}s_${safeTimestamp}.wav`;
}

// ---------------------------------------------------------------------------
// Stateful engine factory
// ---------------------------------------------------------------------------

const DEFAULT_DEPS = {
  createContext: () => new (globalThis.AudioContext || globalThis.webkitAudioContext)(),
  createOfflineContext: (numberOfChannels, length, sampleRate) => new OfflineAudioContext(numberOfChannels, length, sampleRate),
  requestMicrophoneStream: () =>
    navigator.mediaDevices.getUserMedia({
      audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false },
    }),
  decodeFileToBuffer: async (file, ctx) => ctx.decodeAudioData(await file.arrayBuffer()),
  randomSource: Math.random,
  scheduleTimeout: (fn, ms) => setTimeout(fn, ms),
  cancelTimeout: (id) => clearTimeout(id),
};

function teardownNode(node, { stop = false } = {}) {
  if (!node) return null;
  if (stop && typeof node.stop === 'function') {
    try {
      node.stop();
    } catch {
      // already stopped
    }
  }
  if (typeof node.disconnect === 'function') {
    try {
      node.disconnect();
    } catch {
      // already disconnected
    }
  }
  return null;
}

// Creates one independent engine instance with its own closured audio graph and state.
export function createAudioLabEngine(overrides = {}) {
  const deps = { ...DEFAULT_DEPS, ...overrides };

  let ctx = null;
  let masterGainNode = null;
  let monoGeneratorMerger = null;
  let channelSplitter = null;
  let channelMerger = null;
  let leftPhaseNode = null;
  let rightPhaseNode = null;
  let analyserNode = null;
  let monitorGateNode = null;
  let warningGainNode = null;

  let activeSourceType = 'generator';
  let generatorPlaying = false;
  let filePlaying = false;
  let microphoneActive = false;

  let activeOscillator = null;
  let activeBufferSource = null;
  let micStream = null;
  let micSourceNode = null;
  let fileBufferSourceNode = null;
  let decodedFileBuffer = null;

  const noiseBufferCache = new Map();
  let sweepTimeoutId = null;
  let currentGeneratorSettings = null;
  let currentOutputControls = { gainDb: -12, muted: false, channel: 'both', phaseInverted: false };

  function rampGain(node, value) {
    const time = ctx.currentTime;
    if (typeof node.gain.setTargetAtTime === 'function') {
      node.gain.setTargetAtTime(value, time, GAIN_RAMP_TIME_CONSTANT_SEC);
    } else {
      node.gain.setValueAtTime(value, time);
    }
  }

  function applyOutputControls(patch = {}) {
    currentOutputControls = { ...currentOutputControls, ...patch };
    if (!masterGainNode) return;
    const linear = dbToLinearGain(currentOutputControls.gainDb, { muted: currentOutputControls.muted });
    rampGain(masterGainNode, linear);
    const { left, right } = computeChannelPhaseGains(currentOutputControls.channel, currentOutputControls.phaseInverted);
    rampGain(leftPhaseNode, left);
    rampGain(rightPhaseNode, right);
  }

  function isSourcePlaying() {
    if (activeSourceType === 'generator') return generatorPlaying;
    if (activeSourceType === 'file') return filePlaying;
    return false;
  }

  function applyMonitorGate() {
    if (!monitorGateNode) return;
    rampGain(monitorGateNode, computeMonitorGain(activeSourceType, { isPlaying: isSourcePlaying() }));
  }

  function ensureContext() {
    if (ctx) return ctx;
    ctx = deps.createContext();

    masterGainNode = ctx.createGain();
    monoGeneratorMerger = ctx.createChannelMerger(2);
    channelSplitter = ctx.createChannelSplitter(2);
    channelMerger = ctx.createChannelMerger(2);
    leftPhaseNode = ctx.createGain();
    rightPhaseNode = ctx.createGain();
    analyserNode = ctx.createAnalyser();
    analyserNode.fftSize = ANALYSER_FFT_SIZE;
    analyserNode.smoothingTimeConstant = 0.2;
    monitorGateNode = ctx.createGain();
    monitorGateNode.gain.value = 0;
    warningGainNode = ctx.createGain();
    warningGainNode.gain.value = 0;

    // Mono oscillators are explicitly duplicated into a stereo signal before they enter the
    // shared graph. ChannelSplitterNode does not duplicate a mono input into its second output.
    // Stereo file/noise sources bypass this normalizer so their independent channels survive.
    monoGeneratorMerger.connect(masterGainNode);

    // active source -> master gain -> splitter -> left/right phase -> merger -> analyser
    //   -> monitor gate -> destination. The analyser stays connected even when the monitor
    //   gate is zero, so silent (e.g. microphone) sources still analyze correctly.
    masterGainNode.connect(channelSplitter);
    channelSplitter.connect(leftPhaseNode, 0);
    channelSplitter.connect(rightPhaseNode, 1);
    leftPhaseNode.connect(channelMerger, 0, 0);
    rightPhaseNode.connect(channelMerger, 0, 1);
    channelMerger.connect(analyserNode);
    analyserNode.connect(monitorGateNode);
    monitorGateNode.connect(ctx.destination);

    // Independent path: never connected to any input/analysis node, so there is no graph-level
    // path back into the microphone (acoustic feedback is a physical-world concern; see MT-08).
    warningGainNode.connect(ctx.destination);

    applyOutputControls(currentOutputControls);
    applyMonitorGate();
    return ctx;
  }

  function connectMonoGenerator(node) {
    node.connect(monoGeneratorMerger, 0, 0);
    node.connect(monoGeneratorMerger, 0, 1);
  }

  function teardownGenerator() {
    if (sweepTimeoutId !== null) {
      deps.cancelTimeout(sweepTimeoutId);
      sweepTimeoutId = null;
    }
    activeOscillator = teardownNode(activeOscillator, { stop: true });
    activeBufferSource = teardownNode(activeBufferSource, { stop: true });
  }

  function teardownFile() {
    fileBufferSourceNode = teardownNode(fileBufferSourceNode, { stop: true });
  }

  function teardownMicrophone() {
    micSourceNode = teardownNode(micSourceNode, { stop: false });
    if (micStream) {
      micStream.getTracks().forEach((track) => {
        try {
          track.stop();
        } catch {
          // already ended
        }
      });
      micStream = null;
    }
  }

  function teardownActiveSource() {
    teardownGenerator();
    teardownFile();
    teardownMicrophone();
  }

  function getOrCreateNoiseBuffer(type) {
    if (noiseBufferCache.has(type)) return noiseBufferCache.get(type);
    const durationSec = 5;
    const length = Math.round(ctx.sampleRate * durationSec);
    const rng = deps.randomSource;
    const generator =
      type === 'white-noise' ? generateWhiteNoiseSamples : type === 'pink-noise' ? generatePinkNoiseSamples : generateBrownNoiseSamples;
    const buffer = ctx.createBuffer(2, length, ctx.sampleRate);
    buffer.getChannelData(0).set(generator(length, rng));
    buffer.getChannelData(1).set(generator(length, rng));
    noiseBufferCache.set(type, buffer);
    return buffer;
  }

  function startSweep(settings) {
    const schedule = computeSweepSchedule({
      sweepType: settings.sweepType,
      startFreqHz: settings.sweepStartFreq,
      endFreqHz: settings.sweepEndFreq,
      durationSec: settings.sweepDuration,
      startTime: ctx.currentTime,
    });
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    connectMonoGenerator(osc);
    osc.frequency.setValueAtTime(schedule.startFreqHz, schedule.startTime);
    osc.frequency[schedule.rampMethod](schedule.endFreqHz, schedule.endTime);
    osc.start();
    activeOscillator = osc;

    sweepTimeoutId = deps.scheduleTimeout(() => {
      sweepTimeoutId = null;
      if (generatorPlaying && activeSourceType === 'generator' && currentGeneratorSettings?.waveform === 'sweep') {
        activeOscillator = teardownNode(activeOscillator, { stop: true });
        startSweep(currentGeneratorSettings);
      }
    }, schedule.durationSec * 1000);
  }

  function playGenerator(settings) {
    ensureContext();
    currentGeneratorSettings = { ...currentGeneratorSettings, ...settings };
    teardownGenerator();
    const s = currentGeneratorSettings;

    if (OSCILLATOR_WAVEFORMS.has(s.waveform)) {
      const osc = ctx.createOscillator();
      osc.type = s.waveform;
      osc.frequency.setValueAtTime(s.frequency, ctx.currentTime);
      connectMonoGenerator(osc);
      osc.start();
      activeOscillator = osc;
    } else if (s.waveform === 'sweep') {
      startSweep(s);
    } else if (NOISE_WAVEFORMS.has(s.waveform)) {
      const src = ctx.createBufferSource();
      src.buffer = getOrCreateNoiseBuffer(s.waveform);
      src.loop = true;
      src.connect(masterGainNode);
      src.start();
      activeBufferSource = src;
    } else {
      throw new AudioLabEngineError('unknown-waveform', 'Unsupported generator waveform.');
    }

    generatorPlaying = true;
    applyMonitorGate();
  }

  function stopGenerator() {
    teardownGenerator();
    generatorPlaying = false;
    applyMonitorGate();
  }

  function updateGeneratorSettings(patch) {
    const previous = currentGeneratorSettings;
    currentGeneratorSettings = { ...currentGeneratorSettings, ...patch };
    if (!generatorPlaying) return;

    const s = currentGeneratorSettings;
    const canUpdateInPlace =
      previous && OSCILLATOR_WAVEFORMS.has(s.waveform) && previous.waveform === s.waveform && activeOscillator && sweepTimeoutId === null;

    if (canUpdateInPlace) {
      activeOscillator.type = s.waveform;
      activeOscillator.frequency.setValueAtTime(s.frequency, ctx.currentTime);
      return;
    }
    playGenerator(s);
  }

  function playFile() {
    ensureContext();
    if (activeSourceType !== 'file' || !decodedFileBuffer) {
      throw new AudioLabEngineError('no-file-loaded', 'No decoded audio file is available to play.');
    }
    teardownFile();
    const src = ctx.createBufferSource();
    src.buffer = decodedFileBuffer;
    src.loop = true;
    src.connect(masterGainNode);
    src.start();
    fileBufferSourceNode = src;
    filePlaying = true;
    applyMonitorGate();
  }

  function stopFile() {
    teardownFile();
    filePlaying = false;
    applyMonitorGate();
  }

  // Transactional source switching (resolves SR-01): the candidate source is fully prepared
  // (permission granted / file decoded) before any teardown of the current valid source. A
  // failure at any point leaves both engine and caller state exactly as before the call.
  async function switchSource(type, { file } = {}) {
    ensureContext();

    if (type === 'generator') {
      teardownActiveSource();
      activeSourceType = 'generator';
      generatorPlaying = false;
      filePlaying = false;
      microphoneActive = false;
      applyMonitorGate();
      return { type: 'generator' };
    }

    if (type === 'microphone') {
      let stream;
      try {
        stream = await deps.requestMicrophoneStream();
      } catch {
        throw new AudioLabEngineError('microphone-permission-denied', 'Microphone access was not granted.');
      }
      teardownActiveSource();
      micStream = stream;
      micSourceNode = ctx.createMediaStreamSource(stream);
      micSourceNode.connect(masterGainNode);
      activeSourceType = 'microphone';
      microphoneActive = true;
      generatorPlaying = false;
      filePlaying = false;
      applyMonitorGate();
      return { type: 'microphone' };
    }

    if (type === 'file') {
      if (!file) throw new AudioLabEngineError('file-missing', 'No file was provided.');
      const validation = validateAudioFile(file);
      if (!validation.valid) throw new AudioLabEngineError('file-invalid', validation.reason);
      let buffer;
      try {
        buffer = await deps.decodeFileToBuffer(file, ctx);
      } catch {
        throw new AudioLabEngineError('file-decode-failed', 'The selected file could not be decoded as audio.');
      }
      teardownActiveSource();
      decodedFileBuffer = buffer;
      activeSourceType = 'file';
      filePlaying = false;
      microphoneActive = false;
      generatorPlaying = false;
      applyMonitorGate();
      return { type: 'file' };
    }

    throw new AudioLabEngineError('unknown-source', 'Unsupported source type.');
  }

  async function stopMicrophone() {
    await switchSource('generator');
  }

  function playWarningTone() {
    ensureContext();
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(WARNING_TONE_FREQUENCY_HZ, ctx.currentTime);
    osc.connect(warningGainNode);
    warningGainNode.gain.setValueAtTime(WARNING_TONE_PEAK_GAIN, ctx.currentTime);
    warningGainNode.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + WARNING_TONE_DURATION_SEC);
    osc.start();
    osc.stop(ctx.currentTime + WARNING_TONE_DURATION_SEC);
  }

  async function activate() {
    ensureContext();
    if (ctx.state === 'suspended') await ctx.resume();
    return ctx.state;
  }

  function getState() {
    return {
      contextState: ctx ? ctx.state : 'uninitialized',
      activeSourceType,
      generatorPlaying,
      filePlaying,
      microphoneActive,
    };
  }

  function getAnalyser() {
    return analyserNode;
  }

  function getSampleRate() {
    return ctx ? ctx.sampleRate : null;
  }

  async function exportGeneratorWav(exportConfig, generatorSettings) {
    const { valid, errors } = validateExportConfig(exportConfig);
    if (!valid) throw new AudioLabEngineError('export-config-invalid', errors.join(' '));

    const numFrames = Math.round(exportConfig.sampleRate * exportConfig.durationSec);
    const offlineCtx = deps.createOfflineContext(REQUIRED_EXPORT_CHANNELS, numFrames, exportConfig.sampleRate);

    const gain = offlineCtx.createGain();
    gain.gain.setValueAtTime(dbToLinearGain(generatorSettings.gainDb, { muted: generatorSettings.muted }), 0);

    const monoGeneratorMerger = offlineCtx.createChannelMerger(2);
    const splitter = offlineCtx.createChannelSplitter(2);
    const merger = offlineCtx.createChannelMerger(2);
    const leftG = offlineCtx.createGain();
    const rightG = offlineCtx.createGain();
    const { left, right } = computeChannelPhaseGains(generatorSettings.channel, generatorSettings.phaseInverted);
    leftG.gain.setValueAtTime(left, 0);
    rightG.gain.setValueAtTime(right, 0);

    monoGeneratorMerger.connect(gain);
    gain.connect(splitter);
    splitter.connect(leftG, 0);
    splitter.connect(rightG, 1);
    leftG.connect(merger, 0, 0);
    rightG.connect(merger, 0, 1);
    merger.connect(offlineCtx.destination);

    if (OSCILLATOR_WAVEFORMS.has(generatorSettings.waveform)) {
      const osc = offlineCtx.createOscillator();
      osc.type = generatorSettings.waveform;
      osc.frequency.setValueAtTime(generatorSettings.frequency, 0);
      osc.connect(monoGeneratorMerger, 0, 0);
      osc.connect(monoGeneratorMerger, 0, 1);
      osc.start(0);
    } else if (generatorSettings.waveform === 'sweep') {
      const schedule = computeSweepSchedule({
        sweepType: generatorSettings.sweepType,
        startFreqHz: generatorSettings.sweepStartFreq,
        endFreqHz: generatorSettings.sweepEndFreq,
        durationSec: exportConfig.durationSec,
        startTime: 0,
      });
      const osc = offlineCtx.createOscillator();
      osc.type = 'sine';
      osc.connect(monoGeneratorMerger, 0, 0);
      osc.connect(monoGeneratorMerger, 0, 1);
      osc.frequency.setValueAtTime(schedule.startFreqHz, 0);
      osc.frequency[schedule.rampMethod](schedule.endFreqHz, schedule.endTime);
      osc.start(0);
    } else if (NOISE_WAVEFORMS.has(generatorSettings.waveform)) {
      const genFn =
        generatorSettings.waveform === 'white-noise'
          ? generateWhiteNoiseSamples
          : generatorSettings.waveform === 'pink-noise'
            ? generatePinkNoiseSamples
            : generateBrownNoiseSamples;
      const buffer = offlineCtx.createBuffer(2, numFrames, exportConfig.sampleRate);
      buffer.getChannelData(0).set(genFn(numFrames, deps.randomSource));
      buffer.getChannelData(1).set(genFn(numFrames, deps.randomSource));
      const src = offlineCtx.createBufferSource();
      src.buffer = buffer;
      src.connect(gain);
      src.start(0);
    } else {
      throw new AudioLabEngineError('unknown-waveform', 'Unsupported export waveform.');
    }

    const rendered = await offlineCtx.startRendering();
    const channelBuffers = [rendered.getChannelData(0), rendered.getChannelData(1)];
    const arrayBuffer = encodeWavPcm24(channelBuffers, exportConfig.sampleRate);
    const blob = typeof Blob !== 'undefined' ? new Blob([arrayBuffer], { type: 'audio/wav' }) : null;
    const filename = buildExportFilename({
      waveform: generatorSettings.waveform,
      durationSec: exportConfig.durationSec,
      timestampMs: Date.now(),
    });
    return { arrayBuffer, blob, filename };
  }

  function teardown() {
    teardownActiveSource();
    if (ctx) {
      try {
        ctx.close();
      } catch {
        // already closed
      }
    }
    ctx = null;
    masterGainNode = null;
    monoGeneratorMerger = null;
    channelSplitter = null;
    channelMerger = null;
    leftPhaseNode = null;
    rightPhaseNode = null;
    analyserNode = null;
    monitorGateNode = null;
    warningGainNode = null;
    noiseBufferCache.clear();
    activeSourceType = 'generator';
    generatorPlaying = false;
    filePlaying = false;
    microphoneActive = false;
  }

  return {
    activate,
    getState,
    getAnalyser,
    getSampleRate,
    setOutputControls: applyOutputControls,
    switchSource,
    playGenerator,
    stopGenerator,
    updateGeneratorSettings,
    playFile,
    stopFile,
    stopMicrophone,
    playWarningTone,
    exportGeneratorWav,
    teardown,
  };
}
