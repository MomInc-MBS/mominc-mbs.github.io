// Miniature Voice (web): Signalsmith Stretch (official WASM/AudioWorklet build, vendored) pitch-shifts the live mic.
// Port of Voice.kt VoiceMath + VoiceChain shape: wet/dry crossfade (50 ms), dry delayed by the DSP latency so toggling never jumps,
// -1 dBFS limiter, DSP failure => silence (never leaks the raw mic while voice is on).
export const VoiceMath = {
  OCT_MIN: 3, OCT_MAX: 6, OCT_DEFAULT: 4, SEMI_MIN: 3, SEMI_MAX: 6, SEMI_DEFAULT: 4, STEP: 0.25,
  snap: (x, mn, mx) => Math.round(Math.min(mx, Math.max(mn, x)) / 0.25) * 0.25,
  semitones: (speech, v) => (speech ? v : v * 12), // octave mode is exact: ratio 2^oct = 12*oct semitones
  ratio: (speech, v) => 2 ** (speech ? v / 12 : v),
  label: (speech, v) => speech
    ? `Speech-friendly +${v.toFixed(2)} st (x${(2 ** (v / 12)).toFixed(3)})`
    : `+${v.toFixed(2)} oct = +${Math.round(v * 12)} st (x${(2 ** v).toFixed(1)})`,
};

/** createVoice(ctx?) -> {ctx, input(node), out(node, pre-destination, for tests), stream (MediaStream with processed audio),
 *  attachStream(mediaStream), setEnabled(b), setParams({speech,value}), latencyMs, failed, enabled, resume(), dispose()} */
export async function createVoice(ctx = new (window.AudioContext || window.webkitAudioContext)({ sampleRate: 48000 })) {
  const input = ctx.createGain();
  const dry = ctx.createGain(), wet = ctx.createGain();
  const delay = ctx.createDelay(1);
  const lim = ctx.createDynamicsCompressor();
  lim.threshold.value = -1; lim.knee.value = 0; lim.ratio.value = 20; lim.attack.value = 0.001; lim.release.value = 0.05;
  const dest = ctx.createMediaStreamDestination();
  const v = { ctx, input, out: lim, stream: dest.stream, enabled: false, failed: false, latencyMs: 0, speech: false, value: VoiceMath.OCT_DEFAULT, srcNodes: [] };
  dry.gain.value = 1; wet.gain.value = 0;
  input.connect(delay); delay.connect(dry); dry.connect(lim);
  wet.connect(lim); lim.connect(dest);

  let stretch = null;
  try {
    const { default: SignalsmithStretch } = await import('./vendor/SignalsmithStretch.mjs');
    stretch = await SignalsmithStretch(ctx, { numberOfInputs: 1, numberOfOutputs: 1, outputChannelCount: [1] });
    stretch.configure({ blockMs: 64, intervalMs: 16 }); // 3072/768 @ 48 kHz, same as the native app
    const lat = await stretch.latency();
    v.latencyMs = lat * 1000;
    delay.delayTime.value = lat;
    input.connect(stretch); stretch.connect(wet);
    stretch.schedule({ active: true, semitones: VoiceMath.semitones(false, v.value) });
  } catch (e) {
    v.failed = true; v.error = String(e);
  }
  const fade = (p, to) => p.setTargetAtTime(to, ctx.currentTime, 0.05 / 3);
  const apply = () => {
    if (stretch) stretch.schedule({ active: true, semitones: VoiceMath.semitones(v.speech, v.value) });
    // failed DSP + voice on = silence (native behaviour); voice off = delayed dry mic
    fade(dry.gain, v.enabled ? 0 : 1); fade(wet.gain, v.enabled && !v.failed ? 1 : 0);
  };
  v.setEnabled = b => { v.enabled = !!b; apply(); };
  v.setParams = ({ speech = v.speech, value = v.value } = {}) => {
    v.speech = !!speech;
    const [mn, mx] = v.speech ? [VoiceMath.SEMI_MIN, VoiceMath.SEMI_MAX] : [VoiceMath.OCT_MIN, VoiceMath.OCT_MAX];
    v.value = VoiceMath.snap(value, mn, mx); apply();
  };
  v.attachStream = ms => { const n = ctx.createMediaStreamSource(ms); n.connect(input); v.srcNodes.push(n); return n; };
  v.resume = () => (ctx.state === 'running' ? Promise.resolve() : ctx.resume());
  v.dispose = () => { v.srcNodes.forEach(n => n.disconnect()); ctx.close(); };
  return v;
}
