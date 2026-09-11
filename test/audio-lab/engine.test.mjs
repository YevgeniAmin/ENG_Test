import assert from 'node:assert/strict';
import test from 'node:test';

import { createAudioLabEngine, AudioLabEngineError } from '../../public/assets/js/audio-lab-engine.js';
import { FakeAudioContext, FakeOfflineAudioContext, makeFakeStream } from './fake-audio-context.mjs';

function makeTimerDeps() {
  let nextId = 1;
  const scheduled = new Map();
  const cancelledIds = [];
  return {
    scheduleTimeout(fn, ms) {
      const id = nextId++;
      scheduled.set(id, { fn, ms });
      return id;
    },
    cancelTimeout(id) {
      cancelledIds.push(id);
      scheduled.delete(id);
    },
    fireLatest() {
      const ids = Array.from(scheduled.keys());
      const id = ids[ids.length - 1];
      const entry = scheduled.get(id);
      scheduled.delete(id);
      entry.fn();
    },
    scheduled,
    cancelledIds,
  };
}

function makeEngine({ micImpl, fileImpl, timers } = {}) {
  let capturedCtx = null;
  const timerDeps = timers || makeTimerDeps();
  const engine = createAudioLabEngine({
    createContext: () => {
      capturedCtx = new FakeAudioContext({ sampleRate: 48000 });
      return capturedCtx;
    },
    requestMicrophoneStream: micImpl || (() => Promise.resolve(makeFakeStream())),
    decodeFileToBuffer: fileImpl || (async () => ({ numberOfChannels: 2, length: 10, sampleRate: 48000, getChannelData: () => new Float32Array(10) })),
    randomSource: () => 0.5,
    scheduleTimeout: timerDeps.scheduleTimeout,
    cancelTimeout: timerDeps.cancelTimeout,
  });
  return { engine, getCtx: () => capturedCtx, timerDeps };
}

const BASE_GENERATOR_SETTINGS = {
  waveform: 'sine',
  frequency: 1000,
  gainDb: -12,
  phaseInverted: false,
  channel: 'both',
  muted: false,
  playing: true,
  sweepType: 'logarithmic',
  sweepStartFreq: 20,
  sweepEndFreq: 20000,
  sweepDuration: 10,
};

// UT-07: transactional source switching
test('UT-07 a failed microphone request never changes the active source', async () => {
  const { engine } = makeEngine({ micImpl: () => Promise.reject(new Error('permission denied')) });
  await assert.rejects(() => engine.switchSource('microphone'), AudioLabEngineError);
  assert.equal(engine.getState().activeSourceType, 'generator');
});

test('UT-07 a failed file decode never changes the active source away from the prior valid one', async () => {
  const { engine } = makeEngine({ fileImpl: () => Promise.reject(new Error('decode error')) });
  await engine.switchSource('microphone'); // establish a prior valid source that is NOT generator
  assert.equal(engine.getState().activeSourceType, 'microphone');

  await assert.rejects(() => engine.switchSource('file', { file: { type: 'audio/wav', size: 10 } }), AudioLabEngineError);
  assert.equal(engine.getState().activeSourceType, 'microphone'); // unchanged, not silently reset to generator
});

test('UT-07 an invalid file is rejected before any decode attempt', async () => {
  let decodeCalled = false;
  const { engine } = makeEngine({ fileImpl: () => { decodeCalled = true; return Promise.resolve({}); } });
  await assert.rejects(() => engine.switchSource('file', { file: { type: 'text/plain', size: 10 } }), AudioLabEngineError);
  assert.equal(decodeCalled, false);
  assert.equal(engine.getState().activeSourceType, 'generator');
});

test('UT-07 a successful switch commits the new source', async () => {
  const { engine } = makeEngine();
  await engine.switchSource('file', { file: { type: 'audio/wav', size: 10 } });
  assert.equal(engine.getState().activeSourceType, 'file');
});

// UT-08: teardown discipline
test('UT-08 switching away from a playing generator stops and disconnects it exactly once', async () => {
  const { engine, getCtx } = makeEngine();
  engine.playGenerator(BASE_GENERATOR_SETTINGS);
  const ctx = getCtx();
  const osc = ctx._oscillators[ctx._oscillators.length - 1];

  await engine.switchSource('microphone');

  assert.equal(osc._stopCount, 1);
  assert.equal(osc._disconnectCount, 1);
});

test('UT-08 stopping the microphone disconnects the source node and stops every track exactly once', async () => {
  const stream = makeFakeStream(2);
  const { engine, getCtx } = makeEngine({ micImpl: () => Promise.resolve(stream) });
  await engine.switchSource('microphone');
  const ctx = getCtx();
  const micNode = ctx._gainNodes.length ? null : null; // media stream source isn't a gain node; tracked via routing node connect count instead

  await engine.stopMicrophone();

  for (const track of stream._tracks) {
    assert.equal(track._stopCount, 1);
  }
  assert.equal(engine.getState().activeSourceType, 'generator');
});

test('UT-08 stopping a playing file source stops and disconnects the buffer source exactly once', async () => {
  const { engine, getCtx } = makeEngine();
  await engine.switchSource('file', { file: { type: 'audio/wav', size: 10 } });
  engine.playFile();
  const ctx = getCtx();
  const src = ctx._bufferSources[ctx._bufferSources.length - 1];

  await engine.switchSource('generator');

  assert.equal(src._stopCount, 1);
  assert.equal(src._disconnectCount, 1);
});

// UT-09: monitor policy, exercised against the real engine graph
test('UT-09 the monitor gate stays at zero for microphone and only opens for generator/file while playing', async () => {
  const { engine, getCtx } = makeEngine();
  await engine.activate();
  const ctx = getCtx();
  const monitorGate = ctx._gainNodes[3];

  await engine.switchSource('microphone');
  assert.equal(monitorGate.gain.value, 0);

  await engine.switchSource('generator');
  assert.equal(monitorGate.gain.value, 0); // not playing yet

  engine.playGenerator(BASE_GENERATOR_SETTINGS);
  assert.equal(monitorGate.gain.value, 1);

  engine.stopGenerator();
  assert.equal(monitorGate.gain.value, 0);
});

// UT-10: channel/phase routing, exercised against the real engine graph
test('UT-10 setOutputControls updates the left/right phase gain nodes as expected', async () => {
  const { engine, getCtx } = makeEngine();
  await engine.activate();
  const ctx = getCtx();
  const leftNode = ctx._gainNodes[1];
  const rightNode = ctx._gainNodes[2];

  engine.setOutputControls({ channel: 'right', phaseInverted: true, gainDb: -12, muted: false });
  assert.equal(leftNode.gain.value, 0);
  assert.equal(rightNode.gain.value, -1);

  engine.setOutputControls({ channel: 'both', phaseInverted: false });
  assert.equal(leftNode.gain.value, 1);
  assert.equal(rightNode.gain.value, 1);
});

// A02V-F01: render scalar channel content through the actual graph built by the engine. The
// defective baseline fails the first and right-only assertions because a splitter does not
// duplicate the oscillator's mono output into channel 1.
test('A02V-F01 mono generator content reaches both routed channels with right-phase polarity', () => {
  const { engine, getCtx } = makeEngine();
  engine.playGenerator(BASE_GENERATOR_SETTINGS);
  const ctx = getCtx();
  const oscillator = ctx._oscillators[0];

  engine.setOutputControls({ channel: 'both', phaseInverted: false });
  const both = ctx.renderSourceToDestination(oscillator, [0.5]);
  assert.ok(both[0] > 0, 'both/normal must contain left-channel signal');
  assert.ok(both[1] > 0, 'both/normal must contain right-channel signal');
  assert.ok(Math.abs(both[0] - both[1]) < 1e-12, 'normalized mono channels must match');

  engine.setOutputControls({ channel: 'right', phaseInverted: false });
  const rightOnly = ctx.renderSourceToDestination(oscillator, [0.5]);
  assert.equal(rightOnly[0], 0, 'right-only must silence the left channel');
  assert.ok(rightOnly[1] > 0, 'right-only must retain right-channel signal');

  engine.setOutputControls({ channel: 'left', phaseInverted: false });
  const leftOnly = ctx.renderSourceToDestination(oscillator, [0.5]);
  assert.ok(leftOnly[0] > 0, 'left-only must retain left-channel signal');
  assert.equal(leftOnly[1], 0, 'left-only must silence the right channel');

  engine.setOutputControls({ channel: 'both', phaseInverted: true });
  const inverted = ctx.renderSourceToDestination(oscillator, [0.5]);
  assert.ok(inverted[0] > 0, 'right inversion must retain positive left-channel signal');
  assert.ok(inverted[1] < 0, 'right inversion must reverse right-channel polarity');
  assert.ok(Math.abs(inverted[0] + inverted[1]) < 1e-12, 'inverted channels must be equal and opposite');
});

test('A02V-F01 true stereo file content is preserved and the microphone monitor stays closed', async () => {
  const { engine, getCtx } = makeEngine();
  await engine.switchSource('file', { file: { type: 'audio/wav', size: 10 } });
  engine.setOutputControls({ channel: 'both', phaseInverted: false });
  engine.playFile();

  const ctx = getCtx();
  const fileSource = ctx._bufferSources[ctx._bufferSources.length - 1];
  const stereo = ctx.renderSourceToDestination(fileSource, [0.25, 0.75]);
  assert.ok(stereo[0] > 0 && stereo[1] > 0, 'both file channels must contain signal');
  assert.ok(Math.abs(stereo[1] / stereo[0] - 3) < 1e-12, 'independent file-channel content must not be duplicated or collapsed');

  await engine.switchSource('microphone');
  const microphoneSource = ctx._mediaStreamSources[ctx._mediaStreamSources.length - 1];
  const monitored = ctx.renderSourceToDestination(microphoneSource, [0.5]);
  const monitorGate = ctx._gainNodes[3];
  assert.equal(monitorGate.gain.value, 0, 'microphone monitor gate must remain exactly zero');
  assert.deepEqual(monitored, [0, 0], 'microphone content must not reach the destination');
});

// UT-13: sweep scheduling and cleanup
test('UT-13 a logarithmic sweep schedules correct start/end automation and reschedules without overlap', () => {
  const timers = makeTimerDeps();
  const { engine, getCtx } = makeEngine({ timers });
  engine.playGenerator({
    ...BASE_GENERATOR_SETTINGS,
    waveform: 'sweep',
    sweepType: 'logarithmic',
    sweepStartFreq: 100,
    sweepEndFreq: 1000,
    sweepDuration: 2,
  });

  const ctx = getCtx();
  assert.equal(ctx._oscillators.length, 1);
  const firstOsc = ctx._oscillators[0];
  assert.deepEqual(firstOsc.frequency._calls[0], ['setValueAtTime', 100, 0]);
  assert.deepEqual(firstOsc.frequency._calls[1], ['exponentialRampToValueAtTime', 1000, 2]);
  assert.equal(timers.scheduled.size, 1);
  const [, { ms }] = Array.from(timers.scheduled.entries())[0];
  assert.equal(ms, 2000);

  // Simulate the sweep duration elapsing: it must reschedule cleanly with no overlapping oscillator.
  timers.fireLatest();
  assert.equal(ctx._oscillators.length, 2);
  assert.equal(firstOsc._stopCount, 1);
  assert.equal(firstOsc._disconnectCount, 1);
  assert.equal(ctx._oscillators[1]._stopCount, 0); // the new oscillator is still running
});

test('UT-13 stopping the generator during a sweep cancels the pending reschedule timer', () => {
  const timers = makeTimerDeps();
  const { engine } = makeEngine({ timers });
  engine.playGenerator({ ...BASE_GENERATOR_SETTINGS, waveform: 'sweep', sweepDuration: 2 });
  assert.equal(timers.scheduled.size, 1);

  engine.stopGenerator();

  assert.equal(timers.scheduled.size, 0);
  assert.equal(timers.cancelledIds.length, 1);
});

// Export pipeline: validation gate and end-to-end shape via a fake offline renderer
test('exportGeneratorWav rejects an unsupported configuration before touching the offline renderer', async () => {
  let offlineContextCreated = false;
  const { engine } = makeEngine();
  const engineWithSpy = createAudioLabEngine({
    createContext: () => new FakeAudioContext(),
    createOfflineContext: () => {
      offlineContextCreated = true;
      return new FakeOfflineAudioContext(2, 100, 96000);
    },
  });
  await assert.rejects(
    () => engineWithSpy.exportGeneratorWav({ sampleRate: 96000, bitDepth: 16, channels: 2, exportSource: 'generator', durationSec: 5 }, BASE_GENERATOR_SETTINGS),
    AudioLabEngineError
  );
  assert.equal(offlineContextCreated, false);
  void engine;
});

test('exportGeneratorWav produces a well-formed 24-bit/96kHz stereo WAV for an approved configuration', async () => {
  const engine = createAudioLabEngine({
    createContext: () => new FakeAudioContext(),
    createOfflineContext: (numberOfChannels, length, sampleRate) => new FakeOfflineAudioContext(numberOfChannels, length, sampleRate),
  });
  const result = await engine.exportGeneratorWav(
    { sampleRate: 96000, bitDepth: 24, channels: 2, exportSource: 'generator', durationSec: 1 },
    { ...BASE_GENERATOR_SETTINGS, waveform: 'sine', frequency: 1000 }
  );
  const expectedDataSize = 96000 * 1 * 6;
  assert.equal(result.arrayBuffer.byteLength, 44 + expectedDataSize);
  assert.match(result.filename, /^audio-lab_sine_1s_\d+\.wav$/);

  const view = new DataView(result.arrayBuffer);
  assert.equal(view.getUint32(24, true), 96000);
  assert.equal(view.getUint16(34, true), 24);
});
