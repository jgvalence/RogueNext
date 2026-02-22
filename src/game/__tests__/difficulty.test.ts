import { describe, expect, it } from "vitest";
import {
  getUnlockedDifficultyLevels,
  getUnlockedMaxDifficultyFromResources,
  unlockNextDifficultyOnVictory,
} from "../engine/difficulty";

describe("Run difficulty progression", () => {
  it("starts with difficulty 0 unlocked", () => {
    expect(getUnlockedDifficultyLevels({})).toEqual([0]);
    expect(getUnlockedMaxDifficultyFromResources({})).toBe(0);
  });

  it("unlocks only the next difficulty on victory at current max", () => {
    const resources0 = {};
    const resources1 = unlockNextDifficultyOnVictory(resources0, 0);
    expect(getUnlockedMaxDifficultyFromResources(resources1)).toBe(1);

    const resources2 = unlockNextDifficultyOnVictory(resources1, 0);
    expect(getUnlockedMaxDifficultyFromResources(resources2)).toBe(1);

    const resources3 = unlockNextDifficultyOnVictory(resources2, 1);
    expect(getUnlockedMaxDifficultyFromResources(resources3)).toBe(2);
  });
});
