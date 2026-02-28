import { describe, expect, it } from "vitest";
import {
  computeUnlockedRelicIds,
  eliteCanDropRelic,
  filterCardIdsByDifficulty,
  filterRelicsByDifficulty,
  getBossDebuffBonus,
  getBestInfiniteFloor,
  getBestGoldInSingleRun,
  getDifficultyModifiers,
  getEnemyStartingBlock,
  getPostFloorFiveEscalation,
  getUnlockedDifficultyLevels,
  getUnlockedMaxDifficultyFromResources,
  isRelicUnlocked,
  shouldHideEnemyIntent,
  unlockNextDifficultyOnVictory,
  updateBestInfiniteFloor,
  updateBestGoldInSingleRun,
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

  it("unlocks new healing relics with run-win conditions", () => {
    const baseProgress = {
      totalRuns: 5,
      wonRuns: 2,
      unlockedDifficultyMax: 5,
      winsByDifficulty: { "1": 1 },
    };
    expect(isRelicUnlocked("vital_flask", baseProgress)).toBe(true);
    expect(isRelicUnlocked("menders_charm", baseProgress)).toBe(false);

    const lateProgress = {
      totalRuns: 7,
      wonRuns: 5,
      unlockedDifficultyMax: 0,
      winsByDifficulty: { "1": 1, "3": 1 },
    };
    expect(isRelicUnlocked("menders_charm", lateProgress)).toBe(true);

    const unlocked = computeUnlockedRelicIds(
      ["vital_flask", "menders_charm"],
      lateProgress
    );
    expect(unlocked).toEqual(["vital_flask", "menders_charm"]);
  });

  it("tracks and uses best gold from a single run for relic unlocks", () => {
    const emptyResources = {};
    expect(getBestGoldInSingleRun(emptyResources)).toBe(0);

    const withBest = updateBestGoldInSingleRun(emptyResources, 260);
    expect(getBestGoldInSingleRun(withBest)).toBe(260);

    const noDowngrade = updateBestGoldInSingleRun(withBest, 120);
    expect(getBestGoldInSingleRun(noDowngrade)).toBe(260);

    expect(
      isRelicUnlocked("gilded_ledger", {
        totalRuns: 10,
        wonRuns: 5,
        unlockedDifficultyMax: 5,
        winsByDifficulty: { "2": 1 },
        bestGoldInSingleRun: 200,
      })
    ).toBe(false);

    expect(
      isRelicUnlocked("gilded_ledger", {
        totalRuns: 10,
        wonRuns: 5,
        unlockedDifficultyMax: 5,
        winsByDifficulty: { "2": 1 },
        bestGoldInSingleRun: 260,
      })
    ).toBe(true);
  });

  it("tracks best floor reached in infinite mode", () => {
    const emptyResources = {};
    expect(getBestInfiniteFloor(emptyResources)).toBe(0);

    const withBest = updateBestInfiniteFloor(emptyResources, 9);
    expect(getBestInfiniteFloor(withBest)).toBe(9);

    const noDowngrade = updateBestInfiniteFloor(withBest, 7);
    expect(getBestInfiniteFloor(noDowngrade)).toBe(9);
  });

  it("adds a steep post-floor-5 escalation only when enabled", () => {
    expect(getPostFloorFiveEscalation(5, false)).toEqual({
      enemyHpMultiplier: 1,
      enemyDamageMultiplier: 1,
      eliteChanceBonus: 0,
    });
    expect(getPostFloorFiveEscalation(5, true)).toEqual({
      enemyHpMultiplier: 1,
      enemyDamageMultiplier: 1,
      eliteChanceBonus: 0,
    });

    const floor6 = getPostFloorFiveEscalation(6, true);
    const floor7 = getPostFloorFiveEscalation(7, true);

    // Immediate spike right after floor 5.
    expect(floor6.enemyHpMultiplier).toBeGreaterThan(1.8);
    expect(floor6.enemyDamageMultiplier).toBeGreaterThan(1.55);
    expect(floor6.eliteChanceBonus).toBeGreaterThan(0.17);

    // Then scaling keeps ramping aggressively each floor.
    expect(floor7.enemyHpMultiplier).toBeGreaterThan(3.4);
    expect(floor7.enemyDamageMultiplier).toBeGreaterThan(2.5);
    expect(floor7.enemyHpMultiplier).toBeGreaterThan(floor6.enemyHpMultiplier);
    expect(floor7.enemyDamageMultiplier).toBeGreaterThan(
      floor6.enemyDamageMultiplier
    );
    expect(floor7.eliteChanceBonus).toBeGreaterThan(floor6.eliteChanceBonus);
  });

  it("does not gate cards/relics by difficulty anymore", () => {
    expect(
      filterCardIdsByDifficulty(["final_chapter", "redacted_blast"], 0)
    ).toEqual(["final_chapter", "redacted_blast"]);
    expect(
      filterRelicsByDifficulty(
        [
          { id: "blood_grimoire", name: "", description: "", rarity: "BOSS" },
          { id: "runic_bulwark", name: "", description: "", rarity: "RARE" },
        ],
        0
      ).map((r) => r.id)
    ).toEqual(["blood_grimoire", "runic_bulwark"]);
  });
});
