/**
 * BACKGROUND MUSIC — Web Audio API synthesis
 *
 * Two procedural themes generated at runtime — no audio files needed.
 * - "combat"  : dark drone + rhythmic bass pulse + sparse melody
 * - "map"     : slow ambient pad swell + occasional soft notes
 *
 * To globally disable music, set MUSIC_ENABLED = false.
 */

export let MUSIC_ENABLED = true;
export type MusicTheme = "combat" | "map";

// ── AudioContext (lazy singleton, separate from sound.ts) ─────────────────────

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
  if (_ctx.state === "suspended") void _ctx.resume();
  return _ctx;
}

// ── Session — one per active theme ───────────────────────────────────────────

interface Session {
  cancelled: boolean;
  masterGain: GainNode;
  oscs: OscillatorNode[]; // sustained oscillators, stopped on cleanup
}

let _session: Session | null = null;
let _currentTheme: MusicTheme | null = null;

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Sustained oscillator, tracked for cleanup */
function drone(
  c: AudioContext,
  s: Session,
  dest: AudioNode,
  freq: number,
  type: OscillatorType,
  vol: number
): void {
  const osc = c.createOscillator();
  const gain = c.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, c.currentTime);
  gain.gain.setValueAtTime(vol, c.currentTime);
  osc.connect(gain);
  gain.connect(dest);
  osc.start();
  s.oscs.push(osc);
}

/** One-shot note (self-stops, not tracked) */
function hit(
  c: AudioContext,
  dest: AudioNode,
  freq: number,
  type: OscillatorType,
  at: number,
  dur: number,
  vol: number,
  freqEnd?: number
): void {
  const osc = c.createOscillator();
  const gain = c.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, at);
  if (freqEnd !== undefined) {
    osc.frequency.exponentialRampToValueAtTime(Math.max(freqEnd, 1), at + dur);
  }
  gain.gain.setValueAtTime(0, at);
  gain.gain.linearRampToValueAtTime(vol, at + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.001, at + dur);
  osc.connect(gain);
  gain.connect(dest);
  osc.start(at);
  osc.stop(at + dur + 0.05);
}

// ── Combat theme ──────────────────────────────────────────────────────────────
// 76 BPM — dark, tense, rhythmic
// A minor pentatonic melody over sub-bass drone

const BEAT = 60 / 76; // ~0.79s
const AM_PENTA = [220, 261.63, 293.66, 329.63, 392, 440]; // A3-A4

function runCombat(c: AudioContext, s: Session): void {
  // Sustained drones: A1 sub + E2 fifth + A2 overtone
  drone(c, s, s.masterGain, 55, "sine", 0.045);
  drone(c, s, s.masterGain, 82.41, "sine", 0.028);
  drone(c, s, s.masterGain, 110, "triangle", 0.016);

  let beat = 0;
  let next = c.currentTime + 0.1;

  const tick = () => {
    if (s.cancelled) return;

    while (next < c.currentTime + 0.15) {
      const b = beat % 4;

      // Bass pulse on beats 1 (strong) and 3 (softer)
      if (b === 0 || b === 2) {
        const vol = b === 0 ? 0.2 : 0.12;
        hit(c, s.masterGain, 55, "sine", next, 0.5, vol, 28);
        hit(c, s.masterGain, 120, "square", next, 0.05, vol * 0.22);
      }

      // Sparse melodic note — 45% chance every bar (beat 0)
      if (b === 0 && beat > 0 && Math.random() < 0.45) {
        const freq =
          AM_PENTA[Math.floor(Math.random() * AM_PENTA.length)] ?? AM_PENTA[0]!;
        hit(
          c,
          s.masterGain,
          freq,
          "triangle",
          next + BEAT * 0.6,
          BEAT * 1.8,
          0.032
        );
      }

      next += BEAT;
      beat++;
    }

    setTimeout(tick, 25);
  };

  tick();
}

// ── Map / exploration theme ───────────────────────────────────────────────────
// Slow pad swells in A minor — atmospheric, mysterious

// A2, E3, A3, C3 (A minor chord with open fifth)
const PAD_FREQS = [110, 164.81, 220, 130.81];
const PAD_VOLS = [0.024, 0.017, 0.014, 0.012];

const FADE_IN = 4; // seconds
const HOLD = 7;
const FADE_OUT = 4;
const REST = 2;
const SWELL_PERIOD = (FADE_IN + HOLD + FADE_OUT + REST) * 1000; // ms

// A minor pentatonic notes for soft melody hits
const MAP_NOTES = [220, 261.63, 293.66, 329.63, 392];

function runMap(c: AudioContext, s: Session): void {
  // Build pad oscillators with individual gain nodes
  const padGains: GainNode[] = PAD_FREQS.map((freq) => {
    const osc = c.createOscillator();
    const gain = c.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(freq, c.currentTime);
    gain.gain.setValueAtTime(0.001, c.currentTime);
    osc.connect(gain);
    gain.connect(s.masterGain);
    osc.start();
    s.oscs.push(osc);
    return gain;
  });

  // Repeating swell: fade in → hold → fade out → rest → repeat
  const swell = (at: number) => {
    if (s.cancelled) return;
    padGains.forEach((g, i) => {
      g.gain.cancelScheduledValues(at);
      g.gain.setValueAtTime(0.001, at);
      g.gain.linearRampToValueAtTime(PAD_VOLS[i] ?? 0.01, at + FADE_IN);
      g.gain.setValueAtTime(PAD_VOLS[i] ?? 0.01, at + FADE_IN + HOLD);
      g.gain.linearRampToValueAtTime(0.001, at + FADE_IN + HOLD + FADE_OUT);
    });
    setTimeout(() => swell(c.currentTime), SWELL_PERIOD);
  };
  swell(c.currentTime);

  // Occasional soft melodic note every 5–12 s
  const melody = () => {
    if (s.cancelled) return;
    setTimeout(
      () => {
        if (s.cancelled) return;
        const freq =
          MAP_NOTES[Math.floor(Math.random() * MAP_NOTES.length)] ??
          MAP_NOTES[0]!;
        hit(c, s.masterGain, freq, "sine", c.currentTime, 3.5, 0.018);
        melody();
      },
      5000 + Math.random() * 7000
    );
  };
  melody();
}

// ── Public API ────────────────────────────────────────────────────────────────

let _lastTheme: MusicTheme | null = null; // remembered for unmute

export function setMusicEnabled(enabled: boolean): void {
  MUSIC_ENABLED = enabled;
  if (!enabled) {
    _lastTheme = _currentTheme;
    stopMusic(0.3);
  } else if (_lastTheme) {
    startMusic(_lastTheme);
  }
}

export function startMusic(theme: MusicTheme): void {
  if (!MUSIC_ENABLED) return;
  if (_currentTheme === theme) return; // already playing this theme

  stopMusic(0.8); // fade out current theme quickly before switching

  const c = getCtx();
  if (!c) return;

  _currentTheme = theme;

  const master = c.createGain();
  master.gain.setValueAtTime(0, c.currentTime);
  master.gain.linearRampToValueAtTime(1, c.currentTime + 2.5); // 2.5s fade in
  master.connect(c.destination);

  _session = { cancelled: false, masterGain: master, oscs: [] };

  if (theme === "combat") runCombat(c, _session);
  else runMap(c, _session);
}

export function stopMusic(fadeOutSec = 1.5): void {
  if (!_session) return;

  const s = _session;
  _session = null;
  _currentTheme = null;

  s.cancelled = true; // stops all internal loops

  if (_ctx) {
    s.masterGain.gain.cancelScheduledValues(_ctx.currentTime);
    s.masterGain.gain.setValueAtTime(s.masterGain.gain.value, _ctx.currentTime);
    s.masterGain.gain.linearRampToValueAtTime(0, _ctx.currentTime + fadeOutSec);
  }

  // Stop sustained oscillators after fade
  setTimeout(
    () => {
      for (const osc of s.oscs) {
        try {
          osc.stop();
        } catch {
          /* already stopped */
        }
      }
    },
    (fadeOutSec + 0.1) * 1000
  );
}
