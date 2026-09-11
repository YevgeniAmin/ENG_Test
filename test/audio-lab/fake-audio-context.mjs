// Minimal Web Audio test doubles: only the node surface audio-lab-engine.js actually calls.

function makeAudioParam(initial = 0) {
  const calls = [];
  const param = {
    value: initial,
    setValueAtTime(v, t) {
      param.value = v;
      calls.push(['setValueAtTime', v, t]);
      return param;
    },
    setTargetAtTime(v, t, tc) {
      param.value = v;
      calls.push(['setTargetAtTime', v, t, tc]);
      return param;
    },
    linearRampToValueAtTime(v, t) {
      param.value = v;
      calls.push(['linearRampToValueAtTime', v, t]);
      return param;
    },
    exponentialRampToValueAtTime(v, t) {
      param.value = v;
      calls.push(['exponentialRampToValueAtTime', v, t]);
      return param;
    },
    cancelScheduledValues() {
      return param;
    },
    _calls: calls,
  };
  return param;
}

function connectNode(node, destination, output = 0, input = 0) {
  node._connectCount++;
  node._connections.push({ destination, output, input });
  if (destination && typeof destination === 'object') {
    destination._incoming ||= [];
    destination._incoming.push({ source: node, output, input });
  }
  return destination;
}

function makeGainNode() {
  const node = {
    _kind: 'gain',
    gain: makeAudioParam(1),
    _connectCount: 0,
    _disconnectCount: 0,
    _connections: [],
    _incoming: [],
    connect(destination, output, input) {
      return connectNode(node, destination, output, input);
    },
    disconnect() {
      node._disconnectCount++;
    },
  };
  return node;
}

function makeOscillatorNode() {
  const node = {
    _kind: 'source',
    type: 'sine',
    frequency: makeAudioParam(440),
    _connectCount: 0,
    _disconnectCount: 0,
    _startCount: 0,
    _stopCount: 0,
    _connections: [],
    connect(destination, output, input) {
      return connectNode(node, destination, output, input);
    },
    disconnect() {
      node._disconnectCount++;
    },
    start() {
      node._startCount++;
    },
    stop() {
      node._stopCount++;
    },
  };
  return node;
}

function makeBufferSourceNode() {
  const node = {
    _kind: 'source',
    buffer: null,
    loop: false,
    _connectCount: 0,
    _disconnectCount: 0,
    _startCount: 0,
    _stopCount: 0,
    _connections: [],
    connect(destination, output, input) {
      return connectNode(node, destination, output, input);
    },
    disconnect() {
      node._disconnectCount++;
    },
    start() {
      node._startCount++;
    },
    stop() {
      node._stopCount++;
    },
  };
  return node;
}

function makeRoutingNode(kind = 'passthrough', numberOfInputs = 1) {
  const node = {
    _kind: kind,
    _numberOfInputs: numberOfInputs,
    _connectCount: 0,
    _disconnectCount: 0,
    _connections: [],
    _incoming: [],
    connect(destination, output, input) {
      return connectNode(node, destination, output, input);
    },
    disconnect() {
      node._disconnectCount++;
    },
  };
  return node;
}

function makeAnalyserNode() {
  const node = {
    _kind: 'passthrough',
    fftSize: 2048,
    smoothingTimeConstant: 0,
    _connectCount: 0,
    _disconnectCount: 0,
    _connections: [],
    _incoming: [],
    get frequencyBinCount() {
      return node.fftSize / 2;
    },
    getFloatFrequencyData() {},
    getByteFrequencyData() {},
    connect(destination, output, input) {
      return connectNode(node, destination, output, input);
    },
    disconnect() {
      node._disconnectCount++;
    },
  };
  return node;
}

function addChannels(channelSets) {
  const width = Math.max(1, ...channelSets.map((channels) => channels.length));
  const result = Array.from({ length: width }, () => 0);
  for (const channels of channelSets) {
    for (let channel = 0; channel < channels.length; channel++) result[channel] += channels[channel];
  }
  return result;
}

// Propagates one scalar sample per channel through the graph that the real engine built. This
// intentionally models only the node kinds used by the routing regression; it is not an audio
// renderer or a second implementation of the engine.
function renderNode(node, sourceSignals, cache) {
  if (cache.has(node)) return cache.get(node);
  if (sourceSignals.has(node)) return sourceSignals.get(node).slice();

  const outputForConnection = ({ source, output }) => {
    const channels = renderNode(source, sourceSignals, cache);
    return source._kind === 'splitter' ? [channels[output] || 0] : channels;
  };

  let channels;
  if (node._kind === 'merger') {
    channels = Array.from({ length: node._numberOfInputs }, (_, input) => {
      const inputs = (node._incoming || []).filter((connection) => connection.input === input).map(outputForConnection);
      return inputs.reduce((sum, values) => sum + (values[0] || 0), 0);
    });
  } else {
    channels = addChannels((node._incoming || []).map(outputForConnection));
    if (node._kind === 'gain') channels = channels.map((value) => value * node.gain.value);
  }

  cache.set(node, channels);
  return channels;
}

function makeAudioBuffer(numChannels, length, sampleRate) {
  const channels = Array.from({ length: numChannels }, () => new Float32Array(length));
  return {
    numberOfChannels: numChannels,
    length,
    sampleRate,
    getChannelData(i) {
      return channels[i];
    },
  };
}

export class FakeAudioContext {
  constructor({ sampleRate = 48000 } = {}) {
    this.sampleRate = sampleRate;
    this.state = 'suspended';
    this.currentTime = 0;
    this.destination = { _kind: 'destination', _incoming: [] };
    this._gainNodes = [];
    this._oscillators = [];
    this._bufferSources = [];
    this._mediaStreamSources = [];
  }
  createGain() {
    const node = makeGainNode();
    this._gainNodes.push(node);
    return node;
  }
  createOscillator() {
    const node = makeOscillatorNode();
    this._oscillators.push(node);
    return node;
  }
  createBufferSource() {
    const node = makeBufferSourceNode();
    this._bufferSources.push(node);
    return node;
  }
  createChannelSplitter() {
    return makeRoutingNode('splitter');
  }
  createChannelMerger(numberOfInputs = 2) {
    return makeRoutingNode('merger', numberOfInputs);
  }
  createAnalyser() {
    return makeAnalyserNode();
  }
  createMediaStreamSource() {
    const node = makeRoutingNode('source');
    this._mediaStreamSources.push(node);
    return node;
  }
  createBuffer(numChannels, length, sampleRate) {
    return makeAudioBuffer(numChannels, length, sampleRate);
  }
  async resume() {
    this.state = 'running';
    return this.state;
  }
  async suspend() {
    this.state = 'suspended';
    return this.state;
  }
  async close() {
    this.state = 'closed';
    return this.state;
  }
  renderSourceToDestination(source, channelSamples) {
    return renderNode(this.destination, new Map([[source, channelSamples]]), new Map());
  }
}

// Approximate offline renderer: enough to prove the export pipeline wires oscillators/buffers
// through to a correctly shaped, non-silent output. Bit-exact spectral/level correctness is a
// real-browser concern (BT-18, MT-01..MT-10), not a unit-test concern.
export class FakeOfflineAudioContext {
  constructor(numberOfChannels, length, sampleRate) {
    this.numberOfChannels = numberOfChannels;
    this.length = length;
    this.sampleRate = sampleRate;
    this.destination = {};
    this._sources = [];
  }
  createGain() {
    return makeGainNode();
  }
  createChannelSplitter() {
    return makeRoutingNode();
  }
  createChannelMerger() {
    return makeRoutingNode();
  }
  createOscillator() {
    const node = makeOscillatorNode();
    this._sources.push({ kind: 'oscillator', node });
    return node;
  }
  createBufferSource() {
    const node = makeBufferSourceNode();
    this._sources.push({ kind: 'buffer', node });
    return node;
  }
  createBuffer(numChannels, length, sampleRate) {
    return makeAudioBuffer(numChannels, length, sampleRate);
  }
  async startRendering() {
    const out = makeAudioBuffer(this.numberOfChannels, this.length, this.sampleRate);
    for (const { kind, node } of this._sources) {
      if (kind === 'oscillator') {
        const freq = node.frequency.value;
        for (let ch = 0; ch < this.numberOfChannels; ch++) {
          const data = out.getChannelData(ch);
          for (let i = 0; i < this.length; i++) {
            data[i] += Math.sin((2 * Math.PI * freq * i) / this.sampleRate) * 0.5;
          }
        }
      } else if (kind === 'buffer' && node.buffer) {
        for (let ch = 0; ch < this.numberOfChannels; ch++) {
          const data = out.getChannelData(ch);
          const src = node.buffer.getChannelData(Math.min(ch, node.buffer.numberOfChannels - 1));
          for (let i = 0; i < this.length && i < src.length; i++) data[i] += src[i];
        }
      }
    }
    return out;
  }
}

export function makeFakeStream(trackCount = 1) {
  const tracks = Array.from({ length: trackCount }, () => ({
    _stopCount: 0,
    stop() {
      this._stopCount++;
    },
  }));
  return { getTracks: () => tracks, _tracks: tracks };
}
