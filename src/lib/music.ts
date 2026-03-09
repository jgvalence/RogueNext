export let MUSIC_ENABLED = true;
export type MusicTheme = "menu" | "combat" | "elite" | "boss" | "map";

interface ThemeTrackConfig {
  src: string;
  volume: number;
  loop: boolean;
}

interface ActiveTrack {
  audio: HTMLAudioElement;
  fadeTimer: number | null;
  targetVolume: number;
}

const THEME_TRACKS: Record<MusicTheme, ThemeTrackConfig> = {
  menu: {
    src: "/sounds/music/map.ogg",
    volume: 0.3,
    loop: true,
  },
  map: {
    src: "/sounds/music/map.ogg",
    volume: 0.36,
    loop: true,
  },
  combat: {
    src: "/sounds/music/combat.ogg",
    volume: 0.48,
    loop: true,
  },
  elite: {
    src: "/sounds/music/elite.ogg",
    volume: 0.46,
    loop: true,
  },
  boss: {
    src: "/sounds/music/boss.ogg",
    volume: 0.42,
    loop: true,
  },
};

const DEFAULT_FADE_MS = 1200;
const FADE_STEP_MS = 50;

let _currentTrack: ActiveTrack | null = null;
let _currentTheme: MusicTheme | null = null;
let _lastTheme: MusicTheme | null = null;
let _pendingTheme: MusicTheme | null = null;
let _autoplayRecoveryBound = false;

function isBrowser(): boolean {
  return typeof window !== "undefined";
}

function clearFade(track: ActiveTrack): void {
  if (track.fadeTimer === null || !isBrowser()) return;
  window.clearInterval(track.fadeTimer);
  track.fadeTimer = null;
}

function disposeTrack(track: ActiveTrack): void {
  clearFade(track);
  track.audio.pause();
  track.audio.removeAttribute("src");
  track.audio.load();
}

function fadeTrack(
  track: ActiveTrack,
  targetVolume: number,
  durationMs: number,
  onComplete?: () => void
): void {
  clearFade(track);

  if (!isBrowser() || durationMs <= 0) {
    track.audio.volume = targetVolume;
    onComplete?.();
    return;
  }

  const startVolume = track.audio.volume;
  const startedAt = performance.now();
  track.targetVolume = targetVolume;

  track.fadeTimer = window.setInterval(() => {
    const elapsed = performance.now() - startedAt;
    const progress = Math.min(1, elapsed / durationMs);
    track.audio.volume =
      startVolume + (track.targetVolume - startVolume) * progress;

    if (progress < 1) return;

    clearFade(track);
    onComplete?.();
  }, FADE_STEP_MS);
}

function ensureAutoplayRecovery(): void {
  if (!isBrowser() || _autoplayRecoveryBound) return;
  _autoplayRecoveryBound = true;

  const retryPendingTheme = () => {
    if (!_pendingTheme || !MUSIC_ENABLED) return;
    const theme = _pendingTheme;
    _pendingTheme = null;
    startMusic(theme);
  };

  window.addEventListener("pointerdown", retryPendingTheme);
  window.addEventListener("keydown", retryPendingTheme);
  window.addEventListener("touchstart", retryPendingTheme);
}

function stopTrack(track: ActiveTrack, fadeOutMs: number): void {
  fadeTrack(track, 0, fadeOutMs, () => disposeTrack(track));
}

function createTrack(theme: MusicTheme): ActiveTrack {
  const config = THEME_TRACKS[theme];
  const audio = new Audio(config.src);
  audio.loop = config.loop;
  audio.preload = "auto";
  audio.volume = 0;

  return {
    audio,
    fadeTimer: null,
    targetVolume: config.volume,
  };
}

function getTrackSrc(theme: MusicTheme): string {
  if (!isBrowser()) return THEME_TRACKS[theme].src;
  return new URL(THEME_TRACKS[theme].src, window.location.origin).href;
}

export function setMusicEnabled(enabled: boolean): void {
  MUSIC_ENABLED = enabled;

  if (!enabled) {
    _lastTheme = _currentTheme ?? _pendingTheme;
    stopMusic(0.3);
    return;
  }

  const themeToResume = _pendingTheme ?? _lastTheme;
  if (themeToResume) startMusic(themeToResume);
}

export function startMusic(theme: MusicTheme): void {
  if (!MUSIC_ENABLED || !isBrowser()) return;
  if (_currentTheme === theme && _currentTrack) return;

  _lastTheme = theme;
  _pendingTheme = null;

  const config = THEME_TRACKS[theme];
  const currentTrackSrc =
    _currentTrack?.audio.currentSrc || _currentTrack?.audio.src || null;
  if (_currentTrack && currentTrackSrc === getTrackSrc(theme)) {
    _currentTheme = theme;
    _currentTrack.audio.loop = config.loop;
    fadeTrack(_currentTrack, config.volume, 500);
    return;
  }

  const previousTrack = _currentTrack;
  if (previousTrack) stopTrack(previousTrack, 800);

  const track = createTrack(theme);
  _currentTrack = track;
  _currentTheme = theme;

  const handlePlaybackFailure = () => {
    if (_currentTrack !== track) return;
    _currentTrack = null;
    _currentTheme = null;
    _pendingTheme = theme;
    disposeTrack(track);
    ensureAutoplayRecovery();
  };

  track.audio.addEventListener("error", handlePlaybackFailure, { once: true });

  void track.audio
    .play()
    .then(() => {
      if (_currentTrack !== track) {
        disposeTrack(track);
        return;
      }

      fadeTrack(track, config.volume, DEFAULT_FADE_MS);
    })
    .catch(() => {
      handlePlaybackFailure();
    });
}

export function stopMusic(fadeOutSec = 1.5): void {
  _pendingTheme = null;

  const track = _currentTrack;
  _currentTrack = null;
  _currentTheme = null;

  if (!track) return;

  stopTrack(track, Math.max(0, fadeOutSec * 1000));
}
