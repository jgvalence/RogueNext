export let HAPTICS_ENABLED = true;

export function setHapticsEnabled(enabled: boolean): void {
  HAPTICS_ENABLED = enabled;
}

export function vibrate(pattern: number | number[]): void {
  if (!HAPTICS_ENABLED) return;
  if (typeof navigator === "undefined" || !navigator.vibrate) return;
  navigator.vibrate(pattern);
}
