import assert from 'node:assert/strict';
import test from 'node:test';

import {
  encodeWavPcm24,
  floatSampleToInt24,
  validateExportConfig,
  REQUIRED_EXPORT_SAMPLE_RATE,
  REQUIRED_EXPORT_BIT_DEPTH,
  REQUIRED_EXPORT_CHANNELS,
  REQUIRED_EXPORT_SOURCE,
} from '../../public/assets/js/audio-lab-engine.js';

function readAscii(view, offset, length) {
  let s = '';
  for (let i = 0; i < length; i++) s += String.fromCharCode(view.getUint8(offset + i));
  return s;
}

// UT-14: WAV RIFF header
test('UT-14 encodeWavPcm24 produces a correct RIFF/WAVE header for a known 2-channel 96 kHz buffer', () => {
  const numFrames = 10;
  const left = new Float32Array(numFrames);
  const right = new Float32Array(numFrames);
  const arrayBuffer = encodeWavPcm24([left, right], 96000);
  const view = new DataView(arrayBuffer);

  assert.equal(readAscii(view, 0, 4), 'RIFF');
  assert.equal(readAscii(view, 8, 4), 'WAVE');
  assert.equal(readAscii(view, 12, 4), 'fmt ');
  assert.equal(view.getUint32(16, true), 16); // fmt chunk size
  assert.equal(view.getUint16(20, true), 1); // PCM
  assert.equal(view.getUint16(22, true), 2); // channels
  assert.equal(view.getUint32(24, true), 96000); // sample rate
  assert.equal(view.getUint16(32, true), 6); // blockAlign = 2 channels * 3 bytes
  assert.equal(view.getUint32(28, true), 576000); // byteRate = 96000 * 6
  assert.equal(view.getUint16(34, true), 24); // bit depth
  assert.equal(readAscii(view, 36, 4), 'data');

  const dataSize = numFrames * 6;
  assert.equal(view.getUint32(40, true), dataSize);
  assert.equal(view.getUint32(4, true), 44 - 8 + dataSize); // RIFF size excludes 'RIFF' + size field
  assert.equal(arrayBuffer.byteLength, 44 + dataSize);
});

// UT-15: 24-bit PCM sample encoding
test('UT-15 floatSampleToInt24 clamps and scales known sample values correctly', () => {
  assert.equal(floatSampleToInt24(0), 0);
  assert.equal(floatSampleToInt24(1), 0x7fffff); // +8388607
  assert.equal(floatSampleToInt24(-1), -0x800000); // -8388608
  assert.equal(floatSampleToInt24(0.5), Math.floor(0.5 * 0x7fffff));
  assert.equal(floatSampleToInt24(-0.5), Math.floor(-0.5 * 0x800000));
  // Out-of-range samples must clamp, not wrap or overflow.
  assert.equal(floatSampleToInt24(2), 0x7fffff);
  assert.equal(floatSampleToInt24(-2), -0x800000);
});

test('UT-15 encodeWavPcm24 writes correct little-endian interleaved sample bytes', () => {
  const left = new Float32Array([1, -1]);
  const right = new Float32Array([0, 0.5]);
  const arrayBuffer = encodeWavPcm24([left, right], 96000);
  const view = new DataView(arrayBuffer);

  function readInt24LE(offset) {
    const b0 = view.getUint8(offset);
    const b1 = view.getUint8(offset + 1);
    const b2 = view.getUint8(offset + 2);
    let value = b0 | (b1 << 8) | (b2 << 16);
    if (value & 0x800000) value -= 0x1000000; // sign-extend
    return value;
  }

  let offset = 44;
  assert.equal(readInt24LE(offset), floatSampleToInt24(1)); // frame 0, left
  offset += 3;
  assert.equal(readInt24LE(offset), floatSampleToInt24(0)); // frame 0, right
  offset += 3;
  assert.equal(readInt24LE(offset), floatSampleToInt24(-1)); // frame 1, left
  offset += 3;
  assert.equal(readInt24LE(offset), floatSampleToInt24(0.5)); // frame 1, right
});

test('encodeWavPcm24 rejects mismatched channel lengths and non-finite sample rates', () => {
  assert.throws(() => encodeWavPcm24([new Float32Array(4), new Float32Array(3)], 96000));
  assert.throws(() => encodeWavPcm24([new Float32Array(4)], NaN));
  assert.throws(() => encodeWavPcm24([], 96000));
});

// UT-16: export scope rejection
test('UT-16 validateExportConfig accepts only the approved 24-bit/96kHz stereo generator scope', () => {
  const good = {
    sampleRate: REQUIRED_EXPORT_SAMPLE_RATE,
    bitDepth: REQUIRED_EXPORT_BIT_DEPTH,
    channels: REQUIRED_EXPORT_CHANNELS,
    exportSource: REQUIRED_EXPORT_SOURCE,
    durationSec: 5,
  };
  assert.equal(validateExportConfig(good).valid, true);
});

test('UT-16 validateExportConfig rejects unsupported bit depth, channel count, and source', () => {
  const base = { sampleRate: 96000, bitDepth: 24, channels: 2, exportSource: 'generator', durationSec: 5 };
  assert.equal(validateExportConfig({ ...base, bitDepth: 16 }).valid, false);
  assert.equal(validateExportConfig({ ...base, bitDepth: 32 }).valid, false);
  assert.equal(validateExportConfig({ ...base, channels: 1 }).valid, false);
  assert.equal(validateExportConfig({ ...base, exportSource: 'current-stream' }).valid, false);
  assert.equal(validateExportConfig({ ...base, sampleRate: 48000 }).valid, false);
  assert.equal(validateExportConfig({ ...base, durationSec: 7 }).valid, false);
  assert.equal(validateExportConfig(null).valid, false);
});
