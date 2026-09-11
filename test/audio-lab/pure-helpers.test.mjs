import assert from 'node:assert/strict';
import test from 'node:test';

import {
  dbToLinearGain,
  frequencyToBinIndex,
  findBandPeak,
  validateThresholdBand,
  isThresholdExceeded,
  AlarmLog,
  computeChannelPhaseGains,
  computeMonitorGain,
  createSeededRng,
  generateWhiteNoiseSamples,
  generatePinkNoiseSamples,
  generateBrownNoiseSamples,
  computeSweepSchedule,
  buildExportFilename,
  validateAudioFile,
  ANALYSER_FFT_SIZE,
} from '../../public/assets/js/audio-lab-engine.js';

// UT-01: dB-to-linear gain
test('UT-01 dbToLinearGain matches 10^(dB/20) within tolerance', () => {
  assert.ok(Math.abs(dbToLinearGain(0) - 1) < 1e-9);
  assert.ok(Math.abs(dbToLinearGain(-6.0206) - 0.5) < 1e-4);
  assert.ok(Math.abs(dbToLinearGain(-20) - 0.1) < 1e-9);
  assert.ok(Math.abs(dbToLinearGain(-80) - 0.0001) < 1e-9);
});

test('UT-01 dbToLinearGain returns zero when muted regardless of dB', () => {
  assert.equal(dbToLinearGain(0, { muted: true }), 0);
  assert.equal(dbToLinearGain(-12, { muted: true }), 0);
});

test('UT-01 dbToLinearGain is safe for non-finite input', () => {
  assert.equal(dbToLinearGain(NaN), 0);
  assert.equal(dbToLinearGain(Infinity), 0);
});

// UT-02: frequency/bin mapping across sample rates, including Nyquist clamping
test('UT-02 frequencyToBinIndex maps known frequencies at 44.1/48/96 kHz', () => {
  assert.equal(frequencyToBinIndex(20, 44100, ANALYSER_FFT_SIZE), 4);
  assert.equal(frequencyToBinIndex(1000, 44100, ANALYSER_FFT_SIZE), 186);
  assert.equal(frequencyToBinIndex(20000, 44100, ANALYSER_FFT_SIZE), 3715);
  assert.equal(frequencyToBinIndex(22050, 44100, ANALYSER_FFT_SIZE), 4095); // Nyquist, clamped

  assert.equal(frequencyToBinIndex(20, 48000, ANALYSER_FFT_SIZE), 3);
  assert.equal(frequencyToBinIndex(1000, 48000, ANALYSER_FFT_SIZE), 171);
  assert.equal(frequencyToBinIndex(20000, 48000, ANALYSER_FFT_SIZE), 3413);
  assert.equal(frequencyToBinIndex(24000, 48000, ANALYSER_FFT_SIZE), 4095); // Nyquist, clamped

  assert.equal(frequencyToBinIndex(20, 96000, ANALYSER_FFT_SIZE), 2);
  assert.equal(frequencyToBinIndex(1000, 96000, ANALYSER_FFT_SIZE), 85);
  assert.equal(frequencyToBinIndex(20000, 96000, ANALYSER_FFT_SIZE), 1707);
  assert.equal(frequencyToBinIndex(48000, 96000, ANALYSER_FFT_SIZE), 4095); // Nyquist, clamped
});

test('UT-02 frequencyToBinIndex clamps invalid/out-of-range input to a safe bin', () => {
  assert.equal(frequencyToBinIndex(NaN, 48000, ANALYSER_FFT_SIZE), 0);
  assert.equal(frequencyToBinIndex(-100, 48000, ANALYSER_FFT_SIZE), 0);
  assert.equal(frequencyToBinIndex(1e9, 48000, ANALYSER_FFT_SIZE), 4095);
});

// UT-03: exact band peak, no pixel-width dependence
test('UT-03 findBandPeak returns the highest in-band bin, ignoring out-of-band peaks', () => {
  const sampleRate = 48000;
  const bins = new Float32Array(4096).fill(-140);
  const insideBin = frequencyToBinIndex(500, sampleRate); // inside [100, 1000]
  const outsideBin = frequencyToBinIndex(5000, sampleRate); // outside band, higher magnitude
  bins[insideBin] = -20;
  bins[outsideBin] = -5; // must NOT win, it's outside the band

  const peak = findBandPeak(bins, sampleRate, 100, 1000);
  assert.equal(peak.binIndex, insideBin);
  assert.ok(Math.abs(peak.decibels - -20) < 1e-9);
});

test('UT-03 findBandPeak picks a peak exactly at a band edge', () => {
  const sampleRate = 48000;
  const bins = new Float32Array(4096).fill(-140);
  const edgeBin = frequencyToBinIndex(1000, sampleRate);
  bins[edgeBin] = -3;
  const peak = findBandPeak(bins, sampleRate, 100, 1000);
  assert.equal(peak.binIndex, edgeBin);
});

test('UT-03 findBandPeak returns null for an empty/invalid band', () => {
  const bins = new Float32Array(4096).fill(-140);
  assert.equal(findBandPeak(bins, 48000, NaN, 1000), null);
  assert.equal(findBandPeak(null, 48000, 100, 1000), null);
});

// UT-04: threshold validation and comparison
test('UT-04 validateThresholdBand rejects NaN, reversed range, and Nyquist overrun', () => {
  assert.equal(validateThresholdBand({ minFrequencyHz: 100, maxFrequencyHz: 1000, thresholdDb: -12 }, 48000).valid, true);
  assert.equal(validateThresholdBand({ minFrequencyHz: NaN, maxFrequencyHz: 1000, thresholdDb: -12 }, 48000).valid, false);
  assert.equal(validateThresholdBand({ minFrequencyHz: 1000, maxFrequencyHz: 100, thresholdDb: -12 }, 48000).valid, false);
  assert.equal(validateThresholdBand({ minFrequencyHz: 100, maxFrequencyHz: 30000, thresholdDb: -12 }, 48000).valid, false);
  assert.equal(validateThresholdBand({ minFrequencyHz: 0, maxFrequencyHz: 1000, thresholdDb: -12 }, 48000).valid, false);
  assert.equal(validateThresholdBand({ minFrequencyHz: -10, maxFrequencyHz: 1000, thresholdDb: -12 }, 48000).valid, false);
});

test('UT-04 isThresholdExceeded triggers on equality and never on non-finite input', () => {
  assert.equal(isThresholdExceeded(-12, -12), true);
  assert.equal(isThresholdExceeded(-12.1, -12), false);
  assert.equal(isThresholdExceeded(-11.9, -12), true);
  assert.equal(isThresholdExceeded(NaN, -12), false);
  assert.equal(isThresholdExceeded(-12, NaN), false);
});

// UT-05: alarm cap
test('UT-05 AlarmLog retains exactly 50 newest events in order', () => {
  const log = new AlarmLog({ capacity: 50, holdMs: 0 });
  for (let i = 0; i < 55; i++) {
    log.recordIfDue({ id: i }, i * 10);
  }
  const events = log.getEvents();
  assert.equal(events.length, 50);
  assert.equal(events[0].id, 54); // newest first
  assert.equal(events[49].id, 5); // oldest retained
});

// UT-06: alarm hold interval
test('UT-06 AlarmLog rejects duplicates inside the hold interval and accepts at the boundary', () => {
  const log = new AlarmLog({ capacity: 50, holdMs: 1000 });
  assert.equal(log.recordIfDue({ id: 'a' }, 0), true);
  assert.equal(log.recordIfDue({ id: 'b' }, 500), false); // inside hold
  assert.equal(log.recordIfDue({ id: 'c' }, 999), false); // still inside hold
  assert.equal(log.recordIfDue({ id: 'd' }, 1000), true); // exactly at the documented boundary
  assert.equal(log.getEvents().length, 2);
});

test('UT-06 AlarmLog.clear resets both events and the hold clock', () => {
  const log = new AlarmLog({ holdMs: 1000 });
  log.recordIfDue({ id: 'a' }, 0);
  log.clear();
  assert.equal(log.getEvents().length, 0);
  assert.equal(log.recordIfDue({ id: 'b' }, 1), true); // hold clock reset, not still gated by t=0
});

// UT-10 (pure half): channel/phase gains
test('UT-10 computeChannelPhaseGains covers both/left/right and phase inversion', () => {
  assert.deepEqual(computeChannelPhaseGains('both', false), { left: 1, right: 1 });
  assert.deepEqual(computeChannelPhaseGains('left', false), { left: 1, right: 0 });
  assert.deepEqual(computeChannelPhaseGains('right', false), { left: 0, right: 1 });
  assert.deepEqual(computeChannelPhaseGains('both', true), { left: 1, right: -1 });
  assert.deepEqual(computeChannelPhaseGains('right', true), { left: 0, right: -1 });
});

// UT-09 (pure half): monitor gate policy
test('UT-09 computeMonitorGain: microphone is always silent, generator/file follow playing state', () => {
  assert.equal(computeMonitorGain('microphone', { isPlaying: true }), 0);
  assert.equal(computeMonitorGain('microphone', { isPlaying: false }), 0);
  assert.equal(computeMonitorGain('generator', { isPlaying: true }), 1);
  assert.equal(computeMonitorGain('generator', { isPlaying: false }), 0);
  assert.equal(computeMonitorGain('file', { isPlaying: true }), 1);
  assert.equal(computeMonitorGain('file', { isPlaying: false }), 0);
});

// UT-11: white noise
test('UT-11 generateWhiteNoiseSamples stays within [-1, 1] with a near-zero mean', () => {
  const rng = createSeededRng(42);
  const samples = generateWhiteNoiseSamples(20000, rng);
  let sum = 0;
  for (const s of samples) {
    assert.ok(s >= -1 && s <= 1);
    sum += s;
  }
  assert.ok(Math.abs(sum / samples.length) < 0.02);
});

test('UT-11 generateWhiteNoiseSamples is deterministic for a given seed', () => {
  const a = generateWhiteNoiseSamples(100, createSeededRng(7));
  const b = generateWhiteNoiseSamples(100, createSeededRng(7));
  assert.deepEqual(Array.from(a), Array.from(b));
});

// UT-12: pink/brown noise
test('UT-12 generatePinkNoiseSamples and generateBrownNoiseSamples are bounded with no NaN', () => {
  const rng = createSeededRng(99);
  const pink = generatePinkNoiseSamples(20000, rng);
  const brown = generateBrownNoiseSamples(20000, rng);
  for (const s of pink) assert.ok(Number.isFinite(s));
  for (const s of brown) {
    assert.ok(Number.isFinite(s));
    assert.ok(s >= -1 && s <= 1);
  }
});

test('UT-12 brown noise is smoother (lower sample-to-sample roughness) than white noise from the same RNG stream', () => {
  const length = 5000;
  const white = generateWhiteNoiseSamples(length, createSeededRng(11));
  const brown = generateBrownNoiseSamples(length, createSeededRng(11));

  const roughness = (samples) => {
    let total = 0;
    for (let i = 1; i < samples.length; i++) total += Math.abs(samples[i] - samples[i - 1]);
    return total / (samples.length - 1);
  };

  assert.ok(roughness(brown) < roughness(white));
});

// UT-13 (pure half): sweep schedule computation
test('UT-13 computeSweepSchedule derives correct start/end frequency, timing, and automation method', () => {
  const linear = computeSweepSchedule({ sweepType: 'linear', startFreqHz: 100, endFreqHz: 2000, durationSec: 3, startTime: 5 });
  assert.equal(linear.startFreqHz, 100);
  assert.equal(linear.endFreqHz, 2000);
  assert.equal(linear.startTime, 5);
  assert.equal(linear.endTime, 8);
  assert.equal(linear.rampMethod, 'linearRampToValueAtTime');

  const log = computeSweepSchedule({ sweepType: 'logarithmic', startFreqHz: 20, endFreqHz: 20000, durationSec: 10, startTime: 0 });
  assert.equal(log.rampMethod, 'exponentialRampToValueAtTime');
});

test('UT-13 computeSweepSchedule clamps non-positive frequencies to the exponential-ramp-safe floor', () => {
  const schedule = computeSweepSchedule({ sweepType: 'logarithmic', startFreqHz: 0, endFreqHz: -5, durationSec: 1 });
  assert.ok(schedule.startFreqHz > 0);
  assert.ok(schedule.endFreqHz > 0);
});

// UT-17: download filename
test('UT-17 buildExportFilename produces a safe, deterministic name', () => {
  assert.equal(
    buildExportFilename({ waveform: 'sine', durationSec: 5, timestampMs: 1000 }),
    'audio-lab_sine_5s_1000.wav'
  );
});

test('UT-17 buildExportFilename strips user-controlled/path-unsafe characters from the waveform token', () => {
  const name = buildExportFilename({ waveform: '../../etc/passwd', durationSec: 5, timestampMs: 1000 });
  // Only the fixed "audio-lab_..._<n>s_<ts>.wav" shape and its intentional dot/underscore
  // separators may appear; the waveform token itself must contain no path characters.
  assert.match(name, /^audio-lab_[a-z0-9-]+_5s_1000\.wav$/);
  assert.doesNotMatch(name, /\.\./);
});

// File validation (Portal Adaptation Plan section 4: type/size validation)
test('validateAudioFile rejects oversized, empty, and non-audio files; accepts audio types', () => {
  assert.equal(validateAudioFile(null).valid, false);
  assert.equal(validateAudioFile({ size: 0, type: 'audio/wav' }).valid, false);
  assert.equal(validateAudioFile({ size: 10, type: 'text/plain' }).valid, false);
  assert.equal(validateAudioFile({ size: 10, type: 'audio/mpeg' }).valid, true);
  assert.equal(validateAudioFile({ size: 10 * 1024 * 1024 * 1024, type: 'audio/wav' }).valid, false);
});
