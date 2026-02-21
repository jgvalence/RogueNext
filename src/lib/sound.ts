/**
 * SOUND SYNTHESIS — Web Audio API
 *
 * All sounds are generated procedurally at runtime — no audio files required.
 * To disable all sounds (e.g. while testing), set SOUNDS_ENABLED = false.
 *
 * To add a new sound, add a key to SoundKey and define a synth in SOUND_SYNTHS.
 */

export let SOUNDS_ENABLED = true;

// ── Audio context (lazy singleton) ────────────────────────────────────────────

let _ctx: AudioContext | null = null;

function getCtx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!_ctx) {
    _ctx = new (
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext })
        .webkitAudioContext
    )();
  }
  // Resume after browser autoplay policy suspends it
  if (_ctx.state === "suspended") {
    void _ctx.resume();
  }
  return _ctx;
}

// ── Primitive helpers ──────────────────────────────────────────────────────────

/** Play a simple oscillator tone with exponential fade-out */
function tone(
  c: AudioContext,
  freq: number,
  type: OscillatorType,
  at: number,
  dur: number,
  vol: number,
  freqEnd?: number
): void {
  const osc = c.createOscillator();
  const gain = c.createGain();
  osc.connect(gain);
  gain.connect(c.destination);

  osc.type = type;
  osc.frequency.setValueAtTime(freq, at);
  if (freqEnd !== undefined) {
    osc.frequency.exponentialRampToValueAtTime(Math.max(freqEnd, 1), at + dur);
  }

  gain.gain.setValueAtTime(0, at);
  gain.gain.linearRampToValueAtTime(vol, at + 0.005);
  gain.gain.exponentialRampToValueAtTime(0.001, at + dur);

  osc.start(at);
  osc.stop(at + dur + 0.02);
}

/** Play a short burst of filtered white noise */
function noiseBlip(
  c: AudioContext,
  at: number,
  dur: number,
  vol: number,
  filterHz = 2000
): void {
  const bufLen = Math.max(1, Math.floor(c.sampleRate * dur));
  const buf = c.createBuffer(1, bufLen, c.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < bufLen; i++) data[i] = Math.random() * 2 - 1;

  const src = c.createBufferSource();
  src.buffer = buf;

  const filt = c.createBiquadFilter();
  filt.type = "lowpass";
  filt.frequency.setValueAtTime(filterHz, at);

  const gain = c.createGain();
  gain.gain.setValueAtTime(vol, at);
  gain.gain.exponentialRampToValueAtTime(0.001, at + dur);

  src.connect(filt);
  filt.connect(gain);
  gain.connect(c.destination);
  src.start(at);
  src.stop(at + dur);
}

// ── Sound definitions ──────────────────────────────────────────────────────────

export type SoundKey =
  | "CARD_PLAY"
  | "CARD_DRAW"
  | "PLAYER_HIT"
  | "ENEMY_ATTACK"
  | "ENEMY_HIT"
  | "ENEMY_DEATH"
  | "VICTORY"
  | "DEFEAT"
  | "BUTTON_CLICK";

const SOUND_SYNTHS: Record<SoundKey, (c: AudioContext, vol: number) => void> = {
  // Soft "fwip" — quick triangle sweep + noise transient
  CARD_PLAY: (c, vol) => {
    const t = c.currentTime;
    tone(c, 900, "triangle", t, 0.09, vol * 0.35, 220);
    noiseBlip(c, t, 0.07, vol * 0.12, 3500);
  },

  // Paper "shk" — high noise burst
  CARD_DRAW: (c, vol) => {
    const t = c.currentTime;
    noiseBlip(c, t, 0.06, vol * 0.18, 5000);
    tone(c, 2400, "sine", t, 0.05, vol * 0.08, 900);
  },

  // Heavy thud — sub sine + noise
  PLAYER_HIT: (c, vol) => {
    const t = c.currentTime;
    tone(c, 90, "sine", t, 0.28, vol * 0.55, 28);
    noiseBlip(c, t, 0.12, vol * 0.28, 600);
  },

  // Sword swing — sawtooth sweep + whoosh noise
  ENEMY_ATTACK: (c, vol) => {
    const t = c.currentTime;
    tone(c, 320, "sawtooth", t, 0.14, vol * 0.28, 70);
    noiseBlip(c, t, 0.16, vol * 0.18, 2200);
  },

  // Sharp crack — square hit + impact noise
  ENEMY_HIT: (c, vol) => {
    const t = c.currentTime;
    tone(c, 380, "square", t, 0.07, vol * 0.25, 95);
    noiseBlip(c, t, 0.07, vol * 0.2, 1800);
  },

  // Death rattle — descending sawtooth + rumble
  ENEMY_DEATH: (c, vol) => {
    const t = c.currentTime;
    tone(c, 420, "sawtooth", t, 0.55, vol * 0.38, 45);
    tone(c, 210, "sine", t + 0.08, 0.45, vol * 0.2, 28);
    noiseBlip(c, t, 0.35, vol * 0.18, 900);
  },

  // C5→E5→G5→C6 ascending arpeggio
  VICTORY: (c, vol) => {
    const t = c.currentTime;
    [523.25, 659.25, 784.0, 1046.5].forEach((f, i) => {
      tone(c, f, "sine", t + i * 0.13, 0.4, vol * 0.38);
      tone(c, f, "triangle", t + i * 0.13, 0.35, vol * 0.12);
    });
  },

  // C4→Ab3→F3 descending minor hits
  DEFEAT: (c, vol) => {
    const t = c.currentTime;
    [261.63, 207.65, 174.61].forEach((f, i) => {
      tone(c, f, "sine", t + i * 0.45, 0.7, vol * 0.32);
      tone(c, f * 0.5, "sine", t + i * 0.45, 0.7, vol * 0.12);
    });
  },

  // UI tick
  BUTTON_CLICK: (c, vol) => {
    const t = c.currentTime;
    tone(c, 1100, "triangle", t, 0.055, vol * 0.18, 550);
  },
};

// ── Public API ─────────────────────────────────────────────────────────────────

export function setSoundsEnabled(enabled: boolean): void {
  SOUNDS_ENABLED = enabled;
}

export function playSound(key: SoundKey, volume = 0.7): void {
  if (!SOUNDS_ENABLED) return;
  const c = getCtx();
  if (!c) return;
  SOUND_SYNTHS[key]?.(c, volume);
}
