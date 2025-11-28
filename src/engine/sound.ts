export type SoundEffect = 'click' | 'cash' | 'error' | 'wind';

let audioContext: AudioContext | null = null;
let isMuted = false;

const ensureContext = () => {
  if (typeof window === 'undefined' || typeof AudioContext === 'undefined') {
    return null;
  }

  if (!audioContext) {
    audioContext = new AudioContext();
  }

  return audioContext;
};

const playTone = (
  context: AudioContext,
  frequency: number,
  duration: number,
  type: OscillatorType = 'sine',
  volume = 0.05,
  detune = 0
) => {
  const oscillator = context.createOscillator();
  const gain = context.createGain();

  oscillator.type = type;
  oscillator.frequency.value = frequency;
  oscillator.detune.value = detune;
  gain.gain.value = volume;

  oscillator.connect(gain).connect(context.destination);
  oscillator.start();
  oscillator.stop(context.currentTime + duration);
};

const playNoise = (context: AudioContext, duration: number, volume = 0.02) => {
  const bufferSize = context.sampleRate * duration;
  const buffer = context.createBuffer(1, bufferSize, context.sampleRate);
  const output = buffer.getChannelData(0);

  for (let i = 0; i < bufferSize; i += 1) {
    output[i] = Math.random() * 2 - 1;
  }

  const noise = context.createBufferSource();
  noise.buffer = buffer;

  const filter = context.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.value = 500;

  const gain = context.createGain();
  gain.gain.value = volume;

  noise.connect(filter).connect(gain).connect(context.destination);
  noise.start();
};

export const resumeContext = () => {
  if (audioContext && audioContext.state === 'suspended') {
    audioContext.resume();
  }
};

export const setMuted = (muted: boolean) => {
  isMuted = muted;
};

export const playSound = (sfx: SoundEffect) => {
  if (isMuted) return;

  const context = ensureContext();

  if (!context) {
    console.log('PLAY SOUND:', sfx);
    return;
  }

  switch (sfx) {
    case 'click':
      playTone(context, 880, 0.08, 'square', 0.06);
      playTone(context, 660, 0.07, 'square', 0.04, -10);
      break;
    case 'cash':
      playTone(context, 523.25, 0.12, 'triangle', 0.08);
      playTone(context, 659.25, 0.12, 'triangle', 0.08, 25);
      playTone(context, 783.99, 0.12, 'triangle', 0.06, 25);
      break;
    case 'error':
      playTone(context, 200, 0.25, 'sawtooth', 0.1);
      break;
    case 'wind':
      playNoise(context, 1, 0.04);
      break;
    default:
      console.log('PLAY SOUND:', sfx);
  }
};

export const SoundManager = {
  playSound,
  setMuted,
  resumeContext,
};
