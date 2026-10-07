// Original procedural soundscape. Audio is created only after a user gesture
// calls start(); every sound is synthesized locally with Web Audio.
const ROOM_SOUND = {
  boxRoom: { wave: "triangle", hz: 92, filter: 320, noise: 0.09, tone: 0.22 },
  jarRoom: { wave: "sine", hz: 196, filter: 1150, noise: 0.06, tone: 0.18 },
  pencilRoom: {
    wave: "triangle",
    hz: 147,
    filter: 520,
    noise: 0.07,
    tone: 0.18,
  },
  matchRoom: { wave: "sine", hz: 110, filter: 760, noise: 0.05, tone: 0.16 },
  spoolRoom: { wave: "sine", hz: 174, filter: 1800, noise: 0.06, tone: 0.13 },
  fiberRoom: {
    wave: "triangle",
    hz: 233,
    filter: 2400,
    noise: 0.08,
    tone: 0.1,
  },
  dustRoom: { wave: "sine", hz: 311, filter: 3200, noise: 0.05, tone: 0.08 },
  atomicRoom: { wave: "sine", hz: 392, filter: 5200, noise: 0.035, tone: 0.08 },
};

const CUES = {
  footsteps: { hz: 84, endHz: 58, seconds: 0.14, wave: "sine", level: 0.42 },
  "broken-glass": {
    hz: 720,
    endHz: 510,
    seconds: 0.3,
    wave: "triangle",
    level: 0.27,
  },
  "ladder-over-rim": {
    hz: 310,
    endHz: 205,
    seconds: 0.22,
    wave: "triangle",
    level: 0.3,
  },
  "open-drawer": {
    hz: 190,
    endHz: 115,
    seconds: 0.28,
    wave: "sawtooth",
    level: 0.16,
  },
  "spool-bore": {
    hz: 250,
    endHz: 140,
    seconds: 0.26,
    wave: "sine",
    level: 0.23,
  },
  "split-fiber": {
    hz: 980,
    endHz: 620,
    seconds: 0.18,
    wave: "triangle",
    level: 0.17,
  },
  "dust-cleft": {
    hz: 510,
    endHz: 360,
    seconds: 0.2,
    wave: "sine",
    level: 0.13,
  },
  "crystal-split": {
    hz: 1250,
    endHz: 740,
    seconds: 0.34,
    wave: "sine",
    level: 0.2,
  },
  "orange-return": {
    hz: 660,
    endHz: 880,
    seconds: 0.48,
    wave: "sine",
    level: 0.3,
  },
  drop: { hz: 420, endHz: 95, seconds: 0.28, wave: "sine", level: 0.25 },
  grab: { hz: 155, endHz: 245, seconds: 0.12, wave: "triangle", level: 0.19 },
  sigh: { hz: 220, endHz: 165, seconds: 0.72, wave: "sine", level: 0.13 },
};

// Ian's 8-bar loop (about 119 BPM, played live, so the bar lengths drift a little): one take from
// its first note to 16.1 s. It is near-silent in the museum and gets louder with every shrink.
const LOOP_URL = new URL("./assets/lilbf-loop.mp3", import.meta.url).href;
const LOOP_SECONDS = 16.1;
const MUSIC_ROOMS = ["gallery", "boxRoom", "jarRoom", "pencilRoom", "matchRoom", "spoolRoom", "fiberRoom", "atomicRoom"];
const MUSIC_QUIET = 0.04;
const MUSIC_LOUD = 0.55;
function musicLevel(id) {
  const step = Math.max(0, MUSIC_ROOMS.indexOf(id));
  return MUSIC_QUIET + ((MUSIC_LOUD - MUSIC_QUIET) * step) / (MUSIC_ROOMS.length - 1);
}

function ramp(param, value, now, seconds = 0.08) {
  param.cancelScheduledValues(now);
  param.setValueAtTime(param.value, now);
  param.linearRampToValueAtTime(value, now + seconds);
}

export function createSoundscape() {
  let context = null;
  let master = null;
  let noiseBuffer = null;
  let rooms = null;
  let currentRoom = "boxRoom";
  let musicRoom = "gallery";
  let music = null;
  let muted = false;
  let paused = false;
  let disposed = false;

  function outputLevel() {
    if (!context || !master) return;
    ramp(master.gain, muted || paused ? 0 : 0.03, context.currentTime, 0.04);
    if (music) ramp(music.gain.gain, muted || paused ? 0 : musicLevel(musicRoom), context.currentTime, muted || paused ? 0.04 : 1.2);
  }

  async function startMusic() {
    try {
      const data = await (await fetch(LOOP_URL)).arrayBuffer();
      const buffer = await context.decodeAudioData(data);
      if (disposed || music) return;
      // Decoders pad the start by different amounts, so find the first note in the samples.
      const ch = buffer.getChannelData(0);
      let first = 0;
      while (first < ch.length && Math.abs(ch[first]) < 0.01) first += 1;
      const source = context.createBufferSource();
      const gain = context.createGain();
      source.buffer = buffer;
      source.loop = true;
      source.loopStart = first / buffer.sampleRate;
      source.loopEnd = Math.min(buffer.duration, source.loopStart + LOOP_SECONDS);
      gain.gain.value = 0;
      source.connect(gain);
      gain.connect(context.destination);
      source.start(0, source.loopStart);
      music = { source, gain };
      outputLevel();
    } catch {
      /* the game still plays without music */
    }
  }

  function setRoom(id) {
    if (ROOM_SOUND[id]) currentRoom = id;
    if (MUSIC_ROOMS.includes(id)) musicRoom = id;
    outputLevel();
    if (!context || !rooms) return;
    const now = context.currentTime;
    for (const [key, layer] of Object.entries(rooms)) {
      ramp(layer.gain.gain, key === currentRoom ? 0.62 : 0, now, 0.7);
    }
  }

  async function start() {
    if (disposed) return false;
    if (!context) {
      const AudioContextClass =
        globalThis.AudioContext || globalThis.webkitAudioContext;
      if (!AudioContextClass) return false;
      try {
        context = new AudioContextClass();
        master = context.createGain();
        master.gain.value = 0;
        master.connect(context.destination);

        const buffer = context.createBuffer(
          1,
          context.sampleRate,
          context.sampleRate,
        );
        const data = buffer.getChannelData(0);
        for (let i = 0; i < data.length; i += 1)
          data[i] = Math.random() * 2 - 1;
        noiseBuffer = buffer;
        rooms = {};
        for (const [id, spec] of Object.entries(ROOM_SOUND)) {
          const gain = context.createGain();
          gain.gain.value = 0;
          gain.connect(master);

          const oscillator = context.createOscillator();
          const toneGain = context.createGain();
          oscillator.type = spec.wave;
          oscillator.frequency.value = spec.hz;
          toneGain.gain.value = spec.tone;
          oscillator.connect(toneGain);
          toneGain.connect(gain);
          oscillator.start();

          const source = context.createBufferSource();
          const filter = context.createBiquadFilter();
          const noiseGain = context.createGain();
          source.buffer = noiseBuffer;
          source.loop = true;
          filter.type = "lowpass";
          filter.frequency.value = spec.filter;
          filter.Q.value = 0.55;
          noiseGain.gain.value = spec.noise;
          source.connect(filter);
          filter.connect(noiseGain);
          noiseGain.connect(gain);
          source.start();
          rooms[id] = { gain, oscillator, toneGain, source, filter, noiseGain };
        }
        setRoom(musicRoom);
        startMusic();
      } catch {
        if (context) {
          try {
            await context.close();
          } catch {
            /* blocked or unavailable */
          }
        }
        context = master = rooms = null;
        return false;
      }
    }

    try {
      if (context.state !== "running") await context.resume();
      setRoom(musicRoom);
      outputLevel();
      return context.state === "running";
    } catch {
      return false;
    }
  }

  function cue(kind) {
    if (!context || !master || !CUES[kind] || disposed) return false;
    const spec = CUES[kind];
    const now = context.currentTime;
    const duration = spec.seconds;
    const oscillator = context.createOscillator();
    const envelope = context.createGain();
    oscillator.type = spec.wave;
    oscillator.frequency.setValueAtTime(spec.hz, now);
    oscillator.frequency.exponentialRampToValueAtTime(
      Math.max(25, spec.endHz),
      now + duration,
    );
    envelope.gain.setValueAtTime(0.0001, now);
    envelope.gain.linearRampToValueAtTime(
      spec.level,
      now + Math.min(0.025, duration * 0.2),
    );
    envelope.gain.exponentialRampToValueAtTime(0.0001, now + duration);
    oscillator.connect(envelope);
    envelope.connect(master);
    oscillator.start(now);
    oscillator.stop(now + duration + 0.01);
    return true;
  }

  function setPaused(value) {
    paused = Boolean(value);
    outputLevel();
  }

  function setMuted(value) {
    muted = Boolean(value);
    outputLevel();
  }

  function dispose() {
    if (disposed) return;
    disposed = true;
    if (context) {
      try {
        context.close();
      } catch {
        /* ignore teardown failures */
      }
    }
    context = master = rooms = noiseBuffer = music = null;
  }

  return { start, setRoom, cue, setPaused, setMuted, dispose };
}
