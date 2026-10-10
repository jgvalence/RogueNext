import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  COMBAT_SPEED_EVENT,
  readCombatSpeed,
  scaleCombatDelay,
  writeCombatSpeed,
} from "./combat-speed";

describe("combat speed", () => {
  beforeEach(() => window.localStorage.clear());

  it("persists the selected speed and scales every timed sequence", () => {
    writeCombatSpeed(2);
    expect(readCombatSpeed()).toBe(2);
    expect(scaleCombatDelay(800)).toBe(400);
    expect(scaleCombatDelay(900, 1.5)).toBe(600);
  });

  it("notifies mounted combat views immediately", () => {
    const listener = vi.fn();
    window.addEventListener(COMBAT_SPEED_EVENT, listener);
    writeCombatSpeed(1.5);
    expect(listener).toHaveBeenCalledOnce();
    window.removeEventListener(COMBAT_SPEED_EVENT, listener);
  });
});
