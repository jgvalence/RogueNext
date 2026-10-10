export type AudioPreferences = { music: number; effects: number };
const KEY = "panlibrarium.audio.v1";
const clamp = (value: unknown) =>
  typeof value === "number" && Number.isFinite(value)
    ? Math.max(0, Math.min(1, value))
    : 1;
export function readAudioPreferences(): AudioPreferences {
  try {
    const value = JSON.parse(localStorage.getItem(KEY) ?? "{}");
    return { music: clamp(value.music), effects: clamp(value.effects) };
  } catch {
    return { music: 1, effects: 1 };
  }
}
export function writeAudioPreferences(preferences: AudioPreferences): void {
  try {
    localStorage.setItem(
      KEY,
      JSON.stringify({
        music: clamp(preferences.music),
        effects: clamp(preferences.effects),
      })
    );
  } catch {
    /* Private browsing can deny storage. */
  }
}
