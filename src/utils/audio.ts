let audioCtx: AudioContext | null = null;
let noiseNode: AudioBufferSourceNode | null = null;
let noiseGain: GainNode | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  const Ctx = window.AudioContext || (window as unknown as {webkitAudioContext?: typeof AudioContext}).webkitAudioContext;
  if (!Ctx) return null;
  if (!audioCtx) {
    audioCtx = new Ctx();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume().catch(() => {});
  }
  return audioCtx;
}

export function playCompletionChime(): void {
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  const notes = [523.25, 659.25, 783.99]; // C5 -> E5 -> G5 soft harmonic triad

  notes.forEach((freq, idx) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, now + idx * 0.14);

    gain.gain.setValueAtTime(0.0001, now + idx * 0.14);
    gain.gain.exponentialRampToValueAtTime(0.12, now + idx * 0.14 + 0.04);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.14 + 0.9);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now + idx * 0.14);
    osc.stop(now + idx * 0.14 + 0.95);
  });
}

export function startAmbientFocusNoise(): boolean {
  const ctx = getAudioContext();
  if (!ctx) return false;
  stopAmbientFocusNoise();

  const bufferSize = ctx.sampleRate * 3;
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const output = buffer.getChannelData(0);

  // Smooth brown-noise generator for calm deep-work acoustics
  let lastOut = 0;
  for (let i = 0; i < bufferSize; i++) {
    const white = Math.random() * 2 - 1;
    output[i] = (lastOut + 0.02 * white) / 1.02;
    lastOut = output[i];
    output[i] *= 2.8;
  }

  const source = ctx.createBufferSource();
  source.buffer = buffer;
  source.loop = true;

  const filter = ctx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.value = 420;

  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0.001, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.08, ctx.currentTime + 0.6);

  source.connect(filter);
  filter.connect(gain);
  gain.connect(ctx.destination);
  source.start();

  noiseNode = source;
  noiseGain = gain;
  return true;
}

export function stopAmbientFocusNoise(): void {
  if (noiseGain && audioCtx) {
    try {
      noiseGain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 0.15);
    } catch {
      // ignore
    }
  }
  if (noiseNode) {
    const node = noiseNode;
    setTimeout(() => {
      try {
        node.stop();
        node.disconnect();
      } catch {
        // ignore
      }
    }, 180);
  }
  noiseNode = null;
  noiseGain = null;
}
