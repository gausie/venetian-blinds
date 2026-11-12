let audio: AudioContext | undefined;

/** Knuckle on brick: a low thud with a gritty click */
function rap(ctx: AudioContext, at: number) {
  const thud = ctx.createOscillator();
  thud.frequency.setValueAtTime(140, at);
  thud.frequency.exponentialRampToValueAtTime(60, at + 0.08);
  const thudGain = ctx.createGain();
  thudGain.gain.setValueAtTime(0.8, at);
  thudGain.gain.exponentialRampToValueAtTime(0.001, at + 0.12);
  thud.connect(thudGain).connect(ctx.destination);
  thud.start(at);
  thud.stop(at + 0.12);

  const length = Math.floor(ctx.sampleRate * 0.03);
  const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < length; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / length) ** 2;
  const click = ctx.createBufferSource();
  click.buffer = buffer;
  const filter = ctx.createBiquadFilter();
  filter.type = "lowpass";
  filter.frequency.value = 1800;
  const clickGain = ctx.createGain();
  clickGain.gain.value = 0.5;
  click.connect(filter).connect(clickGain).connect(ctx.destination);
  click.start(at);
}

/** Browsers only allow audio to start from a user gesture, so call this from one */
export function unlockAudio() {
  audio ??= new AudioContext();
  if (audio.state === "suspended") void audio.resume();
  return audio;
}

// iOS only counts some gestures, like a touch ending, so try on every kind until it takes
for (const gesture of ["pointerdown", "pointerup", "touchend", "click", "keydown"]) {
  addEventListener(gesture, function unlock() {
    if (unlockAudio().state === "running") removeEventListener(gesture, unlock);
  });
}

/** Fingertip on glass: a faint high tick */
function tap(ctx: AudioContext, at: number) {
  const tone = ctx.createOscillator();
  tone.type = "triangle";
  tone.frequency.setValueAtTime(2400, at);
  tone.frequency.exponentialRampToValueAtTime(1600, at + 0.03);
  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0.12, at);
  gain.gain.exponentialRampToValueAtTime(0.001, at + 0.05);
  tone.connect(gain).connect(ctx.destination);
  tone.start(at);
  tone.stop(at + 0.05);
}

/** Quiet taps at each of `times`, in seconds from now */
export function playTaps(times: readonly number[]) {
  const ctx = unlockAudio();
  const now = ctx.currentTime;
  for (const t of times) tap(ctx, now + t);
}

/** Raps at each of `times`, in seconds from now */
export function playKnock(times: readonly number[]) {
  const ctx = unlockAudio();
  const now = ctx.currentTime;
  for (const t of times) rap(ctx, now + t);
}

/** A rushing roar; `set` from 0 to 1 makes it louder and brighter */
export function startRush() {
  const ctx = unlockAudio();
  const buffer = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  // Brown noise rumbles rather than hisses
  let last = 0;
  for (let i = 0; i < data.length; i++) {
    last = (last + 0.02 * (Math.random() * 2 - 1)) / 1.02;
    data[i] = last * 3.5;
  }
  const noise = ctx.createBufferSource();
  noise.buffer = buffer;
  noise.loop = true;
  const filter = ctx.createBiquadFilter();
  filter.type = "lowpass";
  const gain = ctx.createGain();
  gain.gain.value = 0;
  noise.connect(filter).connect(gain).connect(ctx.destination);
  noise.start();
  return {
    set(level: number) {
      const at = ctx.currentTime + 0.05;
      filter.frequency.linearRampToValueAtTime(200 + 4000 * level ** 2, at);
      gain.gain.linearRampToValueAtTime(1.5 * level ** 2, at);
    },
    stop() {
      noise.stop();
      noise.disconnect();
    },
  };
}

/** Filtered noise, dying away */
function burst(
  ctx: AudioContext,
  at: number,
  { length, type, frequency, peak }: { length: number; type: BiquadFilterType; frequency: number; peak: number },
) {
  const buffer = ctx.createBuffer(1, Math.ceil(ctx.sampleRate * length), ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
  const source = ctx.createBufferSource();
  source.buffer = buffer;
  const filter = ctx.createBiquadFilter();
  filter.type = type;
  filter.frequency.value = frequency;
  const gain = ctx.createGain();
  gain.gain.setValueAtTime(peak, at);
  gain.gain.exponentialRampToValueAtTime(0.001, at + length);
  source.connect(filter).connect(gain).connect(ctx.destination);
  source.start(at);
}

/** Glass breaking, a shriek and a roar */
export function playScare() {
  const ctx = unlockAudio();
  const now = ctx.currentTime;
  burst(ctx, now, { length: 0.3, type: "highpass", frequency: 4000, peak: 1.2 });
  for (const t of [0.08, 0.15, 0.21, 0.3, 0.38]) {
    burst(ctx, now + t, { length: 0.05, type: "bandpass", frequency: 6000, peak: 0.4 });
  }
  burst(ctx, now, { length: 0.6, type: "bandpass", frequency: 2500, peak: 1.2 });
  burst(ctx, now, { length: 0.8, type: "lowpass", frequency: 300, peak: 1.5 });
  const shriek = ctx.createOscillator();
  shriek.type = "sawtooth";
  shriek.frequency.setValueAtTime(900, now);
  shriek.frequency.exponentialRampToValueAtTime(300, now + 0.5);
  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0.4, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.6);
  shriek.connect(gain).connect(ctx.destination);
  shriek.start(now);
  shriek.stop(now + 0.6);
}

/** A wet squelch, then bones giving way */
export function playSquelch() {
  const ctx = unlockAudio();
  const now = ctx.currentTime;
  // A heavy blow first, so it lands harder than anything before it
  const thump = ctx.createOscillator();
  thump.frequency.setValueAtTime(110, now);
  thump.frequency.exponentialRampToValueAtTime(35, now + 0.25);
  const gain = ctx.createGain();
  gain.gain.setValueAtTime(2.5, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
  thump.connect(gain).connect(ctx.destination);
  thump.start(now);
  thump.stop(now + 0.35);

  burst(ctx, now, { length: 0.6, type: "lowpass", frequency: 600, peak: 3.5 });
  burst(ctx, now + 0.05, { length: 0.35, type: "bandpass", frequency: 800, peak: 2.2 });
  for (const t of [0.12, 0.2, 0.26, 0.4]) {
    burst(ctx, now + t, { length: 0.05, type: "highpass", frequency: 1500, peak: 3 });
  }
}

/** Wet snuffling, close by */
export function playSniff() {
  const ctx = unlockAudio();
  const now = ctx.currentTime;
  for (const t of [0, 0.16, 0.3]) {
    const length = 0.12;
    const buffer = ctx.createBuffer(1, Math.ceil(ctx.sampleRate * length), ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    const filter = ctx.createBiquadFilter();
    filter.type = "bandpass";
    filter.Q.value = 2;
    filter.frequency.setValueAtTime(400, now + t);
    filter.frequency.linearRampToValueAtTime(1300, now + t + length);
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.001, now + t);
    gain.gain.exponentialRampToValueAtTime(0.9, now + t + length * 0.7);
    gain.gain.exponentialRampToValueAtTime(0.001, now + t + length);
    source.connect(filter).connect(gain).connect(ctx.destination);
    source.start(now + t);
  }
}

/** Hard-clips into grit; `amount` from 0 (clean) up */
function distortion(ctx: AudioContext, amount: number) {
  const shaper = ctx.createWaveShaper();
  const curve = new Float32Array(1024);
  for (let i = 0; i < curve.length; i++) {
    const x = (i / (curve.length - 1)) * 2 - 1;
    curve[i] = ((1 + amount) * x) / (1 + amount * Math.abs(x));
  }
  shaper.curve = curve;
  return shaper;
}

/** A dead, rasping groan: a sagging "uhhh" from a throat that shouldn't still work */
export function playGroan() {
  const ctx = unlockAudio();
  const now = ctx.currentTime;
  const length = 2.2;
  const end = now + length;

  const throat = ctx.createGain();
  // Two voices, slightly apart, so it sounds thick and wrong
  for (const detune of [1, 1.03]) {
    const voice = ctx.createOscillator();
    voice.type = "sawtooth";
    voice.frequency.setValueAtTime(58 * detune, now);
    voice.frequency.linearRampToValueAtTime(66 * detune, now + 0.5);
    voice.frequency.exponentialRampToValueAtTime(36 * detune, end);
    voice.connect(throat);
    voice.start(now);
    voice.stop(end);
  }
  // A rattle in the throat: noise chopped up fast
  const rattle = ctx.createBufferSource();
  const buffer = ctx.createBuffer(1, Math.ceil(ctx.sampleRate * length), ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < data.length; i++) {
    const chop = Math.sin((i / ctx.sampleRate) * Math.PI * 2 * 14) > 0 ? 1 : 0.1;
    data[i] = (Math.random() * 2 - 1) * chop * 0.6;
  }
  rattle.buffer = buffer;
  rattle.connect(throat);
  rattle.start(now);

  // Formants for a slack-jawed "uh"
  const mouth = ctx.createGain();
  for (const [frequency, q] of [
    [320, 4],
    [620, 6],
  ] as const) {
    const formant = ctx.createBiquadFilter();
    formant.type = "bandpass";
    formant.frequency.value = frequency;
    formant.Q.value = q;
    throat.connect(formant).connect(mouth);
  }
  // A rumble under it all, felt as much as heard
  const sub = ctx.createOscillator();
  sub.type = "triangle";
  sub.frequency.setValueAtTime(30, now);
  sub.frequency.exponentialRampToValueAtTime(22, end);
  sub.connect(mouth);
  sub.start(now);
  sub.stop(end);

  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0.001, now);
  gain.gain.exponentialRampToValueAtTime(1.6, now + 0.3);
  gain.gain.setValueAtTime(1.6, now + length * 0.5);
  gain.gain.exponentialRampToValueAtTime(0.001, end);
  mouth.connect(distortion(ctx, 8)).connect(gain).connect(ctx.destination);
}

/** A wet mouthful; `force` from 0 to 1 */
export function playChew(force: number) {
  const ctx = unlockAudio();
  const now = ctx.currentTime;
  // Flesh tearing, then a wet slap of the jaw
  burst(ctx, now, { length: 0.25, type: "bandpass", frequency: 300 + 200 * Math.random(), peak: 0.8 + 0.8 * force });
  burst(ctx, now + 0.08, { length: 0.15, type: "lowpass", frequency: 220, peak: 0.9 * force + 0.3 });
  burst(ctx, now + 0.12, { length: 0.12, type: "bandpass", frequency: 900 + 600 * Math.random(), peak: 0.4 * force });
  if (Math.random() < force * 0.6)
    burst(ctx, now + 0.14, { length: 0.03, type: "highpass", frequency: 1500, peak: 0.9 });
}
