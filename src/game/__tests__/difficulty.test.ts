import { describe, expect, it } from "vitest";
import {
  eliteCanDropRelic,
  getBossDebuffBonus,
  getDifficultyModifiers,
  getEnemyStartingBlock,
  getUnlockedDifficultyLevels,
  getUnlockedMaxDifficultyFromResources,
  shouldHideEnemyIntent,
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

  it("applies new gameplay rules at difficulty 3/4/5", () => {
    expect(shouldHideEnemyIntent(3, 3, { isElite: true })).toBe(true);
    expect(shouldHideEnemyIntent(3, 2, { isBoss: true })).toBe(false);
    expect(getEnemyStartingBlock(3, 2, { isBoss: true })).toBe(10);
    expect(getEnemyStartingBlock(4, 2, { isElite: true })).toBe(10);
    expect(getBossDebuffBonus(4)).toBe(1);
    expect(eliteCanDropRelic(5, 0.2)).toBe(false);
    expect(eliteCanDropRelic(5, 0.8)).toBe(true);
  });

  it("increases elite encounter pressure at difficulty 5", () => {
    expect(getDifficultyModifiers(4).eliteChanceBonus).toBe(0.08);
    expect(getDifficultyModifiers(5).eliteChanceBonus).toBe(0.24);
  });
});
