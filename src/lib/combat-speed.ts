export type CombatSpeed = 1 | 1.5 | 2;

export const COMBAT_SPEED_STORAGE_KEY = "panlibrarium:combat-speed";
export const COMBAT_SPEED_EVENT = "game:combat-speed-change";

export function readCombatSpeed(): CombatSpeed {
  if (typeof window === "undefined") return 1;
  const value = Number(window.localStorage.getItem(COMBAT_SPEED_STORAGE_KEY));
  return value === 1.5 || value === 2 ? value : 1;
}

export function writeCombatSpeed(speed: CombatSpeed): void {
  window.localStorage.setItem(COMBAT_SPEED_STORAGE_KEY, String(speed));
  window.dispatchEvent(
    new CustomEvent(COMBAT_SPEED_EVENT, { detail: { speed } })
  );
}

export function scaleCombatDelay(
  milliseconds: number,
  speed: CombatSpeed = readCombatSpeed()
): number {
  return milliseconds / speed;
}
